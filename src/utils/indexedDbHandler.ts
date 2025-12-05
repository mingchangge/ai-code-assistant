import type {
  BodyMetrics,
  BodyMetricsRecord,
  MetricsFileData
} from '@/views/WeightRecords/components/types'
import { v4 as uuidv4 } from 'uuid'
import localForage from 'localforage'

// 初始化IndexedDB存储
const metricsStore = localForage.createInstance({
  name: 'BodyMetricsDB',
  storeName: 'metricsRecords'
})

// 初始数据模板
const INIT_FILE_DATA: MetricsFileData = {
  version: '1.0.0',
  records: []
}

/**
 * 新增记录到IndexedDB
 */
export const addRecordToDB = async (
  metrics: BodyMetrics
): Promise<BodyMetricsRecord> => {
  const newRecord: BodyMetricsRecord = {
    ...metrics,
    id: uuidv4(),
    createdAt: Date.now()
  }

  // 去重：先删除同日期的旧记录
  await deleteRecordByDate(metrics.date)

  // 保存新记录
  await metricsStore.setItem(newRecord.id, newRecord)
  return newRecord
}

/**
 * 从IndexedDB获取所有记录（按日期倒序）
 */
export const getAllRecordsFromDB = async (): Promise<BodyMetricsRecord[]> => {
  const records: BodyMetricsRecord[] = []
  await metricsStore.iterate(value => {
    records.push(value as BodyMetricsRecord)
  })
  // 按日期倒序排序
  return records.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

/**
 * 根据日期删除记录
 */
export const deleteRecordByDate = async (date: string) => {
  const records = await getAllRecordsFromDB()
  const recordsToDelete = records.filter(record => record.date === date)
  for (const record of recordsToDelete) {
    await metricsStore.removeItem(record.id)
  }
}

/**
 * 导出记录为JSON文件
 */
export const exportRecordsToFile = async () => {
  const records = await getAllRecordsFromDB()
  const fileData: MetricsFileData = { ...INIT_FILE_DATA, records }

  // 创建JSON文件并下载
  const blob = new Blob([JSON.stringify(fileData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `身体指标记录_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从JSON文件导入记录到IndexedDB
 */
export const importRecordsFromFile = async (file: File): Promise<number> => {
  const fileContent = await file.text()
  let fileData: MetricsFileData
  try {
    fileData = JSON.parse(fileContent) as MetricsFileData
    console.log('解析后的文件数据:', fileData)
  } catch {
    throw new Error('JSON 解析失败')
  }

  if (!Array.isArray(fileData.records)) {
    throw new Error('文件格式无效')
  }

  // 批量保存记录（去重）
  let importedCount = 0
  for (const record of fileData.records) {
    // 去重：删除同日期的旧记录
    await deleteRecordByDate(record.date)

    // 确保记录有必要的字段
    const recordToSave: BodyMetricsRecord = {
      ...record,
      id: record.id || uuidv4(),
      createdAt: record.createdAt || Date.now()
    }

    await metricsStore.setItem(recordToSave.id, recordToSave)
    importedCount++
  }

  return importedCount
}

/**
 * 根据ID删除记录
 */
export const deleteRecordById = async (recordId: string) => {
  await metricsStore.removeItem(recordId)
  return true
}

/**
 * 更新记录
 */
export const updateRecord = async (updatedRecord: BodyMetricsRecord) => {
  // 如果日期变更，先删除原日期的记录
  const oldRecord = await metricsStore.getItem<BodyMetricsRecord>(
    updatedRecord.id
  )
  if (oldRecord && oldRecord.date !== updatedRecord.date) {
    await deleteRecordByDate(oldRecord.date)
  }

  await metricsStore.setItem(updatedRecord.id, updatedRecord)
  return updatedRecord
}

/**
 * 根据ID获取记录
 */
export const getRecordById = async (
  recordId: string
): Promise<BodyMetricsRecord | null> => {
  return (await metricsStore.getItem(recordId)) ?? null
}
