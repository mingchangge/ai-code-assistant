import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { cleanData } from '../core/data-cleaner'
import { calculateTrend } from '../core/trend-math'
import { generateChartOption } from '../core/chart-factory'
import { METRIC_CONFIG } from '../config/metrics'

// 1. 清洗工具
export const cleanDataTool = new DynamicStructuredTool({
  name: 'clean_data',
  description: '清洗原始健康数据',
  schema: z.object({
    rawData: z.array(z.any())
  }),
  func: async ({ rawData }) => {
    return cleanData(rawData) // 直接返回对象，LangChain在本地调用时支持对象返回
  }
})

// 2. 趋势计算工具
export const trendTool = new DynamicStructuredTool({
  name: 'calc_trend',
  description: '计算指标趋势',
  schema: z.object({
    values: z.array(z.number()),
    metricKey: z.string()
  }),
  func: async ({ values, metricKey }) => {
    const config = METRIC_CONFIG[metricKey as keyof typeof METRIC_CONFIG]
    // 这里的 standard 需要从 config 获取，不通过参数传
    return calculateTrend(values, config?.standard)
  }
})

// 3. 图表工具
export const chartTool = new DynamicStructuredTool({
  name: 'gen_chart',
  description: '生成图表配置',
  schema: z.object({
    dates: z.array(z.string()),
    values: z.array(z.number()),
    label: z.string()
  }),
  func: async ({ dates, values, label }) => {
    return generateChartOption(dates, values, label)
  }
})
