import {
  RunnableSequence,
  RunnableMap,
  RunnableLambda
} from '@langchain/core/runnables'
import { cleanDataTool, trendTool, chartTool } from './tools'
import { HealthVectorStore } from '../rag/vector-store'
import { METRIC_CONFIG } from '../config/metrics'
import type {
  UserProfile,
  MetricKey,
  HealthRecord,
  AnalysisResult,
  MetricTaskInput,
  StateWithMath,
  StateWithAll
} from '../types'

export class HealthAgent {
  private vectorStore: HealthVectorStore

  constructor() {
    this.vectorStore = HealthVectorStore.getInstance()
  }

  // 创建单项指标处理链 (Math -> RAG -> Chart)
  private createMetricChain() {
    return RunnableSequence.from([
      RunnableMap.from({
        mathResult: async (input: MetricTaskInput) =>
          await trendTool.invoke({
            values: input.values,
            metricKey: input.key
          }),
        input: (i: MetricTaskInput) => i
      }),
      RunnableMap.from({
        ragResult: async (prev: StateWithMath) => {
          const { mathResult, input } = prev
          if (!mathResult) return { advice: '', interpretation: '' }
          const config = METRIC_CONFIG[input.key]
          let targetCat = input.key as string
          let targetValue = mathResult.current
          if (config.ragConfig) {
            targetCat = config.ragConfig.category || input.key
            if (config.ragConfig.useDiffValue) targetValue = mathResult.diff
          }
          return await this.vectorStore.searchAdvice(
            `状态${mathResult.status}`,
            targetCat,
            input.userProfile,
            targetValue
          )
        },
        chartOption: async (prev: StateWithMath) => {
          const config = METRIC_CONFIG[prev.input.key]
          return (await chartTool.invoke({
            dates: prev.input.data.map(d => d.date),
            values: prev.input.values,
            label: config.label
          })) as Record<string, unknown>
        },
        mathResult: (prev: StateWithMath) => prev.mathResult,
        metricKey: (prev: StateWithMath) => prev.input.key,
        config: (prev: StateWithMath) => METRIC_CONFIG[prev.input.key]
      }),
      (res: StateWithAll): AnalysisResult | null => {
        if (!res.mathResult) return null
        return {
          metric: res.metricKey,
          label: res.config.label,
          currentValue: res.mathResult.current,
          diff: res.mathResult.diff,
          trend: res.mathResult.trend,
          status: res.mathResult.status,
          advice: res.ragResult.advice || '',
          interpretation: res.ragResult.interpretation || '',
          chartOption: res.chartOption
        }
      }
    ])
  }

  // 执行基础分析
  public async executeBasic(
    rawData: unknown[],
    userProfile: UserProfile
  ): Promise<AnalysisResult[]> {
    await this.vectorStore.init()

    const cleanChain = RunnableLambda.from(
      async (raw: unknown) =>
        await cleanDataTool.invoke({
          rawData: raw as unknown[]
        })
    )

    const prepareInputsChain = RunnableLambda.from((data: HealthRecord[]) => {
      const keys = Object.keys(METRIC_CONFIG) as MetricKey[]
      return keys
        .map(key => {
          const values = data
            .map(d => d[key])
            .filter((v): v is number => typeof v === 'number')
          return values.length > 0 ? { key, values, userProfile, data } : null
        })
        .filter((item): item is MetricTaskInput => item !== null)
    })

    const metricProcessingChain = RunnableLambda.from(
      async (inputs: MetricTaskInput[]) => {
        const singleMetricChain = this.createMetricChain()
        const results = await Promise.all(
          inputs.map(async input => {
            try {
              return await singleMetricChain.invoke(input)
            } catch (e) {
              console.error(`Analysis failed for ${input.key}`, e)
              return null
            }
          })
        )
        return results.filter((r): r is AnalysisResult => r !== null)
      }
    )

    return await cleanChain
      .pipe(prepareInputsChain)
      .pipe(metricProcessingChain)
      .invoke(rawData)
  }
}
