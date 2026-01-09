import { HealthAgent } from './agent/health-agent'
import { LLMService } from './core/llm-service'
import type { UserProfile, AnalysisResult } from './types'

/**
 * 健康顾问服务 (Facade)
 * 前端组件只与这个对象交互，不直接接触 Agent 类
 */
export const AdvisorService = {
  /**
   * 🆕 新增：预加载模型
   * 用于在页面加载时静默启动 Worker 和编译 Shader
   */
  async preload(onStatus?: (text: string) => void): Promise<void> {
    const llm = LLMService.getInstance()
    // 只做初始化，不生成报告
    await llm.init(onStatus)
  },

  /**
   * 阶段 1: 基础分析 (CPU 密集，毫秒级)
   * 返回结构化数据用于渲染左侧卡片
   */
  async analyzeBasic(
    historyData: unknown[],
    userProfile: UserProfile
  ): Promise<AnalysisResult[]> {
    const agent = new HealthAgent()
    return await agent.executeBasic(historyData, userProfile)
  },

  /**
   * 阶段 2: AI 深度解读 (IO/显存密集，秒级)
   * 依赖阶段 1 的结果作为 Context
   */
  async analyzeAI(
    basicResults: AnalysisResult[],
    userProfile: UserProfile,
    onContent: (partialText: string) => void,
    onStatus?: (statusText: string) => void
  ): Promise<void> {
    const llm = LLMService.getInstance()

    // 1. 确保初始化 (如果之前调用过 preload，这里会瞬间返回，不会重复下载)
    await llm.init(statusText => {
      // 只有在真正需要加载时（未预热完成）才汇报进度
      onStatus?.(statusText.replace('[100%]', '✅').replace('[0%]', '⏳'))
      console.log('初始化状态:', statusText)
    })

    // 2. 预热/思考阶段
    onStatus?.('💭 AI 正在深度思考中...')

    // 3. 生成阶段
    await llm.generateReport(basicResults, userProfile, onContent)
  }
}

export type {
  AnalysisResult,
  UserProfile,
  MetricKey,
  HealthRecord,
  MetricConfigItem
} from './types'
