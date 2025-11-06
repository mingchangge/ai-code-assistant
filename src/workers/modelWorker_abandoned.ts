// @huggingface/transformers + Xenova/Phi-3-mini-4k-instruct 模型

/// <reference lib="webworker" />

// 必须在 import 之前！
// @ts-expect-error: ORT_WASM_PATH 是 onnxruntime-web 要求的运行时全局变量但 ts 的 Worker 类型定义中没有这个属性，我们需要忽略这个错误。
self.ORT_WASM_PATH = '/ort-wasm-simd-threaded.jsep.wasm'

import {
  pipeline,
  env,
  type TextGenerationPipeline
} from '@huggingface/transformers'

// 声明 self 类型（Web Worker）
declare const self: Worker

interface GeneratePayload {
  prompt: string
  config: {
    max_new_tokens?: number
    temperature?: number
    top_k?: number
    do_sample?: boolean
    pad_token_id?: number
  }
}
type WorkerMessage =
  | { type: 'CONFIG'; payload: { wasmPath: string } }
  | { type: 'GENERATE'; payload: GeneratePayload }
  | { type: 'INIT_MODEL' }
type WorkerResponse =
  | { type: 'LOADING'; message: string }
  | { type: 'MODEL_READY' }
  | { type: 'ANALYZING'; message: string }
  | { type: 'GENERATION_DONE'; result: string }
  | { type: 'ERROR'; message: string }

// 全局 pipeline 实例（类型安全）
let generator: TextGenerationPipeline | null = null

// 配置环境（必须在 pipeline 之前）
env.useBrowserCache = true
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data

  if (type === 'INIT_MODEL') {
    if (generator) {
      self.postMessage({ type: 'MODEL_READY' } satisfies WorkerResponse)
      return
    }

    self.postMessage({
      type: 'LOADING',
      message: '正在下载并加载模型，请耐心等待（约 2–10 分钟）...'
    } satisfies WorkerResponse)

    try {
      generator = await pipeline(
        'text-generation',
        'Xenova/Phi-3-mini-4k-instruct',
        {
          device: 'wasm',
          local_files_only: false
        }
      )

      self.postMessage({ type: 'MODEL_READY' } satisfies WorkerResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      self.postMessage({
        type: 'ERROR',
        message: `模型加载失败: ${errorMessage}`
      } satisfies WorkerResponse)
    }
  }

  if (type === 'GENERATE' && generator !== null) {
    const { prompt, config } = event.data.payload
    self.postMessage({
      type: 'ANALYZING',
      message: 'AI 正在分析...'
    } satisfies WorkerResponse)

    try {
      const result = await generator(prompt, config)
      if (
        !Array.isArray(result) ||
        result.length === 0 ||
        typeof result[0] !== 'object' ||
        typeof (result[0] as Record<string, unknown>).generated_text !==
          'string'
      ) {
        throw new Error('生成结果格式无效')
      }
      const generatedText = (result[0] as { generated_text: string })
        .generated_text

      if (typeof generatedText !== 'string') {
        throw new Error('生成结果格式无效')
      }

      self.postMessage({
        type: 'GENERATION_DONE',
        result: generatedText
      } satisfies WorkerResponse)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      self.postMessage({
        type: 'ERROR',
        message: `分析失败: ${errorMessage}`
      } satisfies WorkerResponse)
    }
  }
}
