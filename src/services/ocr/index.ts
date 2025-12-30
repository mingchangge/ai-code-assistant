import { initializeModels } from './core/model-state'
import { runLayoutDetection } from './core/layout'
import { runSingleOcr } from './core/ocr-engine'
import { pairAndParseResults } from './weight-domain/parser'
import { CONFIG_STANDARD } from './config'
import {
  visualizeLayoutDetection,
  cropAndDownloadTrainingSet
} from './debug/tools'
import type {
  ExtendedRecognitionResult,
  BodyMetrics,
  BoundingBox,
  RunOptions
} from './types'

// 导出函数供组件使用
export { initializeModels }

export const runRecognition = async (
  imageUrl: string,
  historyData: BodyMetrics[] = [],
  options: RunOptions = { debug: false }
): Promise<ExtendedRecognitionResult> => {
  // 1. 加载图片
  const img = new Image()
  img.src = imageUrl
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  // 2. 布局检测
  const layoutBoxes = await runLayoutDetection(img)
  if (layoutBoxes.length === 0) throw new Error('未检测到文本区域')

  // 3. 初始 OCR (使用标准配置: Bilinear保留细节)
  const recognizedBoxes: BoundingBox[] = []
  for (const box of layoutBoxes) {
    const text = await runSingleOcr(img, box.box, CONFIG_STANDARD)
    recognizedBoxes.push({ ...box, text })
  }

  // 4. 配对 + 解析 + Agent 修正 (传入 img 以便 Agent 重试)
  // 注意：你需要修改 logic/parser.ts 适配上面提到的 Agent 逻辑
  const result = await pairAndParseResults(recognizedBoxes, img, historyData)

  // 5. [新] 处理调试逻辑
  let debugImageUrl: string | undefined
  let downloadFn: (() => Promise<void>) | undefined

  if (options.debug) {
    // A. 内部直接生成图片URL
    const vizResult = visualizeLayoutDetection(img, layoutBoxes)
    debugImageUrl = vizResult.debugImageUrl

    // B. 内部封装下载函数 (闭包引用了 img 和 layoutBoxes)
    downloadFn = async () => {
      await cropAndDownloadTrainingSet(img, layoutBoxes)
    }
  }

  return {
    ...result,
    boxesForCropping: layoutBoxes,
    debugImageUrl,
    downloadTrainingSet: downloadFn
  }
}
