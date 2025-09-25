export interface WeightRecord {
  id?: string
  date: string
  weight?: number // 体重(公斤)
  bmi?: number // BMI
  bodyFatRate?: number // 体脂率(%)
  waterRate?: number // 水分率(%)
  muscleRate?: number // 肌肉率(%)
  proteinRate?: number // 蛋白质率(%)
  visceralFatIndex?: number // 内脏脂肪指数
  subcutaneousFat?: number // 皮下脂肪(公斤)
  leanBodyMass?: number // 去脂体重(公斤)
  bodyAge?: number // 身体年龄
  basalMetabolism?: number // 基础代谢(大卡)
  activeMetabolism?: number // 活动代谢(大卡)
  targetWeight?: number // 目标体重(公斤)
  weightControl?: number // 体重控制(公斤)
  fatControl?: number // 脂肪控制(公斤)
  muscleControl?: number // 肌肉控制(公斤)
  bodyType?: string // 体型
}

export interface RecognitionResult {
  success: boolean
  data?: Partial<WeightRecord>
  rawText?: string
  error?: string
}

export type RecognitionStatus =
  | 'idle'
  | 'loading'
  | 'processing'
  | 'complete'
  | 'error'

export interface RecognitionProgress {
  status: RecognitionStatus
  progress: number
  message: string
}
