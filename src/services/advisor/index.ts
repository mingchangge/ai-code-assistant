import { HealthAgent } from './agent/health-agent'
import { LLMService } from './core/llm-service'
import { embeddingService } from './rag/embedding-service'
import type { UserProfile, AnalysisResult } from './types'

/**
 * 健康顾问服务 (Facade)
 * 前端组件只与这个对象交互，不直接接触 Agent 类
 */
export const AdvisorService = {
  // 判断 RAG 是否就绪
  isRagReady(): boolean {
    return embeddingService.isModelReady
  },

  /**
   * 🟢 步骤 1: 仅初始化 RAG (知识库)
   * 这是一个轻量级操作，适合和图表渲染同时进行
   */
  async initKnowledgeBase(onStatus: (text: string) => void): Promise<void> {
    // 1. 订阅进度 (使用 addListener 确保不丢失状态)
    embeddingService.addListener((progress, status) => {
      onStatus(`[RAG] ${status}|${progress.toFixed(1)}`)
    })

    // 2. 兜底检查
    if (embeddingService.isModelReady) {
      onStatus('[RAG] ready|100.0')
      return // 如果好了就直接返回，节省时间
    }

    try {
      console.log('[Advisor] 正在连接知识库引擎...')
      await embeddingService.init()
      console.log('[Advisor] 知识库引擎就绪 ✅')
    } catch (error) {
      console.error('[Advisor] 知识库加载失败:', error)
      throw error // 抛出错误供上层处理
    }
  },

  /**
   * 🟢 步骤 2: 初始化 LLM (AI 思考引擎)
   * 这是一个重量级操作，建议在页面空闲或图表加载完后再调用
   */
  async initReasoningEngine(onStatus: (text: string) => void): Promise<void> {
    const llm = LLMService.getInstance()

    try {
      console.log('[Advisor] 正在启动 AI 思考引擎...')
      await llm.init(msg => {
        onStatus(`[LLM] ${msg}`)
      })
      // 手动补发完成信号，确保 UI 变绿
      onStatus('[LLM] Finish loading')
      console.log('[Advisor] AI 思考引擎就绪 ✅')
    } catch (error) {
      console.error('[Advisor] AI 引擎加载失败:', error)
      throw error
    }
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

    // 重新绑定 RAG 监听（防止生成过程中 RAG 状态丢失）
    embeddingService.addListener((progress, status) => {
      onStatus?.(`[RAG] ${status}|${progress.toFixed(1)}`)
    })
    if (embeddingService.isModelReady) {
      onStatus?.('[RAG] ready|100.0')
    }

    // 确保 LLM 就绪
    await llm.init(statusText => {
      // 只有在真正需要加载时（未预热完成）才汇报进度
      onStatus?.(statusText.replace('[100%]', '✅').replace('[0%]', '⏳'))
    })
    onStatus?.('💭 AI 正在深度思考中...')
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
