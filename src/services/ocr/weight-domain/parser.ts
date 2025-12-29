import type { BoundingBox, BodyMetrics, PairedItem } from '../types'
import { createCorrectionAgent } from './ocr-agent'
import { isSameLine, extractNumber } from '../utils/geometry'
import {
  KEYWORDS,
  BODY_TYPE_VALUES,
  METRIC_KEY_MAP,
  UNITS_REGEX,
  INITIAL_METRICS
} from './constants'

/**
 * 智能配对与解析主函数
 * @param recognizedBoxes 第一轮标准 OCR 的结果
 * @param imageElement 原始图片 (Agent 重试需要用到)
 */
export async function pairAndParseResults(
  recognizedBoxes: BoundingBox[],
  imageElement: HTMLImageElement
): Promise<{ rawText: string; parsedData: BodyMetrics }> {
  console.log('--- 开始智能配对与解析 ---')

  // 1. 预分类
  const names: BoundingBox[] = []
  const values: BoundingBox[] = []
  const statuses: BoundingBox[] = []
  const others: BoundingBox[] = []

  for (const box of recognizedBoxes) {
    const text = box.text?.trim() ?? ''
    if (!text) continue
    if (KEYWORDS.NAMES.some(k => text.startsWith(k))) names.push(box)
    else if (KEYWORDS.STATUS.some(k => text.includes(k))) statuses.push(box)
    else if (/\d/.test(text)) values.push(box)
    else others.push(box)
  }

  // 2. 提取体型
  let foundBodyType = ''
  const allCandidates = [...others, ...statuses, ...values]
  for (const box of allCandidates) {
    const match = BODY_TYPE_VALUES.find(bt => box.text?.includes(bt))
    if (match) {
      foundBodyType = box.text ?? ''
      break
    }
  }

  // 3. 几何配对 (Standard 模式的结果)
  const tempPairs: Record<string, PairedItem> = {} // 暂存配对结果
  const groupedNames: Record<string, BoundingBox[] | undefined> = {}
  names.forEach(box => {
    const key = box.text?.replace(/[\s(%)（）]/g, '') ?? ''
    groupedNames[key] ??= []
    groupedNames[key].push(box)
  })

  const unmatchedValues = new Set(values)

  Object.keys(groupedNames).forEach(key => {
    const candidateNameBoxes = groupedNames[key] ?? []
    let bestPair = { valueBox: null as BoundingBox | null, distance: Infinity }

    for (const nameBox of candidateNameBoxes) {
      const [, , nright] = nameBox.box
      for (const valueBox of unmatchedValues) {
        const [vx, , vright] = valueBox.box

        // 几何判断：右侧 + 同一行
        const isRightSide = (vx + vright) / 2 > nright - 20
        const isAligned = isSameLine(nameBox, valueBox)

        if (isRightSide && isAligned) {
          const distance = vx - nright
          if (distance > -50 && distance < bestPair.distance) {
            bestPair = { valueBox, distance }
          }
        }
      }
    }

    if (bestPair.valueBox) {
      // ✅ 关键点：这里我们只拿到了初步的文本（比如 "119"）
      // 我们把 box 也存下来，交给后面的 Agent 审查
      const rawValue =
        bestPair.valueBox.text?.replace(UNITS_REGEX, '').trim() ?? ''

      tempPairs[key] = {
        key,
        valueText: rawValue,
        box: bestPair.valueBox // 保存 Box，Agent 需要它来切图
      }
      unmatchedValues.delete(bestPair.valueBox)
    }
  })

  // ---------------------------------------------------------
  // 4. Agent 介入阶段 (你的核心需求)
  // ---------------------------------------------------------
  // 初始化 Agent 链
  const correctionAgent = createCorrectionAgent()
  const finalMetrics = {
    ...INITIAL_METRICS,
    bodyType: foundBodyType || '未识别到'
  }
  const rawTextLines: string[] = []

  // 遍历所有配对好的数据
  for (const key in tempPairs) {
    const item = tempPairs[key]

    // 🧠 调用 Agent：检查 -> (如果需要) 重试 -> 返回最终结果
    // 这一步实现了：如果 "蛋白质率" 是 "119"，Agent 会用 Aggressive 模式重跑这个 Box
    const agentResult = await correctionAgent.invoke({
      key: item.key,
      originalText: item.valueText,
      box: item.box,
      image: imageElement // 传入原图，Agent 切图必须
    })

    // 处理 Agent 的返回结果
    const finalValStr = agentResult.finalText

    // 映射到最终数据结构
    const metricKey = METRIC_KEY_MAP[key]
    if (metricKey) {
      // 如果是状态词（如“偏胖”），直接存
      if (KEYWORDS.STATUS.includes(finalValStr)) {
        ;(finalMetrics as any)[metricKey] = finalValStr
      } else {
        // 提取数字
        const num = extractNumber(finalValStr)
        if (num !== undefined) {
          ;(finalMetrics as any)[metricKey] = num
        }
      }
    }

    rawTextLines.push(
      `${key}: ${finalValStr}${agentResult.isCorrected ? ' (修正)' : ''}`
    )
  }

  console.log('最终结构化数据:', finalMetrics)
  return { rawText: rawTextLines.join('\n'), parsedData: finalMetrics }
}
