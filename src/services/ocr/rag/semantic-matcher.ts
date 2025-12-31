import { embeddingEngine } from './embedding-engine'
import { cosineSimilarity } from '../utils/math'
import { METRIC_KEY_MAP } from '../weight-domain/constants' // 你的标准 Key 映射
import type { KnowledgeItem } from '../types'

// 构建语义匹配器
export class SemanticMatcher {
  private knowledgeBase: KnowledgeItem[] = []
  private isReady = false
  // 匹配阈值：太低会误匹配，太高会漏匹配
  // 0.8 是个不错的经验值， 0.82 是个比较安全的阈值
  private readonly THRESHOLD = 0.8

  /**
   * 初始化：将标准库向量化 (Indexing)
   * 这一步在 App 启动或首次 OCR 时做
   */
  async initialize() {
    if (this.isReady) return

    const standardLabels = Object.keys(METRIC_KEY_MAP)

    console.log('[RAG] Building Index for keys:', standardLabels)

    for (const label of standardLabels) {
      // 获取 '体重'、'BMI' 等标准词的向量
      const vector = await embeddingEngine.embed(label)
      this.knowledgeBase.push({
        key: METRIC_KEY_MAP[label], // 映射回英文 key 'weight'
        label: label,
        vector
      })
    }

    this.isReady = true
    console.log('[RAG] Index Built. Knowledge Size:', this.knowledgeBase.length)
  }

  /**
   * 核心功能：输入 OCR 乱码，返回最匹配的标准 Key
   */
  async findBestMatch(ocrText: string): Promise<string | null> {
    if (!this.isReady) await this.initialize()

    // 1. 将 OCR 识别到的文本向量化 (Query Embedding)
    const queryVector = await embeddingEngine.embed(ocrText)

    // 2. 暴力搜索 (因为 Key 很少，只有十几个，不需要 HNSW 等复杂索引)
    let maxScore = -1
    let bestMatchKey = null
    let bestMatchLabel = ''

    for (const item of this.knowledgeBase) {
      let score = cosineSimilarity(queryVector, item.vector)

      // 🌟 长度惩罚 (Length Penalty)
      // 如果 OCR文字长度 和 标准库文字长度 差异过大，扣分
      // 防止 "脂肪"(2) 强行匹配 "内脏脂肪指数"(6)
      const lenDiff = Math.abs(ocrText.length - item.label.length)
      if (lenDiff > 0) {
        // 稍微温和一点的惩罚：每差一个字扣 0.05 分
        score = score - lenDiff * 0.05
      }

      if (score > maxScore) {
        maxScore = score
        bestMatchKey = item.key
        bestMatchLabel = item.label
      }
    }

    if (maxScore >= this.THRESHOLD && bestMatchKey) {
      console.log(
        `[RAG] "${ocrText}" match "${bestMatchLabel}" score: ${maxScore.toFixed(4)}`
      )
      return bestMatchKey
    }

    return null
  }
}

export const semanticMatcher = new SemanticMatcher()
