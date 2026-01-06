import type { MathResult, MetricStandard } from '../types'

export function calculateTrend(
  values: number[],
  standard?: MetricStandard
): MathResult | null {
  if (values.length === 0) return null

  const current = values[values.length - 1]
  const previous = values.length > 1 ? values[values.length - 2] : current
  const diff = Number((current - previous).toFixed(2))

  // 趋势判断
  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (diff > 0.1) trend = 'up'
  else if (diff < -0.1) trend = 'down'

  // 状态判断 (基于 Config 的基础判断)
  let status: MathResult['status'] = 'normal' // 默认为 normal

  if (standard) {
    if (standard.min !== undefined && current < standard.min) status = 'low'
    else if (standard.max !== undefined && current > standard.max)
      status = 'high'

    // 如果定义了 ideal，偏离太远也可以算 risk，这里简化处理
  } else {
    status = 'unknown'
  }

  return { current, diff, trend, status }
}
