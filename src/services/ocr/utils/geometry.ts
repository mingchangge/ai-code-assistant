//几何运算
import type { BoundingBox } from '../types'

/**
 * 判断两个框是否在视觉上的“同一行”
 * 结合了“中心点对齐”和“垂直重叠率”两种判断，解决字号差异大导致无法匹配的问题
 */
export function isSameLine(boxA: BoundingBox, boxB: BoundingBox): boolean {
  const [, ay1, , ay2] = boxA.box
  const [, by1, , by2] = boxB.box

  // 1. 计算两个框在 Y 轴上的投影重叠区域
  const overlapY1 = Math.max(ay1, by1)
  const overlapY2 = Math.min(ay2, by2)
  const overlapHeight = Math.max(0, overlapY2 - overlapY1)

  // 2. 获取两个框的最小高度（以此为基准计算重叠比例）
  const heightA = ay2 - ay1
  const heightB = by2 - by1
  const minHeight = Math.min(heightA, heightB)

  // 3. 判断逻辑：

  // 规则 A: 重叠高度 > 最小高度的 50%
  const isOverlapping = overlapHeight > minHeight * 0.5

  // 规则 B: 中心点对齐 (放宽到 0.5，应对字号差异巨大的情况)
  const centerYA = (ay1 + ay2) / 2
  const centerYB = (by1 + by2) / 2
  const maxHeight = Math.max(heightA, heightB)
  const isCenterAligned = Math.abs(centerYA - centerYB) < maxHeight * 0.5

  return isOverlapping || isCenterAligned
}

/**
 * 从字符串中提取数字
 */
export function extractNumber(str: string): number | undefined {
  // 预处理：把句号换成点，去掉空格
  const fixed = str.replace(/。/g, '.').replace(/\s/g, '')
  // 匹配带负号和小数点的数字
  const regex = /-?\d+(\.\d+)?/
  const match = regex.exec(fixed)

  if (match) {
    const num = parseFloat(match[0])
    return isNaN(num) ? undefined : num
  }
  return undefined
}
