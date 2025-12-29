// 负责模型的加载、初始化和单例持有
import * as tf from '@tensorflow/tfjs'
import * as ort from 'onnxruntime-web'
import { MODEL_PATHS } from '../config'

// 状态持有
let layoutModel: tf.GraphModel | null = null
let ocrSession: ort.InferenceSession | null = null
let intToChar = new Map<number, string>()

export async function initializeModels() {
  if (layoutModel && ocrSession && intToChar.size > 0) {
    return
  }

  try {
    console.log('正在初始化模型...')
    await tf.setBackend('webgl')

    ort.env.wasm.wasmPaths = MODEL_PATHS.WASM_PATH
    ort.env.wasm.proxy = true

    const [loadedLayout, loadedOcr, charsetContent] = await Promise.all([
      tf.loadGraphModel(MODEL_PATHS.LAYOUT_MODEL),
      ort.InferenceSession.create(MODEL_PATHS.OCR_MODEL, {
        executionProviders: ['wasm']
      }),
      fetch(MODEL_PATHS.CHARSET).then(res => res.text())
    ])

    layoutModel = loadedLayout
    ocrSession = loadedOcr

    // 解析字符集
    const characters = charsetContent.split('')
    intToChar = new Map(characters.map((char, index) => [index + 1, char]))

    console.log(`✅ 模型加载完毕。字符集大小: ${intToChar.size.toString()}`)
  } catch (error) {
    console.error('模型初始化失败:', error)
    throw new Error('模型初始化失败，请检查网络或文件路径。')
  }
}

export function getLayoutModel() {
  if (!layoutModel) throw new Error('LayoutModel 未初始化')
  return layoutModel
}

export function getOcrSession() {
  if (!ocrSession) throw new Error('OCR Session 未初始化')
  return ocrSession
}

export function getIntToCharMap() {
  return intToChar
}
