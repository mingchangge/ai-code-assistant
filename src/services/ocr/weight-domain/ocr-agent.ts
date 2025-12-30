import type { AgentContext, AgentResult } from '../types'
import { METRIC_KEY_MAP, PHYSICAL_LIMITS } from './constants'
import { RunnableLambda } from '@langchain/core/runnables'
import { runSingleOcr } from '../core/ocr-engine'
import { CONFIG_AGGRESSIVE } from '../config'
import { calculateDynamicRanges } from './history-analyzer'

/**
 * 创建智能纠错 Agent
 * 核心思想：结合上下文公式、历史范围与趋势，进行多策略修正
 * 修正不了再调用昂贵的"激进模式 OCR"进行重测。
 */

// ==========================================
// 🔧 通用工具函数 (Helper)
// ==========================================

/**
 * 核心逻辑抽取：尝试通过除以 10 或 100 来修正数值
 * @param val 当前 OCR 识别的原始值
 * @param range 目标合法的范围 { min, max }
 * @param sourceName 策略名称 (用于日志，如 "历史范围", "物理极限")
 */
const tryFixByMagnitude = (
  val: number,
  range: { min: number; max: number },
  sourceName: string
): AgentResult | null => {
  // 1. 尝试 /10 (最常见，如 1396 -> 13396)
  const valDiv10 = val / 10
  if (valDiv10 >= range.min && valDiv10 <= range.max) {
    console.log(
      `[Agent] 由[${sourceName}]触发: 数量级修正 /10 -> ${valDiv10.toString()}`
    )
    return {
      finalText: String(valDiv10),
      isCorrected: true,
      correctionReason: `${sourceName}校验: /10`
    }
  }

  // 2. 尝试 /100 (次常见，如 23.5% -> 2350)
  const valDiv100 = val / 100
  if (valDiv100 >= range.min && valDiv100 <= range.max) {
    console.log(
      `[Agent] 由[${sourceName}]触发: 数量级修正 /100 -> ${valDiv100.toString()}`
    )
    return {
      finalText: String(valDiv100),
      isCorrected: true,
      correctionReason: `${sourceName}校验: /100`
    }
  }

  return null
}

// ==========================================
// 🛠️ 策略函数群
// ==========================================

/**
 * 🌟 策略 1: 基于上下文公式 (Context) 修正符号
 * (保持不变)
 */
const strategyContextSign = (
  key: string,
  val: number,
  context?: Record<string, number | undefined>
): AgentResult | null => {
  const isControlField = key === '体重控制' || key === '脂肪控制'
  if (!isControlField || !context?.weight || !context.targetWeight) return null

  const diff = context.targetWeight - context.weight
  if (diff < 0 && val > 0) {
    console.log(`[Agent] ${key}: 上下文逻辑判定需减肥，强制补全负号`)
    return {
      finalText: `-${val.toString()}`,
      isCorrected: true,
      correctionReason: '基于体重差公式自动补全负号'
    }
  }
  return null
}

/**
 * 🌟 策略 2: 基于历史范围 (History) 修正数量级
 * 判定条件：基于个性化历史数据的离群值检测 (Outlier Detection)
 */
const strategyMagnitude = (
  val: number,
  range: { min: number; max: number } | null
): AgentResult | null => {
  if (!range) return null

  // 1. 判定条件：个性化历史范围
  // 允许一定的波动 (1.5倍上限，0.5倍下限)，但不能太离谱
  const isOutlier = val > range.max * 1.5 || (val > 0 && val < range.min * 0.5)

  if (!isOutlier) return null

  // 2. 执行修正：调用通用工具
  return tryFixByMagnitude(val, range, '历史范围')
}

/**
 * 🌟 策略 3: 基于历史趋势兜底修正符号
 * (保持不变)
 */
const strategyHistorySign = (
  key: string,
  val: number,
  range: { min: number; max: number; avg: number } | null
): AgentResult | null => {
  const isControlField = key === '体重控制' || key === '脂肪控制'
  if (!isControlField || !range) return null

  if (range.avg < -2 && val > 0) {
    const negativeVal = -val
    if (negativeVal >= range.min && negativeVal <= range.max) {
      console.log(`[Agent] ${key}: 历史趋势判定疑丢负号，强制补全`)
      return {
        finalText: `-${val.toString()}`,
        isCorrected: true,
        correctionReason: '基于历史趋势补全负号'
      }
    }
  }
  return null
}

