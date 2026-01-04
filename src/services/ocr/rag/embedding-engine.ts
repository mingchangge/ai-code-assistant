import {
  pipeline,
  env,
  FeatureExtractionPipeline,
  Tensor,
  type PretrainedOptions // 引入官方 Options 类型
} from '@huggingface/transformers'

// 配置：允许使用缓存，不加载本地文件
env.allowLocalModels = false
env.useBrowserCache = true

// 解决部分浏览器刷新后 WebGPU 上下文卡死的问题
// 如果刷新卡顿严重，可以尝试将这里临时改为 'wasm'
const DEFAULT_DEVICE = 'webgpu'

type EmbeddingVector = number[]

interface ProgressInfo {
  status: 'initiate' | 'download' | 'progress' | 'done' | 'ready'
  file?: string
  name?: string
  loaded?: number
  total?: number
  progress?: number
}

class EmbeddingEngine {
  private static instance: EmbeddingEngine | null = null

  private extractor: FeatureExtractionPipeline | null = null
  // 🟢 关键修复 1: 添加一个 Promise 锁，防止重复初始化
  private initializationPromise: Promise<void> | null = null

  // 🟢 换回支持中文的多语言模型
  private modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

  public onProgress: ((progress: number) => void) | null = null

  private constructor() {
    // 单例模式，禁止外部实例化
    /* 这段代码的作用是**强制执行单例模式（Singleton Pattern）** 。
     * **`private`**: 这意味着 `EmbeddingEngine` 类不能在类的外部通过 `new EmbeddingEngine()` 来实例化。只有类内部（即 `getInstance` 方法）可以创建它。
     * **`constructor() {}`**: 这是一个构造函数。因为你的初始化逻辑都在 `init()` 方法里（因为需要 `async/await`，而构造函数不能是异步的），所以构造函数本身是空的。
     * **从代码运行角度：不是必须的。** 如果你删掉它，TypeScript 会自动生成一个默认的 `public` 构造函数。
     * **从架构设计角度：是必须的（为了安全）。** 如果你删掉它，其他开发者（或者未来的你自己）可能会不小心在代码其他地方写 `const engine = new EmbeddingEngine()`。这将导致创建多个模型实例，**消耗双倍内存**（WebGPU/WASM 模型通常很大），并可能导致浏览器崩溃。
     * */
  }

  public static getInstance(): EmbeddingEngine {
    EmbeddingEngine.instance ??= new EmbeddingEngine()
    return EmbeddingEngine.instance
  }

  /**
   * 初始化模型 (幂等设计：无论调用多少次，只执行一次)
   */
  public async init(): Promise<void> {
    // 1. 如果已经加载完成，直接返回
    if (this.extractor) {
      this.triggerProgress(100) // 确保 UI 收到完成信号
      return
    }

    // 2. 如果正在加载中，返回正在进行的 Promise (避免并发冲突)
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // 3. 开始初始化，并赋值给锁
    this.initializationPromise = this.internalLoad()

    try {
      await this.initializationPromise
    } catch (error) {
      // 如果失败，清除锁，允许下次重试
      this.initializationPromise = null
      throw error
    }
  }

  /**
   * 内部加载逻辑
   */
  private async internalLoad(): Promise<void> {
    console.log('[RAG] Start loading model...')
    this.triggerProgress(10) // 给个初始进度

    try {
      const options = {
        device: DEFAULT_DEVICE,
        dtype: 'fp32',
        progress_callback: (data: ProgressInfo) => {
          this.handleProgress(data)
        }
      }

      // 这里可能会因为读取缓存而耗时，但不触发 progress
      this.extractor = (await pipeline(
        'feature-extraction',
        this.modelName,
        options as unknown as PretrainedOptions
      )) as unknown as FeatureExtractionPipeline

      console.log(`[RAG] Model Loaded via ${DEFAULT_DEVICE}!`)
      this.triggerProgress(100) // 🟢 关键：加载完成后强制置为 100%
    } catch (e) {
      console.warn(
        `[RAG] ${DEFAULT_DEVICE} failed, retrying with WASM (CPU)...`,
        e
      )
      this.triggerProgress(20) // 进度回退一点，提示用户正在重试

      // 降级重试
      const fallbackOptions = {
        device: 'wasm',
        progress_callback: (data: ProgressInfo) => {
          this.handleProgress(data)
        }
      }

      this.extractor = (await pipeline(
        'feature-extraction',
        this.modelName,
        fallbackOptions as unknown as PretrainedOptions
      )) as unknown as FeatureExtractionPipeline
      console.log('[RAG] Model Loaded via WASM fallback!')
      this.triggerProgress(100)
    }
  }

  private handleProgress(data: ProgressInfo): void {
    // 只有在真正下载文件时，Transformers.js 才会频繁触发这个
    if (data.status === 'progress' && data.progress !== undefined) {
      this.triggerProgress(data.progress)
    }
    // 🟢 关键修复：处理 'done' 状态 (缓存读取完毕时有时只触发这个)
    if (data.status === 'done') {
      // 不要直接设为 100，因为可能只是其中一个分片下载完了
      // 我们在 internalLoad 的最后会强制设为 100
    }
  }

  // 辅助函数：安全触发回调
  private triggerProgress(val: number) {
    if (this.onProgress) {
      this.onProgress(val)
    }
  }

  public async embed(text: string): Promise<EmbeddingVector> {
    if (!this.extractor) await this.init()
    if (!this.extractor) throw new Error('Model failed to initialize')

    const output: Tensor = await this.extractor(text, {
      pooling: 'mean',
      normalize: true
    })

    return Array.from(output.data) as EmbeddingVector
  }
}

export const embeddingEngine = EmbeddingEngine.getInstance()
