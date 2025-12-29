//提供原子化的 OCR 能力，支持传入不同配置，已支持Agent 调用
import * as tf from '@tensorflow/tfjs'
import * as ort from 'onnxruntime-web'
import { CONSTANTS } from '../config'
import { getOcrSession, getIntToCharMap } from './model-state'
import type { OcrConfig } from '../types'

/**
 * 运行单次 OCR 推理
 * @param imageElement 全图
 * @param box 裁剪框 [x1, y1, x2, y2]
 * @param config OCR配置（Padding, 二值化等）
 */
export async function runSingleOcr(
  imageElement: HTMLImageElement,
  box: number[],
  config: OcrConfig
): Promise<string> {
  const session = getOcrSession()
  const [x1, y1, x2, y2] = box
  const { width: imgW, height: imgH } = imageElement

  // 1. 应用 Config 的 Padding
  const cx1 = Math.max(0, x1 - config.padLeft)
  const cy1 = Math.max(0, y1 - config.padTop)
  const cx2 = Math.min(imgW, x2 + config.padRight)
  const cy2 = Math.min(imgH, y2 + config.padBottom)

  const cw = cx2 - cx1
  const ch = cy2 - cy1

  if (cw <= 0 || ch <= 0) return ''

  // 2. Canvas 裁剪与预处理
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, cw, ch)
  ctx.drawImage(imageElement, cx1, cy1, cw, ch, 0, 0, cw, ch)

  // 3. (可选) 二值化处理
  if (config.binarize) {
    const imgData = ctx.getImageData(0, 0, cw, ch)
    const d = imgData.data
    const thresh = config.binarizeThreshold
    for (let i = 0; i < d.length; i += 4) {
      const avg = (d[i] + d[i + 1] + d[i + 2]) / 3
      const v = avg < thresh ? 0 : 255
      d[i] = d[i + 1] = d[i + 2] = v
    }
    ctx.putImageData(imgData, 0, 0)
  }

  // 4. Tensor 转换
  const tensor = tf.tidy(() => {
    let t = tf.browser.fromPixels(canvas, 1)
    t = t.resizeBilinear([
      CONSTANTS.OCR_INPUT_HEIGHT,
      CONSTANTS.OCR_INPUT_WIDTH
    ])
    return t.toFloat().div(255.0).expandDims(0).transpose([0, 3, 1, 2])
  })

  // 5. ONNX 推理
  try {
    const feed = {
      input: new ort.Tensor('float32', tensor.dataSync(), tensor.shape)
    }
    const res = await session.run(feed)
    return decodePrediction(res.output)
  } finally {
    tf.dispose(tensor)
  }
}

function decodePrediction(output: ort.Tensor): string {
  const data = output.data as Float32Array
  const [, seqLen, numChars] = output.dims
  const map = getIntToCharMap()

  let text = ''
  let lastIdx = 0

  for (let i = 0; i < seqLen; i++) {
    const start = i * numChars
    const slice = data.slice(start, start + numChars)
    const maxIdx = slice.indexOf(Math.max(...slice))

    if (maxIdx > 0 && maxIdx !== lastIdx) {
      text += map.get(maxIdx) ?? ''
    }
    lastIdx = maxIdx
  }
  return text
}
