import type {
  AgentContext,
  BoundingBox,
  BodyMetrics,
  PairedItem
} from '../types'
import { createCorrectionAgent } from './ocr-agent'
import { isSameLine, extractNumber } from '../utils/geometry'
import {
  KEYWORDS,
  BODY_TYPE_VALUES,
  METRIC_KEY_MAP,
  UNITS_REGEX,
  INITIAL_METRICS
} from './constants'

// 1. 预处理与分类 ---
function classifyBoxes(boxes: BoundingBox[]) {
  const names: BoundingBox[] = []
  const values: BoundingBox[] = []
  const statuses: BoundingBox[] = []
  const others: BoundingBox[] = []

  for (const box of boxes) {
    const text = box.text?.trim() ?? ''
    if (!text) continue
    if (KEYWORDS.NAMES.some(k => text.startsWith(k))) names.push(box)
    else if (KEYWORDS.STATUS.some(k => text.includes(k))) statuses.push(box)
    else if (/\d/.test(text)) values.push(box)
    else others.push(box)
  }
  return { names, values, statuses, others }
}

// 2. 提取体型 (独立逻辑) ---
function extractBodyType(candidates: BoundingBox[]): string {
  for (const box of candidates) {
    const match = BODY_TYPE_VALUES.find(bt => box.text?.includes(bt))
    if (match) {
      return box.text ?? ''
    }
  }
  return ''
}

//  3. 几何配对 (核心算法) ---
function performGeometricPairing(
  names: BoundingBox[],
  values: BoundingBox[]
): Partial<Record<string, PairedItem>> {
  const tempPairs: Partial<Record<string, PairedItem>> = {}

  // 分组 Names
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

        const isRightSide = (vx + vright) / 2 > nright - 20
        const isAligned = isSameLine(nameBox, valueBox)

        if (isRightSide && isAligned) {
          const distance = vx - nright
          // 距离不过远，且是当前找到最近的
          if (distance > -50 && distance < bestPair.distance) {
            bestPair = { valueBox, distance }
          }
        }
      }
    }

    if (bestPair.valueBox) {
      const rawValue =
        bestPair.valueBox.text?.replace(UNITS_REGEX, '').trim() ?? ''
      tempPairs[key] = {
        key,
        valueText: rawValue,
        box: bestPair.valueBox
      }
      unmatchedValues.delete(bestPair.valueBox)
    }
  })

  return tempPairs
}

//  4. 提取上下文 ---
function extractContext(tempPairs: Partial<Record<string, PairedItem>>) {
  const getRawNum = (chnKey: string) => {
    const text = tempPairs[chnKey]?.valueText
    return text ? extractNumber(text) : undefined
  }

  const contextData: Record<string, number | undefined> = {
    weight: getRawNum('体重'),
    targetWeight:
      getRawNum('建议体重') ?? getRawNum('标准体重') ?? getRawNum('目标体重')
  }

  console.log('[Parser] Context Data:', contextData)
  return contextData
}

//  5. 并发执行 Agent (使用 Promise.allSettled) ---
async function runAgentsParallel(
  tempPairs: Partial<Record<string, PairedItem>>,
  dependencies: {
    historyData: BodyMetrics[]
    imageElement: HTMLImageElement
    contextData: Record<string, number | undefined>
  }
) {
  const correctionAgent = createCorrectionAgent()
  const validItems = Object.values(tempPairs).filter(
    (i): i is PairedItem => !!i
  )

  // 映射为 Promise 数组
  const promises = validItems.map(async item => {
    const input: AgentContext = {
      key: item.key,
      originalText: item.valueText,
      history: dependencies.historyData,
      image: dependencies.imageElement,
      box: item.box,
      context: dependencies.contextData
    }

    // 调用 Agent
    const agentResult = await correctionAgent.invoke(input)

    return {
      key: item.key,
      resultText: agentResult.finalText,
      isCorrected: agentResult.isCorrected
    }
  })

  // 🌟 使用 allSettled：即使某一个字段报错(比如 Agent 内部抛异常)，其他字段依然能正常返回
  const results = await Promise.allSettled(promises)

  // 过滤出成功的项，打印失败的日志
  const successfulResults: {
    key: string
    resultText: string
    isCorrected: boolean
  }[] = []

  results.forEach(res => {
    if (res.status === 'fulfilled') {
      successfulResults.push(res.value)
    } else {
      console.error('[Parser] Agent processing failed for an item:', res.reason)
    }
  })

  return successfulResults
}

// --- 6. 数据组装 (类型安全版) ---
function assembleFinalMetrics(
  agentResults: {
    key: string
    resultText: string
    isCorrected: boolean
  }[],
  initialBodyType: string
) {
  const finalMetrics: BodyMetrics = {
    ...INITIAL_METRICS,
    bodyType: initialBodyType || '未识别到'
  }
  const rawTextLines: string[] = []

  // 创建一个类型安全的赋值器
  // 我们知道 BodyMetrics 的 key 是字符串，value 是 string | number | undefined
  // 这里的 metricData 作为一个 Record 来操作，避免 any
  const metricData = finalMetrics as unknown as Record<
    string,
    string | number | undefined
  >

  for (const { key, resultText, isCorrected } of agentResults) {
    const metricKey = METRIC_KEY_MAP[key]
    if (!metricKey) continue

    // 类型安全赋值逻辑
    if (KEYWORDS.STATUS.includes(resultText)) {
      // 如果是状态词，直接赋值
      metricData[metricKey] = resultText
    } else {
      // 如果是数字，提取后赋值
      const num = extractNumber(resultText)
      if (num !== undefined) {
        metricData[metricKey] = num
      }
    }

    rawTextLines.push(`${key}: ${resultText}${isCorrected ? ' (修正)' : ''}`)
  }

  return { rawText: rawTextLines.join('\n'), parsedData: finalMetrics }
}

// ==========================================
// 主函数 (协调者模式 Orchestrator)
// ==========================================
export async function pairAndParseResults(
  recognizedBoxes: BoundingBox[],
  imageElement: HTMLImageElement,
  historyData: BodyMetrics[] = []
): Promise<{ rawText: string; parsedData: BodyMetrics }> {
  console.log('--- 开始智能配对与解析 ---')

  // Step 1: 分类
  const { names, values, statuses, others } = classifyBoxes(recognizedBoxes)

  // Step 2: 提取体型
  const foundBodyType = extractBodyType([...others, ...statuses, ...values])

  // Step 3: 配对
  const tempPairs = performGeometricPairing(names, values)

  // Step 4: 提取上下文 (供 Agent 使用)
  const contextData = extractContext(tempPairs)

  // Step 5: 并发运行 Agent
  const agentResults = await runAgentsParallel(tempPairs, {
    historyData,
    imageElement,
    contextData
  })

  // Step 6: 组装结果
  return assembleFinalMetrics(agentResults, foundBodyType)
}
