//封装 YOLO 相关的预处理和推理逻辑
import * as tf from '@tensorflow/tfjs'
import type { BoundingBox } from '../types'
import { CONSTANTS } from '../config'
import { getLayoutModel } from './model-state'

export async function runLayoutDetection(
  imageElement: HTMLImageElement
): Promise<BoundingBox[]> {
  const model = getLayoutModel()
  const inputSize = CONSTANTS.LAYOUT_INPUT_SIZE
  const { width: w, height: h } = imageElement

  // 1. Letterbox Preprocessing
  const tensor = tf.tidy(() => {
    const imgTensor = tf.browser.fromPixels(imageElement)
    const scale = Math.min(inputSize / w, inputSize / h)
    const newH = Math.round(h * scale)
    const newW = Math.round(w * scale)

    const resized = tf.image.resizeBilinear(imgTensor, [newH, newW])

    const padH = Math.round((inputSize - newH) / 2)
    const padBottom = inputSize - newH - padH
    const padW = Math.round((inputSize - newW) / 2)
    const padRight = inputSize - newW - padW

    return resized
      .pad(
        [
          [padH, padBottom],
          [padW, padRight],
          [0, 0]
        ],
        114.0
      )
      .div(255.0)
      .expandDims(0)
  })

  // 2. Inference
  const predictions = (await model.executeAsync(tensor)) as tf.Tensor[]
  const output = (await predictions[0].array()) as number[][][]
  const rawBoxes = output[0] || []

  tf.dispose([tensor, ...predictions])

  // 3. Post-processing (Coordinate Mapping)
  const boxes: BoundingBox[] = []
  const scale = Math.min(inputSize / w, inputSize / h)
  const padX = (inputSize - Math.round(w * scale)) / 2
  const padY = (inputSize - Math.round(h * scale)) / 2

  for (const boxData of rawBoxes) {
    const [bx1, by1, bx2, by2, conf, cls] = boxData
    console.log('检测到的框数据:', boxData, cls)
    if (conf < CONSTANTS.CONFIDENCE_THRESHOLD) continue

    const x1 = (bx1 - padX) / scale
    const y1 = (by1 - padY) / scale
    const x2 = (bx2 - padX) / scale
    const y2 = (by2 - padY) / scale

    boxes.push({
      label: 'text_block',
      box: [x1, y1, x2, y2],
      confidence: conf
    })
  }

  return boxes
}
