// 图像预处理工具-没用上，先保留
/**
 * 手动实现clamp函数，兼容所有浏览器
 * @param value 要限制的数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制在[min, max]范围内的数值
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 安全创建Image实例
 * @returns 成功返回Image实例，失败返回null
 */
function createImage(): HTMLImageElement | null {
  try {
    if (typeof window === 'undefined') {
      return null
    }
    const img = new window.Image()
    return img instanceof HTMLImageElement ? img : null
  } catch (error) {
    console.error('创建Image实例失败:', error)
    return null
  }
}

/**
 * 将图像转换为灰度图
 * @param canvas 原始画布
 * @returns 处理后的画布
 */
function toGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    // 使用 luminance 公式计算灰度值
    const gray = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    )
    data[i] = data[i + 1] = data[i + 2] = gray
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * 图像二值化处理
 * @param canvas 灰度图画布
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
 * @param contrast 对比度级别，默认1.5
 * @returns 处理后的画布
 */
function enhanceContrast(
  canvas: HTMLCanvasElement,
  contrast = 1.5
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(factor * (data[i] - 128) + 128, 0, 255)
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128, 0, 255)
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128, 0, 255)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * 调整图像大小
 * @param canvas 原始画布
 * @param maxWidth 最大宽度，默认1200
 * @returns 调整后的画布
 */
function resize(canvas: HTMLCanvasElement, maxWidth = 1200): HTMLCanvasElement {
  const scale = maxWidth / canvas.width
  if (scale >= 1) return canvas

  const newCanvas = document.createElement('canvas')
  newCanvas.width = Math.round(canvas.width * scale)
  newCanvas.height = Math.round(canvas.height * scale)

  const ctx = newCanvas.getContext('2d')
  if (!ctx) return canvas

  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height)

  return newCanvas
}

/**
 * 完整的图像预处理流程
 * @param imageDataUrl 原始图像的DataURL
 * @returns 处理后的图像DataURL
 */
export function process(imageDataUrl: string): Promise<string> {
  return new Promise(resolve => {
    // 尝试创建Image实例
    const img = createImage()
    if (!img) {
      console.warn('不支持Image对象，使用原始图片')
      resolve(imageDataUrl)
      return
    }

    // 设置图片加载超时（5秒）
    const timeoutId = setTimeout(() => {
      console.error('图片加载超时')
      resolve(imageDataUrl)
    }, 5000)

    img.crossOrigin = 'anonymous'

    img.onerror = () => {
      clearTimeout(timeoutId)
      console.error('图片加载失败')
      resolve(imageDataUrl)
    }

    img.onload = () => {
      clearTimeout(timeoutId)
      try {
        // 检查canvas支持
        if (typeof document === 'undefined') {
          resolve(imageDataUrl)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(imageDataUrl)
          return
        }

        // 绘制图像
        try {
          ctx.drawImage(img, 0, 0)
        } catch (drawError) {
          console.error('绘制图像失败:', drawError)
          resolve(imageDataUrl)
          return
        }

        // 预处理流水线
        const resized = resize(canvas)
        const grayscale = toGrayscale(resized)
        const contrasted = enhanceContrast(grayscale)
        const binarized = binarize(contrasted)

        resolve(binarized.toDataURL('image/png'))
      } catch (error) {
        console.error('图片预处理失败:', error)
        resolve(imageDataUrl)
      }
    }

    // 设置图片源
    try {
      img.src = imageDataUrl
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('设置图片源失败:', error)
      resolve(imageDataUrl)
    }
  })
}
