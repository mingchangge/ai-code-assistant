import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { BoundingBox } from '../types'
import { CONFIG_AGGRESSIVE } from '../config' // 使用配置里的值

/**
 * 可视化布局检测结果
 * 功能：同时绘制 YOLO 原始检测框（实线）和 OCR 扩充裁剪框（红色虚线）
 */
export function visualizeLayoutDetection(
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): { debugImageUrl: string } {
  const canvas = document.createElement('canvas')
  // 使用图片的原始分辨率
  const imgW = imageElement.naturalWidth
  const imgH = imageElement.naturalHeight
  canvas.width = imgW
  canvas.height = imgH

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法获取2D上下文')

  // 1. 绘制底图
  ctx.drawImage(imageElement, 0, 0)

  // 2. 定义 padding 值（从配置中获取）
  const padLeft = CONFIG_AGGRESSIVE.padLeft
  const padRight = CONFIG_AGGRESSIVE.padRight
  const padTop = CONFIG_AGGRESSIVE.padTop
  const padBottom = CONFIG_AGGRESSIVE.padBottom

  // 3. 绘制每个框
  for (const item of boxes) {
    const [x1, y1, x2, y2] = item.box
    const width = x2 - x1
    const height = y2 - y1

    // --- A. 绘制原始 YOLO 检测框 (保持你原本的逻辑) ---
    // 使用随机亮色，实线
    const color = `hsl(${(Math.random() * 360).toString()}, 90%, 60%)`
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.setLineDash([]) // 确保是实线
    ctx.strokeRect(x1, y1, width, height)

    // --- B. 绘制加了 Padding 后的 OCR 裁剪框 (新增) ---
    // 计算扩充后的坐标 (注意不要超出图片边界)
    const x1_c = Math.max(0, x1 - padLeft)
    const y1_c = Math.max(0, y1 - padTop)
    const x2_c = Math.min(imgW, x2 + padRight)
    const y2_c = Math.min(imgH, y2 + padBottom)

    const width_c = x2_c - x1_c
    const height_c = y2_c - y1_c

    // 绘制样式：红色虚线框，稍微细一点
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)' // 鲜红色，带一点透明
    ctx.lineWidth = 1 // 线条细一点，区分原始框
    ctx.setLineDash([4, 2]) // 设置虚线模式：4px实线，2px空白
    ctx.strokeRect(x1_c, y1_c, width_c, height_c)
  }

  return { debugImageUrl: canvas.toDataURL('image/jpeg') }
}

/**
 * 裁剪所有检测框并打包下载为zip
 * @param imageElement 原始图片
 * @param boxes 从布局检测中得到的边界框数组
 */
export async function cropAndDownloadTrainingSet(
  imageElement: HTMLImageElement,
  boxes: BoundingBox[]
): Promise<void> {
  const zip = new JSZip()
  const imagesFolder = zip.folder('images') // 在zip包内创建一个images文件夹

  if (!imagesFolder) {
    throw new Error('创建zip文件夹失败')
  }

  // 用于生成labels.txt的内容
  const labelsContent: string[] = []

  // 使用Promise.all来并行处理所有裁剪操作
  await Promise.all(
    boxes.map(async (item, index) => {
      const [x1, y1, x2, y2] = item.box
      const width = Math.max(1, x2 - x1) // 确保宽高至少为1
      const height = Math.max(1, y2 - y1)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 从原始大图中裁剪
      ctx.drawImage(imageElement, x1, y1, width, height, 0, 0, width, height)

      // 将canvas内容转为Blob
      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, 'image/png')
      })
      if (blob) {
        // 使用唯一的临时文件名
        const filename = `image_${index.toString()}_fixme.png`
        imagesFolder.file(filename, blob)
        // 为labels.txt添加一行，内容是 "images/filename.png [请在这里填写正确文本]"
        labelsContent.push(`images/${filename}\t[REPLACE_WITH_CORRECT_TEXT]`)
      }
    })
  )

  // 将labels.txt添加到zip根目录
  zip.file('labels.txt', labelsContent.join('\n'))

  // 生成zip文件并触发下载
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, 'ocr_finetune_dataset.zip')
}
