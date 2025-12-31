import type {
  AgentContext,
  BoundingBox,
  BodyMetrics,
  PairedItem
} from '../types'
import { createCorrectionAgent } from './ocr-agent'
import { isSameLine, extractNumber } from '../utils/geometry'
import { semanticMatcher } from '@/services/ocr/rag/semantic-matcher'
import {
  KEYWORDS,
  BODY_TYPE_VALUES,
  METRIC_KEY_MAP,
  UNITS_REGEX,
  INITIAL_METRICS
} from './constants'

// 🌟 [Helper] 反向映射表：English Key -> Chinese Label
// 用于将 RAG 返回的英文 Key (如 'weight') 转回中文标准名 ('体重')，以兼容后续逻辑
const REVERSE_METRIC_MAP = Object.entries(METRIC_KEY_MAP).reduce<
  Record<string, string>
>((acc, [chn, eng]) => {
  // 确保 eng 存在 (因为 METRIC_KEY_MAP 的值可能是 undefined)
  if (eng) {
    acc[eng] = chn
  }
  return acc
}, {})

/**
 * 1. 预处理与分类 (增强版：规则 + RAG)
 * 将原来的同步函数改为异步，支持 AI 语义匹配
 */
async function classifyBoxes(boxes: BoundingBox[], useRAG = false) {
  const names: BoundingBox[] = []
  const values: BoundingBox[] = []
  const statuses: BoundingBox[] = []
  const others: BoundingBox[] = []
  // 用于存储 RAG 修正后的映射关系: Map<BoxReference, StandardChineseName>
  const normalizedNameMap = new Map<BoundingBox, string>()
  if (useRAG) {
    // 确保 RAG 索引已建立 (懒加载)
    await semanticMatcher.initialize()
  }

  for (const box of boxes) {
    const text = box.text?.trim() ?? ''
    if (!text) continue

    // 规则优先 (高性能) --- 如果精准匹配到关键字，直接归类
    if (KEYWORDS.NAMES.some(k => text.startsWith(k))) {
      names.push(box)
      // 同时也记录一下标准名（去掉多余符号），方便后续统一处理
      const standardName = text.replace(/[\s(%)（）:：]/g, '')
      normalizedNameMap.set(box, standardName)
      continue
    }

    if (KEYWORDS.STATUS.some(k => text.includes(k))) {
      statuses.push(box)
      continue
    }

    if (/\d/.test(text)) {
      values.push(box)
      continue
    }
    if (useRAG && text.length > 1) {
      // --- B. RAG 语义兜底 (高鲁棒性) ---
      // 如果既不是数字，也不是已知状态词，可能是写错的指标名 (如 "内脏指肪")
      // 调用向量检索寻找最匹配的标准 Key
      const matchedEngKey = await semanticMatcher.findBestMatch(text)

      if (matchedEngKey) {
        // RAG 命中！
        const standardChnName = REVERSE_METRIC_MAP[matchedEngKey]
        if (standardChnName) {
          console.log(`[RAG] 语义修正: "${text}" -> "${standardChnName}"`)
          names.push(box)
          // 关键：将这个 Box 绑定到标准中文名上
          normalizedNameMap.set(box, standardChnName)
          continue
        }
      }
    }

    others.push(box)
  }
  return { names, values, statuses, others, normalizedNameMap }
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

/**
 * 3. 几何配对 (核心算法 - 适配 RAG)
 * @param normalizedNameMap RAG 修正后的名称映射表
 */
function performGeometricPairing(
  names: BoundingBox[],
  values: BoundingBox[],
  normalizedNameMap: Map<BoundingBox, string> = new Map<BoundingBox, string>()
): Partial<Record<string, PairedItem>> {
  const tempPairs: Partial<Record<string, PairedItem>> = {}

  // 分组 Names
  const groupedNames: Record<string, BoundingBox[] | undefined> = {}
  names.forEach(box => {
    // 🌟 [修改] 优先使用 RAG 修正后的标准名
    // 如果 map 里没有，再回退到原始文本清洗
    let key = normalizedNameMap.get(box)
    key ??= box.text?.replace(/[\s(%)（）]/g, '') ?? ''

    const group = (groupedNames[key] ??= [])
    group.push(box)
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
  historyData: BodyMetrics[] = [],
  config: { useRAG?: boolean } = {}
): Promise<{ rawText: string; parsedData: BodyMetrics }> {
  console.log('--- 开始智能配对与解析 ---')

  // Step 1: 分类
  const { names, values, statuses, others, normalizedNameMap } =
    await classifyBoxes(recognizedBoxes, config.useRAG)

  // Step 2: 提取体型
  const foundBodyType = extractBodyType([...others, ...statuses, ...values])

  // Step 3: 配对
  const tempPairs = performGeometricPairing(names, values, normalizedNameMap)

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
