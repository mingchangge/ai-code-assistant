/**
 * 核心指标 Key (联合类型，限制 Key 的范围)
 */
export type MetricKey =
  | 'weight'
  | 'bmi'
  | 'bodyFatRate'
  | 'visceralFatIndex'
  | 'muscleRate'
  | 'skeletalMuscleRate'
  | 'waterRate'
  | 'proteinRate'
  | 'boneRatio'
  | 'subcutaneousFat'
  | 'basalMetabolism'

/**
 * 用户画像 (用于 RAG 匹配)
 */
export interface UserProfile {
  age: number
  gender: 'female' | 'male' // 可扩展 'other'
}

/**
 * 知识库条目接口
 */
export interface MatchCriteria {
  category: string // 必须与 Agent 的 MetricKey 完全一致 (e.g. 'bodyFatRate')
  gender: 'male' | 'female' | 'all'
  ageRange?: [number, number] // [min, max] (包含)，不传代表全年龄
  valueRange?: [number, number] // [min, max] (包含)，不传代表通用建议
  tags?: string[] // 辅助 LLM 检索的标签
}

// 2. 知识内容：面向 LLM 的结构化数据
export interface KnowledgeContent {
  interpretation: string // 现象解读 (直接展示给用户)
  principle?: string // 原理 (给 LLM 看：为什么会这样？)
  advice: string // 核心建议 (给用户看)
  actions?: string[] // 行动清单 (给 LLM 选：具体怎么做)
  warning?: string // 禁忌/警告 (给 LLM 做安全检查)
}

// 3. 知识条目实体
export interface KnowledgeItem {
  id: string
  criteria: MatchCriteria
  content: KnowledgeContent
  score?: number // 运行时计算的匹配度分数
}

/**
 * 数学分析结果
 */
export interface MathResult {
  current: number
  diff: number
  trend: 'up' | 'down' | 'stable'
  // 这里的 status 是基于 Config 的通用判断，RAG 会有更细致的判断
  status: 'low' | 'normal' | 'high' | 'risk' | 'unknown'
}

/**
 * 最终输出报告卡片
 */
export interface AnalysisResult {
  metric: MetricKey
  label: string
  currentValue: number
  diff: number
  trend: 'up' | 'down' | 'stable'
  status: 'low' | 'normal' | 'high' | 'risk' | 'unknown'
  advice: string // 来自 RAG
  interpretation: string // 来自 RAG
  chartOption: Record<string, unknown> // ECharts Option
}

// ... 复用你之前的 Config 相关 Type ...
export type AnalysisType = 'range' | 'max' | 'min' | 'trend_only' | 'info'
export interface MetricStandard {
  min?: number
  max?: number
  ideal?: number
}
export interface MetricConfigItem {
  label: string
  unit: string
  type: AnalysisType
  standard?: MetricStandard
  description?: string
  ragConfig?: {
    label: string
    category: string
    useDiffValue: boolean
  }
}
export type MetricConfigMap = Record<MetricKey, MetricConfigItem>

export type HealthRecord = {
  date: string
  timestamp: number
} & Partial<Record<MetricKey, number>>
