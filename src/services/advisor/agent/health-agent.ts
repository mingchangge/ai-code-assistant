import { cleanData } from '../core/data-cleaner'
import { calculateTrend } from '../core/trend-math'
import { generateChartOption } from '../core/chart-factory'
import { matchAdvice } from '../rag/matcher'
import { METRIC_CONFIG } from '../config/metrics'
import type { AnalysisResult, UserProfile, MetricKey } from '../types'

export class HealthAgent {
  /**
   * 执行分析流程
   * @param rawData 原始 JSON 数据
   * @param userProfile 用户画像 (必填，用于精准匹配 RAG)
   */
  public async execute(
    rawData: unknown[],
    userProfile: UserProfile
  ): Promise<AnalysisResult[] | null> {
    try {
      // 1. 数据清洗
      const data = cleanData(rawData)
      if (data.length === 0) {
        console.warn('HealthAgent: 无有效数据')
        return null
      }

      const results: AnalysisResult[] = []
      const keys = Object.keys(METRIC_CONFIG) as MetricKey[]

      // 2. 遍历指标
      for (const key of keys) {
        // 提取数值
        const values = data
          .map(d => d[key])
          .filter((v): v is number => typeof v === 'number')
        if (values.length === 0) continue

        const config = METRIC_CONFIG[key]

        // 3. 数学计算 (Math Layer)
        const mathResult = calculateTrend(values, config.standard)
        if (!mathResult) continue

        // 4. 知识匹配 (RAG Layer)
        // 将 userProfile 传入，实现分人群建议
        const knowledge = matchAdvice(key, mathResult, userProfile)

        // 5. 图表生成 (Vis Layer)
        const chartOption = generateChartOption(
          data.map(d => d.date),
          values,
          config.label
        )

        results.push({
          metric: key,
          label: config.label,
          currentValue: mathResult.current,
          diff: mathResult.diff,
          trend: mathResult.trend,
          status: mathResult.status,
          advice: knowledge.advice,
          interpretation: knowledge.interpretation,
          chartOption
        })
      }
      // 模拟一点延迟，让 loading 动画有机会展示（防止闪烁）
      await new Promise(resolve => setTimeout(resolve, 300))
      return results
    } catch (e) {
      console.error('HealthAgent Execution Error:', e)
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          reject(new Error(e as string))
        }, 300)
      )
      return null
    }
  }
}
