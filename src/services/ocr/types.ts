//提取所有公共接口，防止循环引用
export interface BoundingBox {
  box: number[] // [x1, y1, x2, y2]
  label?: string
  text?: string
  confidence?: number
}

export interface BodyMetrics {
  date: string
  weight?: number
  bmi?: number
  bodyFatRate?: number
  waterRate?: number
  skeletalMuscleRate?: number
  boneRatio?: number
  proteinRate?: number
  muscleRate?: number
  visceralFatIndex?: number
  subcutaneousFat?: number
  leanBodyMass?: number
  bodyAge?: number
  basalMetabolism?: number
  activeMetabolism?: number
  targetWeight?: number
  weightControl?: number
  fatControl?: number
  muscleControl?: number
  bodyType?: string
}
export interface RecognitionControllerProps {
  historyRecords: BodyMetrics[]
  isRecognizing: boolean
  selectedImage: string | null
  // 更新sendRecognizedData的类型签名
  sendRecognizedData: (data: RecognitionResult) => void
  sendIsRecognizing: (isRecognizing: boolean) => void
}
export interface RecognitionResult {
  rawText: string
  parsedData: BodyMetrics
  boxesForCropping?: BoundingBox[]
}

// OCR 运行配置
export interface OcrConfig {
  padLeft: number
  padRight: number
  padTop: number
  padBottom: number
  binarize: boolean
  binarizeThreshold: number
  resizeMethod: 'bilinear' | 'nearest'
}
/**
 * 中间结果类型：不仅存值，还必须存 box 和 image，以便 Agent 回溯
 */
export interface PairedItem {
  key: string
  valueText: string
  box: BoundingBox // 关键：保存坐标以便重切
}

export interface RunOptions {
  debug?: boolean
  useRAG?: boolean
}

// 扩展返回类型，包含调试图片和裁剪动作
export interface ExtendedRecognitionResult extends RecognitionResult {
  debugImageUrl?: string
  // 返回一个不需要参数的函数，组件直接调用即可下载
  downloadTrainingSet?: () => Promise<void>
}
export interface AgentContext {
  key: string // 字段名 (如 "蛋白质率")
  originalText: string // 第一次识别的文本 (如 "119")
  box: BoundingBox // 对应的框
  image: HTMLImageElement // 原图
  history?: BodyMetrics[]
  context?: Record<string, number | undefined> // 上下文数据（如其他字段的数值）
}
export interface AgentResult {
  finalText: string
  isCorrected: boolean
  correctionReason?: string
}
export interface Range {
  min: number
  max: number
  avg: number
  isHardLimit: boolean // 标记：是否是绝对物理极限（而非历史推算）
}

export interface VolatilityConfig {
  [key: string]: number // 允许任意字符串索引，值为数字
  default: number // 必须包含 default
}

export interface KnowledgeItem {
  key: string | undefined // 标准 Key，如 'weight'
  label: string // 中文标签，如 '体重'
  vector: number[] // 预计算的向量
}