/**
 * 🌟 策略 4: 物理极限校验 (Physical Limit)
 * 判定条件：基于全人类的生理极限 (Hard Limits)
 */
const strategyPhysicalLimit = (
  key: string,
  val: number
): AgentResult | null => {
  const metricKey = METRIC_KEY_MAP[key]
  const limit = metricKey ? PHYSICAL_LIMITS[metricKey] : null
  if (!limit) return null

  // 1. 判定条件：绝对物理越界
  if (val < limit.min || val > limit.max) {
    console.warn(
      `[Agent] ${key}: 数值 ${val.toString()} 超出物理极限 [${limit.min.toString()}, ${limit.max.toString()}]`
    )

    // 2. 执行修正：调用通用工具
    // 此时 limit 就是我们的目标范围
    return tryFixByMagnitude(val, limit, '物理极限')
  }
  return null
}

/**
 * 判断是否触发重试
 * (逻辑微调，使其更清晰)
 */
const checkRetryConditions = (
  key: string,
  val: number,
  range: { min: number; max: number } | null
): { shouldRetry: boolean; reason: string } => {
  const metricKey = METRIC_KEY_MAP[key]

  // 1. 物理常识校验 (>100% 或 超出物理极限)
  const percentageFields = [
    '体脂率',
    '水分率',
    '蛋白质率',
    '肌肉率',
    '骨骼肌率'
  ]
  if (percentageFields.includes(key) && val > 100) {
    return { shouldRetry: true, reason: '>100%' }
  }

  const limit = metricKey ? PHYSICAL_LIMITS[metricKey] : null
  if (limit && (val < limit.min || val > limit.max)) {
    return { shouldRetry: true, reason: `数值 ${val.toString()} 超出物理极限` }
  }

  // 2. 历史范围校验
  if (range && (val < range.min || val > range.max)) {
    return {
      shouldRetry: true,
      reason: `数值 ${val.toString()} 超出历史范围 [${range.min.toFixed(1)}, ${range.max.toFixed(1)}]`
    }
  }

  return { shouldRetry: false, reason: '' }
}

// ==========================================
// 🚀 主 Agent 实现
// ==========================================
export const createCorrectionAgent = () => {
  return new RunnableLambda({
    func: async (ctx: AgentContext): Promise<AgentResult> => {
      const { key, originalText, history, image, box, context } = ctx

      // 1. 基础解析
      const currentVal = parseFloat(originalText)
      if (isNaN(currentVal)) {
        return { finalText: originalText, isCorrected: false }
      }
      // 🎯 阶段 1: 快速修正 (不重试) ---

      // 1.1 Context 修正 (最高优)
      const contextResult = strategyContextSign(key, currentVal, context)
      if (contextResult) return contextResult

      // 准备历史数据
      const ranges = calculateDynamicRanges(history ?? [])
      const range = ranges[METRIC_KEY_MAP[key] ?? ''] ?? null

      // 1.2 数量级修正(基于历史)
      const magResult = strategyMagnitude(currentVal, range)
      if (magResult) return magResult

      // 1.3 物理极限修正 (基于常识)
      const physResult = strategyPhysicalLimit(key, currentVal)
      if (physResult) return physResult

      // 🎯 阶段 2: 决策是否重试 ---

      const { shouldRetry, reason } = checkRetryConditions(
        key,
        currentVal,
        range
      )

      if (shouldRetry) {
        console.warn(`[Agent] ${key}: ${reason} -> 激进重试`)

        // 执行耗时操作
        const retryText = await runSingleOcr(image, box.box, CONFIG_AGGRESSIVE)
        const retryVal = parseFloat(retryText)

        // 只有重试得到有效数字，且结果改变了，才进行后续评估
        if (!isNaN(retryVal) && retryText !== originalText) {
          // 2.1 重试后，再次尝试 Context 修正 (可能重试出的数字对上了公式)
          const retryContextResult = strategyContextSign(key, retryVal, context)
          if (retryContextResult) return retryContextResult

          // 2.2 重试后，尝试 History 符号兜底 (解决你担心的 Context 缺失问题)
          const retryHistoryResult = strategyHistorySign(key, retryVal, range)
          if (retryHistoryResult) return retryHistoryResult

          // 2.3 都没有特定修正，则直接采纳重试结果 (相信 Aggressive 模式)
          return {
            finalText: retryText,
            isCorrected: true,
            correctionReason: '激进模式修正'
          }
        }
      }

      // 默认返回原值
      return { finalText: originalText, isCorrected: false }
    }
  })
}
