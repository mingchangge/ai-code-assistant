import type { HealthRecord, MetricKey } from '../types'

/**
 * 字段映射表：兼容中文 Key
 */
const KEY_MAPPING: Record<string, MetricKey> = {
  体重: 'weight',
  Weight: 'weight',
  BMI: 'bmi',
  体脂率: 'bodyFatRate',
  体脂: 'bodyFatRate',
  内脏脂肪: 'visceralFatIndex',
  内脏脂肪等级: 'visceralFatIndex',
  肌肉: 'muscleRate',
  肌肉率: 'muscleRate',
  骨骼肌率: 'skeletalMuscleRate',
  水分: 'waterRate',
  水分率: 'waterRate',
  蛋白质: 'proteinRate',
  蛋白质率: 'proteinRate',
  骨量: 'boneRatio',
  基础代谢: 'basalMetabolism'
}

/**
 * 类型守卫：判断是否为有效的 MetricKey
 */
function isMetricKey(key: string): key is MetricKey {
  return Object.values(KEY_MAPPING).includes(key as MetricKey)
}

/**
 * 原生日期解析辅助函数
 * 将日期字符串转换为 Unix 时间戳 (秒)
 */
function parseTimestamp(dateStr: string): number | null {
  const date = new Date(dateStr)
  const time = date.getTime()
  // 检查是否为有效日期 (Invalid Date 的 time 为 NaN)
  if (isNaN(time)) {
    console.warn(`Invalid date format: ${dateStr}`)
    return null
  }
  // 转换为秒级时间戳
  return Math.floor(time / 1000)
}

/**
 * 数据清洗核心函数
 */
export function cleanData(rawData: unknown[]): HealthRecord[] {
  if (!Array.isArray(rawData)) return []

  return rawData
    .map((item): HealthRecord | null => {
      // 1. 基础校验
      if (!item || typeof item !== 'object') return null

      // 2. 日期处理 (原生实现)
      // 支持 'YYYY-MM-DD', 'YYYY/MM/DD', 时间戳数字等格式
      const dateStr = item.date || item.Date || item.time
      if (!dateStr) return null

      const timestamp = parseTimestamp(String(dateStr))
      if (timestamp === null) return null

      const record: HealthRecord = {
        date: String(dateStr),
        timestamp: timestamp
      }

      // 3. 动态字段映射与数值转换
      Object.entries(item).forEach(([k, v]) => {
        // 跳过 date 字段，避免覆盖
        if (k === 'date' || k === 'Date') return

        const standardKey = KEY_MAPPING[k] || k

        if (isMetricKey(standardKey)) {
          const num = parseFloat(String(v))
          // 仅保留有效数字
          if (!isNaN(num)) {
            record[standardKey] = num
          }
        }
      })

      // 4. 业务规则：必须包含体重才视为有效记录
      if (record.weight === undefined) return null

      return record
    })
    .filter((r): r is HealthRecord => r !== null) // TS 类型收窄
    .sort((a, b) => a.timestamp - b.timestamp) // 按时间升序排序
}
