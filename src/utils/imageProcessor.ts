/**
 * 图像预处理工具类 - 增强文字清晰度，提高OCR识别率
 */
export class ImageProcessor {
  /**
   * 辅助函数：手动实现clamp功能（替代Math.clamp，解决兼容性问题）
   * @param value 要限制的数值
   * @param min 最小值
   * @param max 最大值
   * @returns 限制在[min, max]范围内的数值
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  /**
   * 将图像转换为灰度图
   * @param canvas 原始画布
   * @returns 处理后的画布
   */
  static toGrayscale(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取画布上下文')

    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 遍历每个像素，转换为灰度
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      data[i] = avg // R
      data[i + 1] = avg // G
      data[i + 2] = avg // B
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
  static binarize(
    canvas: HTMLCanvasElement,
    threshold = 128
  ): HTMLCanvasElement {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取画布上下文')

    const width = canvas.width
    const height = canvas.height
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // 遍历每个像素，根据阈值转为黑白
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] >= threshold ? 255 : 0
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
    }

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = width
    resultCanvas.height = height
    resultCanvas.getContext('2d')?.putImageData(imageData, 0, 0)

    return resultCanvas
  }

  /**
   * 增强图像对比度
   * @param canvas 原始画布
   * @param contrast 对比度值(1.0为正常，>1增强，<1减弱)
   * @returns 处理后的画布
   */
  static enhanceContrast(
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

    // 调整每个像素的对比度（使用手动实现的clamp替代Math.clamp）
    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.clamp(factor * (data[i] - 128) + 128, 0, 255)
      data[i + 1] = this.clamp(factor * (data[i + 1] - 128) + 128, 0, 255)
      data[i + 2] = this.clamp(factor * (data[i + 2] - 128) + 128, 0, 255)
    }

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = width
    resultCanvas.height = height
    resultCanvas.getContext('2d')?.putImageData(imageData, 0, 0)

    return resultCanvas
  }

  /**
   * 缩放图像到合适尺寸(优化识别性能和精度)
   * @param canvas 原始画布
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @returns 缩放后的画布
   */
  static resize(
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
   * @returns 处理后的图像DataURL
   */
  static async preprocessImage(imageDataUrl: string): Promise<string> {
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
          const resized = this.resize(canvas, 1200, 800) // 缩放到合适尺寸
          const grayscale = this.toGrayscale(resized) // 转为灰度
          const contrasted = this.enhanceContrast(grayscale) // 增强对比度
          const processed = this.binarize(contrasted, 150) // 二值化处理

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
}
