/**
 * 图像预处理工具模块 - 增强文字清晰度，提高OCR识别率
 * 采用"模块化独立函数"设计，符合现代ES规范，规避类相关ESLint规则冲突
 */

/**
 * 辅助函数：手动实现clamp功能（替代Math.clamp，解决兼容性问题）
 * @param value 要限制的数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制在[min, max]范围内的数值
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 裁剪图像的指定区域
 * @param canvas 原始画布
 * @param x 裁剪区域左上角X坐标
 * @param y 裁剪区域左上角Y坐标
 * @param width 裁剪区域宽度
 * @param height 裁剪区域高度
 * @returns 裁剪后的画布
 */
export function crop(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  // 确保裁剪区域在画布范围内
  const clampedX = clamp(x, 0, canvas.width)
  const clampedY = clamp(y, 0, canvas.height)
  const clampedWidth = clamp(width, 0, canvas.width - clampedX)
  const clampedHeight = clamp(height, 0, canvas.height - clampedY)

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = clampedWidth
  resultCanvas.height = clampedHeight

  const resultCtx = resultCanvas.getContext('2d')
  if (!resultCtx) throw new Error('无法创建裁剪结果画布上下文')

  resultCtx.drawImage(
    canvas,
    clampedX,
    clampedY,
    clampedWidth,
    clampedHeight,
    0,
    0,
    clampedWidth,
    clampedHeight
  )

  return resultCanvas
}

/**
 * 将图像转换为灰度图
 * @param canvas 原始画布
 * @returns 处理后的画布
 */
function toGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // 遍历每个像素，转换为灰度（考虑人眼敏感度）
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    data[i] = gray // R
    data[i + 1] = gray // G
    data[i + 2] = gray // B
  }

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = width
  resultCanvas.height = height
  resultCanvas.getContext('2d')?.putImageData(imageData, 0, 0)

  return resultCanvas
}

/**
 * 图像二值化处理 - 让文字更清晰，背景更纯净
 * @param canvas 灰度图画布
 * @param threshold 阈值(0-255)，默认128
 * @returns 处理后的画布
 */
function binarize(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 计算全局阈值
  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i]
    count++
  }
  const threshold = (sum / count) * 0.9

  // 二值化处理
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0
    data[i] = data[i + 1] = data[i + 2] = value
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * 增强图像对比度
 * @param canvas 原始画布
 * @param contrast 对比度值(1.0为正常，>1增强，<1减弱)
 * @returns 处理后的画布
 */
function enhanceContrast(
  canvas: HTMLCanvasElement,
  contrast = 1.5
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  // 调整每个像素的对比度
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255)
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255)
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255)
  }

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = width
  resultCanvas.height = height
  resultCanvas.getContext('2d')?.putImageData(imageData, 0, 0)

  return resultCanvas
}

/**
 * 去除图像噪声
 * @param canvas 原始画布
 * @param radius 降噪半径，越大效果越强但可能损失细节
 * @returns 处理后的画布
 */
function denoise(canvas: HTMLCanvasElement, radius = 1): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  const width = canvas.width
  const height = canvas.height
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const result = new Uint8ClampedArray(data)

  // 简单中值滤波降噪
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      const pixels = []

      // 收集周围像素
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = clamp(x + dx, 0, width - 1)
          const ny = clamp(y + dy, 0, height - 1)
          const nIndex = (ny * width + nx) * 4
          pixels.push(data[nIndex])
        }
      }

      // 排序取中值
      pixels.sort((a, b) => a - b)
      const median = pixels[Math.floor(pixels.length / 2)]

      result[index] = median
      result[index + 1] = median
      result[index + 2] = median
    }
  }

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = width
  resultCanvas.height = height
  const resultCtx = resultCanvas.getContext('2d')
  if (resultCtx) {
    resultCtx.putImageData(new ImageData(result, width, height), 0, 0)
  }

  return resultCanvas
}
/**
 * 缩放图像到合适尺寸(优化识别性能和精度)
 * @param canvas 原始画布
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 缩放后的画布
 */
export function resize(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const width = canvas.width
  const height = canvas.height

  // 计算缩放比例
  const scale = Math.min(maxWidth / width, maxHeight / height)
  const newWidth = Math.round(width * scale)
  const newHeight = Math.round(height * scale)

  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = newWidth
  resultCanvas.height = newHeight

  const ctx = resultCanvas.getContext('2d')
  if (!ctx) throw new Error('无法获取画布上下文')

  // 平滑缩放
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight)

  return resultCanvas
}
/**
 * 完整的预处理流程
 * @param imageDataUrl 原始图像DataURL
 * @param cropOptions 可选的裁剪参数 {x, y, width, height}
 * @returns 处理后的图像DataURL
 */
export async function preprocessImage(
  imageDataUrl: string,
  isEnhancement?: boolean,
  cropOptions?: { x: number; y: number; width: number; height: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        // 创建原始画布
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('无法创建画布')
        ctx.drawImage(img, 0, 0)

        // 预处理流水线
        let processed = canvas
        console.log('裁剪参数:', cropOptions)
        // 如果提供了裁剪参数，则先裁剪图像
        if (cropOptions) {
          console.log('裁剪参数:', cropOptions)
          // 校验参数是否合法（x/y必须>=0，width/height必须>0）
          const { x, y, width, height } = cropOptions
          if (width <= 0 || height <= 0) {
            console.warn('裁剪参数无效，跳过裁剪')
          } else {
            processed = crop(processed, x, y, width, height)
            // 调试：打印裁剪后的尺寸，确认是否执行
            console.log('裁剪后尺寸:', processed.width, processed.height)
          }
        }
        if (isEnhancement) {
          // 缩放到合适尺寸
          processed = resize(processed, 1200, 800)
          // 转为灰度
          processed = toGrayscale(processed)
          // 增强对比度
          processed = enhanceContrast(processed)
          // 降噪处理--暂时不降噪，会影响识别
          // processed = denoise(processed)
          // 二值化处理
          processed = binarize(processed)
        }

        // 转为DataURL返回
        resolve(processed.toDataURL('image/png'))
      } catch (error: unknown) {
        console.error(
          `图片预处理失败:${error instanceof Error ? error.message : String(error)}`
        )
        reject(error instanceof Error ? error : new Error(`图片预处理失败`))
      }
    }
    img.onerror = reject
    img.src = imageDataUrl
  })
}
