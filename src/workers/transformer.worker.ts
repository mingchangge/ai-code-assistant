/// <reference lib="webworker" />

import {
  pipeline,
  type TextGenerationPipeline
} from '@huggingface/transformers'

// 声明 self 类型（Web Worker）
declare const self: Worker

type MessageType = 'MODEL_INIT' | 'MODEL_READY' | 'ERROR' | 'SEND_PROMPT'

// 全局 pipeline 实例（类型安全）
let generator: TextGenerationPipeline | null = null

self.onmessage = (
  event: MessageEvent<{ type: MessageType; message?: string }>
) => {
  const { type, message } = event.data
  switch (type) {
    case 'MODEL_INIT':
      void initModel(self)
      break
    case 'SEND_PROMPT':
      void generate(message!, { max_new_tokens: 128 })
        .then(result => {
          console.log(result, 'GENERATION_DONE')
          const generatedText: string = result[0].generated_text.at(-1)?.content
          self.postMessage({
            type: 'GENERATION_DONE',
            message: generatedText
          })
        })
        .catch((error: unknown) => {
          self.postMessage({
            type: 'ERROR',
            message: '生成失败:' + (error as Error).message
          })
        })
      break
    default:
      break
  }
}

async function initModel(self: Worker) {
  if (generator) {
    self.postMessage({ type: 'MODEL_READY' })
    return
  }
  self.postMessage({ type: 'LOADING', message: '下载模型中...，请稍候' })
  try {
    generator = await pipeline(
      'text-generation',
      'onnx-community/Qwen2.5-0.5B-Instruct',
      {
        dtype: 'q4',
        device: 'webgpu' as const
      }
    )
    console.log('模型加载成功')
    self.postMessage({ type: 'MODEL_READY' })
  } catch (error: unknown) {
    self.postMessage({
      type: 'ERROR',
      message: '模型加载失败:' + (error as Error).message
    })
  }
}
async function generate(
  msg: string,
  config: {
    max_new_tokens?: number
    temperature?: number
    top_k?: number
    do_sample?: boolean
    pad_token_id?: number
  }
) {
  if (!generator) {
    throw new Error('模型未初始化')
  }
  const messages: { role: string; content: string }[] = [
    { role: '系统', content: '你是一位乐于助人的助手。' },
    { role: 'user', content: msg || '' }
  ]
  return await generator(messages, config)
}
