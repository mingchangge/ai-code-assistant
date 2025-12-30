/** * 根据历史数据，分析某指标的合理范围
 * @param history 过去 N 次的记录
 * @param key 指标 Key (如 'weight')
 *
 *
 */
import type { BodyMetrics, Range, VolatilityConfig } from '../types'
import {
  METRIC_KEY_MAP,
  VOLATILITY,
  DAILY_EXPANSION,
  MAX_CAP
} from './constants'

// 配置参数
const CONFIG = {
  // 1. 基础容忍度 (Base Tolerance): 即使是连续两天，也允许的突变比例
  BASE_VOLATILITY: VOLATILITY as VolatilityConfig,
  // 2. 时间膨胀系数 (Daily Expansion): 每多隔一天，容忍度增加多少
  DAILY_EXPANSION: DAILY_EXPANSION, // 每天增加 1% 的容忍度

  // 3. 最大容忍上限 (Max Cap)
  MAX_VOLATILITY: MAX_CAP // 最多允许 30% 的变化
}

/**
 * 计算中位数 (比平均值更抗干扰)
 */
function getMedian(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * 纯原生计算日期差（单位：天）
 */
function getDaysDifference(
  d1: string | number | Date,
  d2: string | number | Date
): number {
  const date1 = new Date(d1).getTime()
  const date2 = new Date(d2).getTime()
  if (isNaN(date1) || isNaN(date2)) return 0

  const diffTime = Math.abs(date1 - date2)
  // 向上取整，只要过了一瞬间也算隔了一天（为了让Agent更宽容）
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateDynamicRanges(
  history: BodyMetrics[] | undefined,
  specificDateStr?: string
): Record<string, Range> {
  if (!history || history.length === 0) return {}

  const ranges: Record<string, Range> = {}

  // 按日期降序
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // 1. 确定时间差
  const latestRecord = sortedHistory[0]
  // 如果传入了特定日期用特定日期，否则用当前时间
  const targetTime = specificDateStr ?? new Date()

  const daysDiff = getDaysDifference(targetTime, latestRecord.date)

  const fields = Object.values(METRIC_KEY_MAP) as (keyof BodyMetrics)[]

  fields.forEach(field => {
    const validValues = sortedHistory
      .map(h => {
        const val = h[field]
        return val !== undefined ? Number(val) : NaN
      })
      .filter(v => !isNaN(v) && v !== 0)
      .slice(0, 7) // 取最近7次

    if (validValues.length === 0) return

    const median = getMedian(validValues)

    // 2. 动态波动率计算
    const specificVol = CONFIG.BASE_VOLATILITY[field as string]
    const baseVol = specificVol
    let dynamicVol = baseVol + daysDiff * CONFIG.DAILY_EXPANSION
    dynamicVol = Math.min(dynamicVol, CONFIG.MAX_VOLATILITY)

    if (field.includes('Control') || field.includes('Difference')) {
      // 控制类指标略微放宽
      const absLimit = 5 + daysDiff * 0.1
      ranges[field] = {
        avg: median,
        min: -absLimit,
        max: absLimit,
        isHardLimit: false
      }
    } else {
      ranges[field as string] = {
        avg: median,
        min: median * (1 - dynamicVol),
        max: median * (1 + dynamicVol),
        isHardLimit: false
      }
    }
  })

  return ranges
}
