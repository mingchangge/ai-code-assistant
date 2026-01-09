import type { AnalysisResult, UserProfile } from '../types'
import { SYSTEM_PROMPT, buildUserPrompt } from '../agent/prompts'

// 定义 Worker 返回的消息类型，增强代码提示
type WorkerMessage =
  | { type: 'progress'; progress: number; text: string }
  | { type: 'init-done' }
  | { type: 'token'; delta: string }
  | { type: 'done' }
  | { type: 'error'; error: string }

export class LLMService {
  private worker: Worker | null = null
  private static instance: LLMService | null = null

  // 🔒 锁 1: 初始化锁 (确保只初始化一次)
  private initPromise: Promise<void> | null = null

  // 🔒 锁 2: 生成任务锁 (防止重复生成)
  private currentGenPromise: Promise<void> | null = null

  // 📢 广播频道: 存放所有想听"直播"的回调函数
  private contentListeners: ((text: string) => void)[] = []

  private modelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC'

  static getInstance() {
    this.instance ??= new LLMService()
    return this.instance
  }

  /**
   * 1. 初始化 Worker (支持静默预加载)
   * 即使多次调用，也只会启动一个 Worker
   */
  async init(onStatus?: (text: string) => void): Promise<void> {
    // 如果已经在初始化中或已完成，直接返回现有的 Promise
    if (this.initPromise) {
      return this.initPromise
    }

    console.log('[LLMService] 正在启动 Worker...')

    // 1. 创建 Worker
    this.worker = new Worker(
      new URL('@/workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    )

    // 2. 创建并赋值 Promise
    this.initPromise = new Promise<void>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker create failed'))
        return
      }

      // 1. 定义清理函数 (DRY原则：Don't Repeat Yourself)
      // 无论成功还是失败，最后都要把监听器移除
      const cleanup = () => {
        this.worker?.removeEventListener('message', initHandler)
      }

      // 2. 消息处理主逻辑
      const initHandler = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data

        switch (msg.type) {
          case 'progress': {
            // 格式化进度条，逻辑更紧凑
            const p = Math.floor(msg.progress * 100)
            onStatus?.(`[${p.toFixed(0)}%] ${msg.text || '加载资源中...'}`)
            break
          }
          case 'init-done':
            console.log('[LLMService] Worker 初始化完成 ✅')
            cleanup() // 统一清理
            resolve()
            break

          case 'error':
            console.error('[LLMService] 初始化失败:', msg.error)
            cleanup() // 统一清理
            this.initPromise = null // 允许下次重试
            reject(new Error(msg.error))
            break

          default:
            // 如果收到了，仅记录日志，不影响主流程
            console.warn('[LLMService] Init 收到非预期消息:', msg.type)
            break
        }
      }

      // ✅ 统一使用 addEventListener
      this.worker.addEventListener('message', initHandler)

      // 发送初始化指令
      this.worker.postMessage({ type: 'init', modelId: this.modelId })
    })

    return this.initPromise
  }

  /**
   * 2. 生成报告
   * 自动处理“未初始化”或“正在初始化”的情况
   */
  async generateReport(
    basicResults: AnalysisResult[],
    profile: UserProfile,
    onContent: (text: string) => void
  ): Promise<void> {
    // 🟢 步骤 A: 确保 Worker 已就绪
    // 如果用户点击太快，init 还没完成，这里会挂起等待 init 完成，而不是报错
    if (!this.initPromise) throw new Error('Please call init() first')
    await this.initPromise

    if (!this.worker) throw new Error('Worker not initialized')

    // 🟢 步骤 B: 加入“观众席”
    // 无论是否复用任务，新进来的回调都应该能收到消息
    this.contentListeners.push(onContent)

    // 🟢 步骤 C: 复用机制
    if (this.currentGenPromise) {
      console.log('[LLMService] ♻️ 复用现有生成任务...')
      return this.currentGenPromise
    }

    console.log('[LLMService] 🚀 启动新的生成任务')

    // 准备 Prompt
    const metricsSummary = basicResults
      .map(r => `- ${r.label}: ${r.currentValue.toString()} (${r.status})`)
      .join('\n')
    const ragContext = basicResults
      .filter(r => r.advice)
      .map(r => r.advice)
      .join('\n')
    const userPrompt = buildUserPrompt(profile, metricsSummary, ragContext)

    // 🟢 步骤 D: 开启任务并上锁
    this.currentGenPromise = new Promise((resolve, reject) => {
      let fullText = ''

      const generateHandler = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data

        switch (msg.type) {
          case 'token':
            // 🔥 热路径 (Hot Path)：这是执行频率最高的代码块
            fullText += msg.delta
            // 广播给所有监听者
            this.contentListeners.forEach(fn => {
              fn(fullText)
            })
            break

          case 'done':
            // ✅ 完成：清理资源并结束 Promise
            cleanup()
            resolve()
            break

          case 'error':
            // ❌ 错误：清理资源并抛出错误
            cleanup()
            reject(new Error(msg.error))
            break

          default:
            // 🛡️ 忽略其他不相关的消息 (如 init 阶段的 leftover 消息)
            break
        }
      }

      const cleanup = () => {
        this.worker?.removeEventListener('message', generateHandler)
        this.currentGenPromise = null // 解锁
        this.contentListeners = [] // 清空观众席，防止内存泄漏
      }

      this.worker?.addEventListener('message', generateHandler)

      this.worker?.postMessage({
        type: 'generate',
        systemPrompt: SYSTEM_PROMPT,
        userPrompt
      })
    })

    return this.currentGenPromise
  }

  /**
   * 🔧 可选：强制终止方法 (如果用户离开页面需要彻底中断)
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.initPromise = null
      this.currentGenPromise = null
      this.contentListeners = []
    }
  }
}
