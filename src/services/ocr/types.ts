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
}

// 扩展返回类型，包含调试图片和裁剪动作
export interface ExtendedRecognitionResult extends RecognitionResult {
  debugImageUrl?: string
  // 返回一个不需要参数的函数，组件直接调用即可下载
  downloadTrainingSet?: () => Promise<void>
}
