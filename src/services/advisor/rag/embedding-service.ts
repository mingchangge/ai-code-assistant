import type {
  EmbeddingWorkerMessage,
  EmbeddingWorkerResponse
} from '@/workers/embedding.worker'

type ProgressCallback = (progress: number, status: string) => void

class EmbeddingService {
  private static instance: EmbeddingService | null = null
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null

  // 使用数组存储所有监听者（观察者模式）
  private listeners: ProgressCallback[] = []

  // 状态缓存
  private isReady = false
  private lastProgress = { percent: 0, status: '' }

  private pendingRequests = new Map<
    string,
    { resolve: (vec: number[]) => void; reject: (err: Error) => void }
  >()

  private constructor() {
    // 占位
  }

  public static getInstance(): EmbeddingService {
    EmbeddingService.instance ??= new EmbeddingService()
    return EmbeddingService.instance
  }

  // 🟢 新增：公开的就绪状态查询
  public get isModelReady(): boolean {
    return this.isReady
  }

  /**
   * 🟢 核心修改：添加监听器（支持多个组件同时监听）
   * 并且：一旦添加，立即回放最新状态！
   */
  public addListener(callback: ProgressCallback): () => void {
    this.listeners.push(callback)

    // 立即回放当前状态，防止 UI 错过
    if (this.lastProgress.status) {
      // console.log('[EmbeddingService] Replaying status to new listener:', this.lastProgress)
      callback(this.lastProgress.percent, this.lastProgress.status)
    }

    // 返回卸载函数
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback)
    }
  }

  /**
   * 🟢 私有：通知所有监听者
   */
  private notifyListeners(progress: number, status: string) {
    this.lastProgress = { percent: progress, status }

    this.listeners.forEach(cb => {
      cb(progress, status)
    })
  }

  public async init(): Promise<void> {
    if (this.initPromise) {
      if (this.isReady) {
        this.notifyListeners(100, 'ready')
      } else if (this.lastProgress.status) {
        this.notifyListeners(
          this.lastProgress.percent,
          this.lastProgress.status
        )
      }
      return this.initPromise
    }

    this.notifyListeners(0, 'checking-network')

    this.worker = new Worker(
      new URL('@/workers/embedding.worker.ts', import.meta.url),
      { type: 'module' }
    )

    this.initPromise = new Promise<void>((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker creation failed'))
        return
      }

      this.worker.onmessage = (e: MessageEvent<EmbeddingWorkerResponse>) => {
        const msg = e.data
        switch (msg.type) {
          case 'progress':
            // 广播给 UI
            this.notifyListeners(msg.progress, msg.status)
            break

          case 'init-done':
            this.isReady = true
            this.notifyListeners(100, 'ready')
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
            console.error('[Embedding Service] Worker Error:', msg.error)
            this.pendingRequests.forEach(req => {
              req.reject(new Error(msg.error))
            })
            this.pendingRequests.clear()
            break
          }
        }
      }

      this.worker.postMessage({ type: 'init' } as EmbeddingWorkerMessage)
    })

    return this.initPromise
  }

  public async embed(text: string): Promise<number[]> {
    if (!this.worker || !this.initPromise) await this.init()
    await this.initPromise
    return new Promise<number[]>((resolve, reject) => {
      const id = crypto.randomUUID()
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
    this.isReady = false
    this.listeners = [] // 清空监听者
    this.pendingRequests.clear()
  }
}

export const embeddingService = EmbeddingService.getInstance()
