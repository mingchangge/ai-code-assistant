/** 身体指标数据类型 */
export interface BodyMetrics {
  date: string
  weight: number | undefined
  bmi: number | undefined
  bodyFatRate: number | undefined
  waterRate: number | undefined
  muscleRate: number | undefined
  skeletalMuscleRate: number | undefined
  boneRatio: number | undefined
  proteinRate: number | undefined
  visceralFatIndex: number | undefined
  subcutaneousFat: number | undefined
  leanBodyMass: number | undefined
  bodyAge: number | undefined
  basalMetabolism: number | undefined
  activeMetabolism: number | undefined
  targetWeight: number | undefined
  weightControl: number | undefined
  fatControl: number | undefined
  muscleControl: number | undefined
  bodyType: string
  // 添加索引签名，允许动态访问属性
  [key: string]: string | number | undefined
}
export interface metricsConfigType {
  key: keyof BodyMetrics
  label: string
  type: 'string' | 'number'
  required?: boolean
  unit?: string
  precision?: number
}
/** 单条身体指标记录（含元数据） */
export interface BodyMetricsRecord extends BodyMetrics {
  id: string // 唯一标识（UUID）
  createdAt: number // 记录创建时间戳（毫秒）
}

/** 本地文件存储的完整数据结构 */
export interface MetricsFileData {
  version: string // 数据版本（便于后续结构升级）
  records: BodyMetricsRecord[]
}
/** 表格数据类型 */
export interface TableItem {
  key: keyof BodyMetrics
  value: number | string | undefined
}

/** 表格列配置类型 */
export interface TableColumn {
  title: string
  dataIndex: string
  key: string
  width?: number | string
  render?: (
    value: number | string | undefined,
    record: TableItem
  ) => React.ReactNode
}
export interface BoundingBox {
  label: 'label' | 'value'
  box: [number, number, number, number] // [x1, y1, x2, y2]
  text?: string
}

export interface RecognitionResult {
  rawText: string
  parsedData: BodyMetrics
}
