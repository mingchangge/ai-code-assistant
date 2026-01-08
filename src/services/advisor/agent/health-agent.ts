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

  /**
   * 构建处理单个指标的原子链 (Micro Chain)
   * 逻辑：Math -> RAG & Chart -> Format
   */
  private createMetricChain() {
    return RunnableSequence.from([
      // Step A: 并行执行 Math 计算，同时透传 Input
      RunnableMap.from({
        mathResult: async (input: MetricTaskInput) => {
          const result = await trendTool.invoke({
            values: input.values,
            metricKey: input.key
          })
          return result
        },
        input: (i: MetricTaskInput) => i
      }),

      // Step B: 串行执行 RAG 和 绘图 (依赖 Math 结果)
      RunnableMap.from({
        ragResult: async (prev: StateWithMath) => {
          const { mathResult, input } = prev
          if (!mathResult) return { advice: '', interpretation: '' }

          const config = METRIC_CONFIG[input.key]
          let targetCat = input.key as string
          let targetValue = mathResult.current

          // 读取配置中的 RAG 策略
          if (config.ragConfig) {
            targetCat = config.ragConfig.category || input.key
            if (config.ragConfig.useDiffValue) {
              targetValue = mathResult.diff
            }
          }

          const query = `状态${mathResult.status}, 趋势${mathResult.trend}`

          // 调用 RAG
          return await HealthVectorStore.getInstance().searchAdvice(
            query,
            targetCat,
            input.userProfile,
            targetValue
          )
        },
        chartOption: async (prev: StateWithMath) => {
          const { input } = prev
          const config = METRIC_CONFIG[input.key]

          return (await chartTool.invoke({
            dates: input.data.map(d => d.date),
            values: input.values,
            label: config.label
          })) as Record<string, unknown>
        },
        // 透传关键数据给下一步
        mathResult: (prev: StateWithMath) => prev.mathResult,
        metricKey: (prev: StateWithMath) => prev.input.key,
        config: (prev: StateWithMath) => METRIC_CONFIG[prev.input.key]
      }),

      // Step C: 格式化最终输出
      (res: StateWithAll): AnalysisResult | null => {
        if (!res.mathResult) return null

        return {
          metric: res.metricKey,
          label: res.config.label,
          currentValue: res.mathResult.current,
          diff: res.mathResult.diff,
          trend: res.mathResult.trend,
          status: res.mathResult.status,
          advice: res.ragResult.advice || '暂无建议',
          interpretation: res.ragResult.interpretation || '',
          chartOption: res.chartOption
        }
      }
    ])
  }

  /**
   * 主执行入口
   */
  public async execute(
    rawData: unknown[],
    userProfile: UserProfile
  ): Promise<AnalysisResult[] | null> {
    // 确保向量库已初始化
    await this.vectorStore.init()

    // 1. 清洗链: raw -> HealthRecord[]
    const cleanChain = RunnableLambda.from(async (raw: unknown) => {
      // invoke 的参数需要符合 cleanDataTool 的 schema
      return await cleanDataTool.invoke({
        rawData: raw as unknown[]
      })
    })

    // 2. 拆分链: HealthRecord[] -> MetricTaskInput[]
    const prepareInputsChain = RunnableLambda.from((data: HealthRecord[]) => {
      if (data.length === 0) return []

      const keys = Object.keys(METRIC_CONFIG) as MetricKey[]

      // 映射并过滤无效项
      const inputs = keys.map(key => {
        const values = data
          .map(d => d[key])
          .filter((v): v is number => typeof v === 'number') // 类型守卫

        if (values.length === 0) return null

        return {
          key,
          values,
          userProfile,
          data
        } as MetricTaskInput
      })

      return inputs.filter((item): item is MetricTaskInput => item !== null)
    })

    // 3. 并行处理链: MetricTaskInput[] -> AnalysisResult[]
    // 手动实现 Map 逻辑以规避 .map() 类型问题
    const metricProcessingChain = RunnableLambda.from(
      async (inputs: MetricTaskInput[]) => {
        const singleMetricChain = this.createMetricChain()

        // 使用 .map 生成一组 Promise
        const promises = inputs.map(async input => {
          try {
            // 每个任务独立运行，如果出错，由这里捕获
            return await singleMetricChain.invoke(input)
          } catch (error) {
            // ⚠️ 关键：捕获单项任务的错误，不抛出，而是返回 null
            console.error(
              `[Agent] Metric Analysis Failed for [${input.key}]:`,
              error
            )
            // 可以选择返回 null，后续 filter 掉
            // 也可以返回一个包含错误信息的 Result 对象（如果 UI 需要展示"分析失败"）
            return null
          }
        })

        return await Promise.all(promises)
      }
    )

    // 4. 组装主流程
    const mainChain = cleanChain
      .pipe(prepareInputsChain)
      .pipe(metricProcessingChain)
      // 过滤掉可能产生的 null 结果 (来自 Step C)
      .pipe((results: (AnalysisResult | null)[]) =>
        results.filter((r): r is AnalysisResult => r !== null)
      )

    try {
      const results = await mainChain.invoke(rawData)
      return results
    } catch (e) {
      console.error('LCEL Execution Failed:', e)
      return null
    }
  }
}
