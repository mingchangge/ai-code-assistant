import {
  pipeline,
  env,
  FeatureExtractionPipeline,
  Tensor,
  type PretrainedOptions
} from '@huggingface/transformers'

// 定义 Worker 消息协议
export type EmbeddingWorkerMessage =
  | { type: 'init' }
  | { type: 'embed'; text: string; id: string }

export type EmbeddingWorkerResponse =
  | { type: 'init-done' }
  | { type: 'embed-done'; vector: number[]; id: string }
  | { type: 'progress'; progress: number; status: string }
  | { type: 'error'; error: string }

// 允许使用浏览器缓存
env.useBrowserCache = true

// 推荐用 WASM (CPU)
const DEFAULT_DEVICE = 'wasm'
const MODEL_NAME = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
const LOCAL_FOLDER_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

let extractor: FeatureExtractionPipeline | null = null
declare const self: DedicatedWorkerGlobalScope

async function initPipeline() {
  if (extractor) {
    self.postMessage({ type: 'init-done' })
    return
  }

  // 通用配置
  const baseOptions = {
    device: DEFAULT_DEVICE,
    progress_callback: (data: { status: string; progress?: number }) => {
      if (data.status === 'progress' && data.progress !== undefined) {
        self.postMessage({
          type: 'progress',
          progress: data.progress,
          status: 'loading'
        })
      }
    }
  }

  try {
    // -----------------------------------------------------------
    // 🚀 阶段一：标准模式 (Cache -> Network)
    // -----------------------------------------------------------
    env.allowLocalModels = false
    env.allowRemoteModels = true
    console.log('[Embedding Worker] 尝试加载模型 (Cache / Network)...')
    self.postMessage({
      type: 'progress',
      progress: 10,
      status: 'checking-network'
    })

    extractor = (await pipeline('feature-extraction', MODEL_NAME, {
      ...baseOptions,
      local_files_only: false,
      quantized: false, // 禁用量化文件名后缀
      dtype: 'fp32' // 显式声明使用 FP32 精度 (匹配 model.onnx)
    } as unknown as PretrainedOptions)) as unknown as FeatureExtractionPipeline

    console.log('[Embedding Worker] ✅ 标准模式加载成功')
  } catch (err) {
    // -----------------------------------------------------------
    // 🏠 阶段二：本地兜底 (Local Fallback)
    // -----------------------------------------------------------
    env.allowLocalModels = true
    env.allowRemoteModels = false
    console.warn('[Embedding Worker] 网络/缓存失败，尝试本地兜底...', err)
    self.postMessage({
      type: 'progress',
      progress: 50,
      status: 'switching-local'
    })

    try {
      // 本地兜底通常使用量化版 (体积小)
      extractor = (await pipeline('feature-extraction', LOCAL_FOLDER_NAME, {
        ...baseOptions,
        local_files_only: true,
        quantized: true,
        dtype: 'q8' // 配合量化版使用 q8
      } as unknown as PretrainedOptions)) as unknown as FeatureExtractionPipeline

      console.log('[Embedding Worker] ✅ 本地模式加载成功')
    } catch (localErr) {
      console.error('[Embedding Worker] ❌ 失败', localErr)
      const errorMessage =
        localErr instanceof Error ? localErr.message : String(localErr)
      self.postMessage({ type: 'error', error: errorMessage })
      return
    }
  }

  self.postMessage({ type: 'progress', progress: 100, status: 'ready' })
  self.postMessage({ type: 'init-done' })
}

/**
 * ✨ 执行向量化
 */
async function runEmbedding(text: string, id: string) {
  if (!extractor) {
    self.postMessage({ type: 'error', error: 'Model not initialized' })
    return
  }

  try {
    const output: Tensor = await extractor(text, {
      pooling: 'mean',
      normalize: true
    })
    // 转换 Tensor 为普通数组
    const vector = Array.from(output.data) as number[]

    self.postMessage({ type: 'embed-done', vector, id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    self.postMessage({ type: 'error', error: msg })
  }
}

// 消息监听
self.onmessage = (e: MessageEvent<EmbeddingWorkerMessage>) => {
  const { type } = e.data

  if (type === 'init') {
    void initPipeline()
  } else {
    void runEmbedding(e.data.text, e.data.id)
  }
}
