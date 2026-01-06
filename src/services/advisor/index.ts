import { HealthAgent } from './agent/health-agent'
import type { UserProfile, AnalysisResult } from './types'

// 1. 实例化 Agent (单例模式)
// 如果 Agent 内部有较重的初始化逻辑(如加载模型)，单例可以避免重复开销
const agentInstance = new HealthAgent()

/**
 * 健康顾问服务 (Facade)
 * 前端组件只与这个对象交互，不直接接触 Agent 类
 */
export const AdvisorService = {
  /**
   * 运行全量健康分析
   * @param rawData 原始数据 (通常是 OCR 或 CSV 解析后的 JSON)
   * @param userProfile 用户画像 (用于匹配精准建议)
   */
  async analyze(
    rawData: unknown[],
    userProfile: UserProfile
  ): Promise<AnalysisResult[]> {
    console.log(
      `[AdvisorService] 开始分析，用户年龄: ${userProfile.age.toString()}`
    )

    // 这里可以加一层缓存逻辑、错误统一监控或者数据预处理
    // 目前直接透传给 Agent
    const results = await agentInstance.execute(rawData, userProfile)
    if (!results) {
      throw new Error('分析失败')
    }
    return results
  }

  /**
   * 可以在这里扩展其他方法，例如：
   * async exportReport(results) { ... }
   * async getSupportedMetrics() { ... }
   */
}

// 2. 统一导出类型，方便 UI 层引用
export type {
  AnalysisResult,
  UserProfile,
  MetricKey,
  HealthRecord,
  MetricConfigItem
} from './types'
