import {
  MLCEngine,
  CreateMLCEngine,
  prebuiltAppConfig,
  hasModelInCache,
  type AppConfig
} from '@mlc-ai/web-llm'

// 类型定义
declare const self: DedicatedWorkerGlobalScope

interface InitMessage {
  type: 'init'
  modelId: string
  useNetworkModel: boolean
}
interface GenerateMessage {
  type: 'generate'
  systemPrompt: string
  userPrompt: string
}
type WorkerMessage = InitMessage | GenerateMessage

// 全局状态
let engine: MLCEngine | null = null

// 🛠️ 工具函数：检测 URL 是否可用 (通过请求轻量级的 config json)
const checkUrlAvailability = async (
  baseUrl: string,
  timeoutMs = 8000, // 默认超时延长至 8秒
  retries = 2 // 允许重试 2 次
): Promise<boolean> => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeoutMs)

      // 加上时间戳参数 ?t=... 防止被浏览器强缓存干扰检测结果
      const res = await fetch(
        `${baseUrl}/mlc-chat-config.json?t=${Date.now().toString()}`,
        {
          method: 'HEAD',
          signal: controller.signal
        }
      )
      clearTimeout(timeoutId)

      if (res.ok) return true
    } catch (e) {
      // 如果是最后一次尝试，且失败了
      if (i === retries) {
        console.warn(`⚠️ [Worker] 网络探测失败 (${baseUrl}):`, e)
        return false
      }
      // 如果还有重试机会，等待 1秒 后重试
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return false
}
/**
 * 🛠️ 核心方法：模型配置解析策略
 * 策略：HF -> HF Mirror -> Local
 */
const resolveModelConfig = async (
  modelId: string,
  useNetwork: boolean,
  origin: string
): Promise<AppConfig> => {
  // 1. 获取预设配置
  const selectedModel = prebuiltAppConfig.model_list.find(
    m => m.model_id === modelId
  )
  if (!selectedModel)
    throw new Error(`Model ${modelId} not found in prebuilt config`)
  // 2. 构建 URL 路径
  const hfUrl = selectedModel.model
  const mirrorUrl = hfUrl.replace('huggingface.co', 'hf-mirror.com')

  const folderName = 'Qwen2.5-1.5B-Instruct-q4f32_1' // 你的本地文件夹名
  const localModelUrl = `${origin}/models/${folderName}`
  const localWasmUrl = `${origin}/models/${folderName}/Qwen2-1.5B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm`
  console.log(
    '🔍 [Worker] 本地模型路径:',
    localModelUrl,
    '🔍 [Worker] 本地 WASM 路径:',
    localWasmUrl
  )
  /**
   * 🌳 缓存优先策略 (Cache First Strategy)
   */

  // 先检查 HuggingFace 版本是否已缓存
  const hfAppConfig = { model_list: [{ ...selectedModel, model: hfUrl }] }
  const isHfCached = await hasModelInCache(modelId, hfAppConfig).catch(
    () => false
  )

  if (isHfCached) {
    console.log('💾 [Worker] 发现 HuggingFace 版本的本地缓存，跳过网络检测！')
    return hfAppConfig
  }

  // 再检查 Mirror 版本是否已缓存
  const mirrorAppConfig = {
    model_list: [{ ...selectedModel, model: mirrorUrl }]
  }
  const isMirrorCached = await hasModelInCache(modelId, mirrorAppConfig).catch(
    () => false
  )

  if (isMirrorCached) {
    console.log('💾 [Worker] 发现镜像站版本的本地缓存，跳过网络检测！')
    return mirrorAppConfig
  }

  /**
   * 🌳 分支逻辑: 无缓存，需要根据网络状况决定
   */
  let finalModelUrl = ''
  let finalWasmUrl = selectedModel.model_lib // 默认使用官方 CDN 的 WASM
  if (useNetwork) {
    console.log('🌐 [Worker] 尝试网络模式...')

    // 尝试 Hugging Face 官方
    console.log('🔍 [Worker] 检测 Hugging Face 连接...')
    const isHfOk = await checkUrlAvailability(hfUrl)

    if (isHfOk) {
      console.log('✅  [Worker] 网络通畅: 选中 Hugging Face')
      finalModelUrl = hfUrl
    } else {
      console.warn('⚠️ [Worker] Hugging Face 连不上，尝试镜像...')

      // 尝试 HF Mirror
      const isMirrorOk = await checkUrlAvailability(mirrorUrl)

      if (isMirrorOk) {
        console.log('✅ [Worker] 网络通畅: 选中 HF Mirror')
        finalModelUrl = mirrorUrl
      } else {
        console.error('❌ [Worker] 网络源全部不可用，降级为本地模式...')
        // 降级到本地 (Fallback)
        finalModelUrl = localModelUrl
        finalWasmUrl = localWasmUrl // 既然都断网了，WASM 也得用本地的
      }
    }
  } else {
    // 最终强制本地模式保底
    console.log('🏠 [Worker] 强制使用本地模式')
    finalModelUrl = localModelUrl
    finalWasmUrl = localWasmUrl
  }

  // 打印最终结果
  console.log(
    `🚀 [Worker] 最终模型地址: ${finalModelUrl}，最终 WASM 地址: ${finalWasmUrl}，选中模型: ${selectedModel.model_id}`
  )

  // 构造最终配置
  return {
    model_list: [
      {
        ...selectedModel,
        model: finalModelUrl,
        model_lib: finalWasmUrl,
        vram_required_MB: 1500,
        low_resource_required: true
      }
    ]
  }
}
// 初始化逻辑封装
const handleInit = async (msg: InitMessage) => {
  if (engine) {
    console.log('🔄 [Worker] 引擎已存在，跳过初始化')
    self.postMessage({ type: 'init-done' })
    return
  }

  console.log('⚙️ [Worker] 开始初始化引擎...')

  try {
    console.log('🔍 [Worker] 初始化参数:', msg)
    // 解析模型配置
    const appConfig = await resolveModelConfig(
      msg.modelId,
      msg.useNetworkModel,
      self.location.origin
    )

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
  } catch (err) {
    // 捕获 resolveModelConfig 或 CreateMLCEngine 的错误
    console.error('❌ [Worker] 初始化流程中断:', err)
    self.postMessage({ type: 'error', error: String(err) })
  }
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
