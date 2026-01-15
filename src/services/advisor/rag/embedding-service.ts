import type {
  EmbeddingWorkerMessage,
  EmbeddingWorkerResponse
} from '@/workers/embedding.worker'

class EmbeddingService {
  private static instance: EmbeddingService | null = null
  private worker: Worker | null = null

  // Promise 锁：处理初始化状态
  private initPromise: Promise<void> | null = null

  // 请求队列：处理并发的 embed 请求 (id -> resolve/reject)
  private pendingRequests = new Map<
    string,
    {
      resolve: (vec: number[]) => void
      reject: (err: Error) => void
    }
  >()

  // 进度回调
  public onProgress: ((progress: number, status: string) => void) | null = null

  private constructor() {
    // 初始化时创建 Worker
  }

  public static getInstance(): EmbeddingService {
    EmbeddingService.instance ??= new EmbeddingService()
    return EmbeddingService.instance
  }

  /**
   * 初始化 Worker 并启动模型
   */
  public async init(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.worker = new Worker(
      new URL('@/workers/embedding.worker.ts', import.meta.url),
      { type: 'module' }
    )

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker creation failed'))
        return
      }

      // 监听 Worker 消息
      this.worker.onmessage = (e: MessageEvent<EmbeddingWorkerResponse>) => {
        const msg = e.data

        switch (msg.type) {
          case 'progress':
            this.onProgress?.(msg.progress, msg.status)
            break

          case 'init-done':
            resolve()
            break

          case 'embed-done': {
            const req = this.pendingRequests.get(msg.id)
            if (req) {
              req.resolve(msg.vector)
              this.pendingRequests.delete(msg.id)
            }
            break
          }

          case 'error': {
            // 如果是初始化阶段报错
            console.error('[Embedding Service] Worker Error:', msg.error)
            // 如果有待处理的请求，全部拒绝
            this.pendingRequests.forEach(req => {
              req.reject(new Error(msg.error))
            })
            this.pendingRequests.clear()
            // 如果还没初始化完
            // 注意：这里 reject 可能会触发 Unhandled Promise Rejection，需上层捕获
            break
          }
        }
      }

      // 发送初始化指令
      this.worker.postMessage({ type: 'init' } as EmbeddingWorkerMessage)
    })

    return this.initPromise
  }

  /**
   * 调用 Worker 进行向量化
   */
  public async embed(text: string): Promise<number[]> {
    if (!this.worker || !this.initPromise) {
      await this.init()
    }
    await this.initPromise // 确保初始化完成

    return new Promise<number[]>((resolve, reject) => {
      const id = crypto.randomUUID() // 生成唯一 ID 匹配请求和响应

      this.pendingRequests.set(id, { resolve, reject })

      this.worker?.postMessage({
        type: 'embed',
        text,
        id
      } as EmbeddingWorkerMessage)
    })
  }

  public terminate() {
    this.worker?.terminate()
    this.worker = null
    this.initPromise = null
    this.pendingRequests.clear()
  }
}

export const embeddingService = EmbeddingService.getInstance()
