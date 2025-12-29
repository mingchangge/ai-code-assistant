//这里接收“初步结果”，校验逻辑，如果发现问题，自动切换配置重试
import { RunnableLambda, RunnableSequence } from '@langchain/core/runnables'
import { runSingleOcr } from '../core/ocr-engine'
import { CONFIG_STANDARD, CONFIG_AGGRESSIVE } from '../config'
import type { BoundingBox } from '../types'

interface AgentContext {
  key: string // 字段名 (如 "蛋白质率")
  originalText: string // 第一次识别的文本 (如 "119")
  box: BoundingBox // 对应的框
  image: HTMLImageElement // 原图
}

interface AgentResult {
  finalText: string
  isCorrected: boolean
}

/**
 * 校验器：判断 OCR 结果是否符合业务逻辑
 */
const validateLogic = (ctx: AgentContext): boolean => {
  const { key, originalText } = ctx
  const num = parseFloat(originalText)
  if (isNaN(num)) return false

  // 规则 1: 百分比数据不应 > 100
  const percentageFields = [
    '体脂率',
    '水分率',
    '蛋白质率',
    '肌肉率',
    '骨骼肌率'
  ]
  if (percentageFields.includes(key) && num > 100) {
    // 比如 119 -> 可能是 13.9 丢了点
    return false
  }

  // 规则 2: "控制"类数据，如果是大的正数，很可能漏了负号
  // 比如 "体重控制" 识别为 13.1，但目标51，当前64，应该是 -13.1
  // 注意：这里我们只做简单的数值范围判断，更高级的需要上下文
  // 假设控制量绝对值很少超过 50kg
  if (key.includes('控制') && Math.abs(num) > 50) {
    // 可能是 13.10 读成了 1310 (虽然 matchNumber 会处理，但预防万一)
    return false
  }

  // 规则 3: 骨骼率通常是个位数 (3.x%)
  if (key === '骨骼率' && num > 20) return false

  return true // 默认认为通过
}

/**
 * 构建 LangChain 序列
 */
export const createCorrectionAgent = () => {
  // 步骤 1: 决策层 (Router)
  const decisionStep = new RunnableLambda({
    func: async (ctx: AgentContext) => {
      const isValid = validateLogic(ctx)

      if (isValid) {
        return { finalText: ctx.originalText, isCorrected: false }
      }

      console.warn(
        `[Agent] 检测到异常: ${ctx.key}=${ctx.originalText}，正在重试...`
      )

      // 步骤 2: 执行动作 (Tool Execution) - 使用激进配置重试
      // 激进模式开启了 padding=8 (抓负号) 和二值化 (增强对比)
      const newText = await runSingleOcr(
        ctx.image,
        ctx.box.box,
        CONFIG_AGGRESSIVE
      )

      console.log(`[Agent] 重试结果: ${newText}`)

      // 简单的再次校验，或者直接采纳
      return { finalText: newText, isCorrected: true }
    }
  })

  return decisionStep // 这里其实是一个简单的 Runnable，没用复杂的 Sequence，因为逻辑只有两步
}
