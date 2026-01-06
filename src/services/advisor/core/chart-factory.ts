import type { EChartsOption } from 'echarts'

export function generateChartOption(
  dates: string[],
  values: number[],
  label: string
): EChartsOption {
  return {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', scale: true },
    series: [{ type: 'line', data: values, name: label, smooth: true }]
  }
}
