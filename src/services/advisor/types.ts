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
export interface KnowledgeItem {
  id: string
  category: string // 对应 MetricKey 的分类或通用分类
  gender: 'female' | 'male' | 'all'
  age_group?: string // 支持 "12-18", "50+", "all"

  // 阈值匹配条件 (可选)
  normal_min?: number
  normal_max?: number
  low_threshold?: number
  high_threshold?: number
  overweight_threshold?: number
  obese_threshold?: number
  bmi_min?: number
  bmi_max?: number
  athlete_range_min?: number
  athlete_range_max?: number
  // 输出内容
  interpretation?: string
  advice: string

  // 其他元数据
  symptoms?: string[]
  [key: string]: unknown
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
}
export type MetricConfigMap = Record<MetricKey, MetricConfigItem>

export type HealthRecord = {
  date: string
  timestamp: number
} & Partial<Record<MetricKey, number>>
