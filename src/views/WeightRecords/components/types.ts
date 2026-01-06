// 导入服务层定义的类型
import type {
  BodyMetrics,
  RecognitionResult,
  ExtendedRecognitionResult,
  BoundingBox
} from '@/services/ocr/types'

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
export type {
  BodyMetrics,
  RecognitionResult,
  ExtendedRecognitionResult,
  BoundingBox
}
