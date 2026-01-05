//封装 YOLO 相关的预处理和推理逻辑
import * as tf from '@tensorflow/tfjs'
import type { BoundingBox, LayoutDetectionOptions } from '../types'
import { CONSTANTS, LAYOUT_NMS } from '../config'
import { getLayoutModel } from './model-state'

export async function runLayoutDetection(
  imageElement: HTMLImageElement,
  options?: LayoutDetectionOptions
): Promise<BoundingBox[]> {
  const model = getLayoutModel()
  const inputSize = CONSTANTS.LAYOUT_INPUT_SIZE
  const { width: w, height: h } = imageElement

  // 1. 确定使用的阈值 (优先使用传入的 debug 参数，否则用 config 默认值)
  const scoreThreshold =
    options?.scoreThreshold ?? CONSTANTS.CONFIDENCE_THRESHOLD

  // 2. Letterbox Preprocessing
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

  // 3. Inference
  const predictions = (await model.executeAsync(tensor)) as tf.Tensor[]
  const output = (await predictions[0].array()) as number[][][]
  const rawBoxes = output[0] || []

  tf.dispose([tensor, ...predictions])

  // 4. NMS Preparation (NMS 准备工作) ---

  const candidateBoxes: number[][] = [] // 存放 [y1, x1, y2, x2]
  const candidateScores: number[] = [] // 存放置信度
  const originalIndices: number[] = [] // 记录原始索引，用于NMS后找回数据

  for (let i = 0; i < rawBoxes.length; i++) {
    const [bx1, by1, bx2, by2, conf] = rawBoxes[i]

    // 预过滤：先剔除低于阈值的框，减少 NMS 计算量
    if (conf < scoreThreshold) continue

    // TFJS NMS 标准输入建议格式: [y1, x1, y2, x2]
    candidateBoxes.push([by1, bx1, by2, bx2])
    candidateScores.push(conf)
    originalIndices.push(i)
  }

  // 如果没有框通过初步过滤，直接返回空数组
  if (candidateBoxes.length === 0) {
    return []
  }

  // 5. Execute NMS (执行非极大值抑制) ---

  const nmsIndicesTensor = await tf.image.nonMaxSuppressionAsync(
    tf.tensor2d(candidateBoxes),
    tf.tensor1d(candidateScores),
    LAYOUT_NMS.MAX_OUTPUT_SIZE,
    LAYOUT_NMS.IOU_THRESHOLD,
    scoreThreshold // 再次传入阈值确保 NMS 内部逻辑一致
  )

  const nmsIndices = await nmsIndicesTensor.data()
  nmsIndicesTensor.dispose() // 释放 Tensor 内存

  // 6. Post-processing (Coordinate Mapping)
  const boxes: BoundingBox[] = []
  const scale = Math.min(inputSize / w, inputSize / h)
  const padX = (inputSize - Math.round(w * scale)) / 2
  const padY = (inputSize - Math.round(h * scale)) / 2

  // 遍历 NMS 保留下来的索引
  for (const nmsIndex of nmsIndices) {
    // nmsIndex 是 candidateBoxes 数组的下标
    const candidateIndex = nmsIndex
    // 通过映射表找到 rawBoxes 里的原始下标
    const originalIndex = originalIndices[candidateIndex]

    // 获取原始数据
    const [bx1, by1, bx2, by2, conf] = rawBoxes[originalIndex]

    // 坐标还原 (Un-padding & Un-scaling)
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

  console.log(
    `[Layout] 原始框: ${rawBoxes.length.toString()}, 预筛选后: ${candidateBoxes.length.toString()}, NMS去重后: ${boxes.length.toString()} (阈值: ${scoreThreshold.toString()})`
  )
  return boxes
}
