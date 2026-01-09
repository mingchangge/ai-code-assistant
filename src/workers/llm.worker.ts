import { MLCEngine, CreateMLCEngine, prebuiltAppConfig } from '@mlc-ai/web-llm'

// 1. 类型定义
declare const self: Worker

interface InitMessage {
  type: 'init'
  modelId: string
}
interface GenerateMessage {
  type: 'generate'
  systemPrompt: string
  userPrompt: string
}
type WorkerMessage = InitMessage | GenerateMessage

// 2. 全局状态
let engine: MLCEngine | null = null

// 3. 初始化逻辑封装
const handleInit = async (msg: InitMessage) => {
  if (engine) {
    console.log('🔄 [Worker] 引擎已存在，跳过初始化')
    self.postMessage({ type: 'init-done' })
    return
  }

  console.log('⚙️ [Worker] 开始初始化引擎...')

  const selectedModel = prebuiltAppConfig.model_list.find(
    m => m.model_id === msg.modelId
  )
  if (!selectedModel) throw new Error(`Model ${msg.modelId} not found`)

  const appConfig = {
    model_list: [{ ...selectedModel, vram_required_MB: 1500 }]
  }

  // ⚡️ 性能优化：进度节流变量
  // 防止 postMessage 过于频繁轰炸主线程
  let lastProgress = -1
  let lastText = ''

  engine = await CreateMLCEngine(msg.modelId, {
    appConfig,
    initProgressCallback: report => {
      const currentProgress = Math.floor(report.progress * 100)

      // 🚀 核心优化：只有进度变化 > 1% 或 状态文本改变时才发送消息，这样可以将几千次通信减少到几百次，显著减少卡顿
      if (currentProgress > lastProgress || report.text !== lastText) {
        lastProgress = currentProgress
        lastText = report.text

        console.log(
          `⏳ [Worker] 加载: ${currentProgress.toFixed(2)}% - ${report.text}`
        )

        self.postMessage({
          type: 'progress',
          progress: report.progress,
          text: report.text
        })
      }
    }
  })

  console.log('✅ [Worker] 引擎初始化成功')
  self.postMessage({ type: 'init-done' })
}

// 4. 生成逻辑封装
const handleGenerate = async (msg: GenerateMessage) => {
  if (!engine) throw new Error('Engine not initialized')

  const reply = await engine.chat.completions.create({
    messages: [
      { role: 'system', content: msg.systemPrompt },
      { role: 'user', content: msg.userPrompt }
    ],
    temperature: 0.7,
    stream: true,
    frequency_penalty: 1.1,
    presence_penalty: 1.1,
    max_tokens: 800
  })

  for await (const chunk of reply) {
    const delta = chunk.choices[0]?.delta?.content ?? ''
    if (delta) {
      self.postMessage({ type: 'token', delta })
    }
  }
  self.postMessage({ type: 'done' })
}

// 5. 主消息监听器 (路由分发)
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data
  console.log('📩 [Worker] 收到消息:', msg.type) // 可选：减少日志噪音

  try {
    switch (msg.type) {
      case 'init':
        await handleInit(msg)
        break

      case 'generate':
        await handleGenerate(msg)
        break

      default:
        console.warn('⚠️ [Worker] 未知消息类型:', msg)
    }
  } catch (error) {
    console.error('❌ [Worker] 内部错误:', error)
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

// 🟢 6. 兜底错误捕获
self.onerror = err => {
  console.error('💥 [Worker] 全局未捕获错误:', err)
}
