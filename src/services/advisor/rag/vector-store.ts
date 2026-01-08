import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'
import { Document } from '@langchain/core/documents'
import { LangChainAdapter } from './langchain-adapter'
import { HEALTH_KNOWLEDGE_DB } from './knowledge-base' // 引入新版知识库
import type { UserProfile, KnowledgeItem } from '../types'

/**
 * 辅助：判断数值是否在 criteria.valueRange 范围内
 * 只看 valueRange [min, max]
 */
function isValueMatch(item: KnowledgeItem, value: number): boolean {
  const range = item.criteria.valueRange

  // 如果没有定义 valueRange，说明是通用建议，允许通过
  if (!range) return true

  // 闭区间判断 [min, max]
  return value >= range[0] && value <= range[1]
}

/**
 * 辅助：判断年龄是否在 criteria.ageRange 范围内
 */
function isAgeMatch(item: KnowledgeItem, userAge: number): boolean {
  const range = item.criteria.ageRange

  // 如果没有定义 ageRange，说明全年龄通用
  if (!range) return true

  return userAge >= range[0] && userAge <= range[1]
}

export class HealthVectorStore {
  private store: MemoryVectorStore | null = null
  private static instance: HealthVectorStore | null = null

  static getInstance(): HealthVectorStore {
    this.instance ??= new HealthVectorStore()
    return this.instance
  }

  /**
   * 初始化：将结构化知识库转为向量
   */
  async init() {
    if (this.store) return
    const embeddings = new LangChainAdapter()

    const docs = HEALTH_KNOWLEDGE_DB.map(item => {
      const c = item.content
      const cri = item.criteria

      // 🟢 构造富语义文本用于 Embedding
      // 包含：分类、适用人群、现象解释、核心建议、原理(如果有)
      // 这样用户搜 "为什么体脂高" 也能匹配到 principle
      const textContent = `
        指标分类: ${cri.category}
        适用人群: ${cri.gender === 'all' ? '所有人' : cri.gender} ${cri.ageRange ? cri.ageRange.join('-') + '岁' : ''}
        数值范围: ${cri.valueRange ? cri.valueRange.join('-') : '通用'}
        现象: ${c.interpretation}
        建议: ${c.advice}
        原理: ${c.principle ?? ''}
        禁忌: ${c.warning ?? ''}
      `.trim()

      return new Document({
        pageContent: textContent,
        metadata: {
          // 将整个 item 存入 metadata，方便后续 filter 取用
          id: item.id,
          category: cri.category, // 用于一级过滤
          gender: cri.gender, // 用于二级过滤
          // 同时也把原始对象存进去，方便取出 advice 等字段
          _rawItem: item
        }
      })
    })

    this.store = await MemoryVectorStore.fromDocuments(docs, embeddings)
    console.log(
      `[RAG] Vector Store Ready with ${docs.length.toString()} entries (New Schema)`
    )
  }

  /**
   * 搜索建议 (兼容新 Schema)
   */
  async searchAdvice(
    query: string,
    metricKey: string,
    profile: UserProfile,
    currentValue: number
  ) {
    if (!this.store) await this.init()

    // 基础过滤器：Category + Gender (硬性条件)
    const basicFilter = (doc: Document) => {
      const m = doc.metadata

      // 1. Category 必须完全匹配 (现在知识库直接用 MetricKey，无需映射)
      if (m.category !== metricKey) return false

      // 2. Gender 必须匹配
      if (m.gender !== 'all' && m.gender !== profile.gender) return false

      return true
    }

    // 🟢 第一轮：严格模式 (Strict)
    // 必须同时满足 Age 和 Value Range
    const strictResults = await this.store?.similaritySearch(query, 1, doc => {
      if (!basicFilter(doc)) return false

      const item = doc.metadata._rawItem as KnowledgeItem

      // 3. Age 匹配
      if (!isAgeMatch(item, profile.age)) return false

      // 4. Value 匹配
      if (!isValueMatch(item, currentValue)) return false

      return true
    })

    if (strictResults && strictResults.length > 0) {
      const rawItem = strictResults[0].metadata._rawItem as KnowledgeItem
      const content = rawItem.content
      return {
        interpretation: content.interpretation,
        advice: content.advice
        // 如果你需要原理，也可以这里返回
        // principle: content.principle
      }
    }

    // 🟢 第二轮：宽容模式 (Fallback)
    // 如果数值落入真空区（比如偏瘦但知识库没写偏瘦），尝试找该分类下的通用建议
    // 通用建议的特征是：valueRange 为 undefined
    const fallbackResults = await this.store?.similaritySearch(
      query,
      1,
      doc => {
        if (!basicFilter(doc)) return false
        const item = doc.metadata._rawItem as KnowledgeItem

        // 依然要求年龄匹配
        if (!isAgeMatch(item, profile.age)) return false

        // 关键：只允许 valueRange 为空的通用建议通过
        // 这样避免把 "肥胖建议" 给 "偏瘦人"
        return !item.criteria.valueRange
      }
    )

    if (fallbackResults && fallbackResults.length > 0) {
      const rawItem = fallbackResults[0].metadata._rawItem as KnowledgeItem
      const content = rawItem.content
      return {
        interpretation:
          content.interpretation || `当前数值 ${currentValue.toString()}`,
        advice: content.advice
      }
    }

    // 真·兜底
    return {
      interpretation: '',
      advice: '建议持续保持健康生活方式，定期监测数据。'
    }
  }
}
