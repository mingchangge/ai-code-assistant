import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Input,
  InputNumber,
  message,
  Typography,
  Tag,
  Upload,
  Tooltip
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  SyncOutlined,
  UploadOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import type { TableProps } from 'antd'
import type { UploadProps } from 'antd'
import type { BodyMetricsRecord, metricsConfigType } from './types'
import {
  deleteRecordById,
  updateRecord,
  getRecordById,
  exportRecordsToFile,
  importRecordsFromFile,
  getAllRecordsFromDB
} from '@/utils/indexedDbHandler'

// type UploadChangeParam = Parameters<NonNullable<UploadProps['onChange']>>[0]
type TableRowSelection<T extends object = object> =
  TableProps<T>['rowSelection']
export interface HistoryRecordsRef {
  refreshRecords: () => Promise<void>
}

const { Text, Paragraph } = Typography
const { Column } = Table

// 所有身体指标配置（包含显示名称、单位和精度）
const metricsConfig: metricsConfigType[] = [
  { key: 'date', label: '测量日期', type: 'string', required: true },
  { key: 'weight', label: '体重', type: 'number', unit: 'kg', precision: 2 },
  { key: 'bmi', label: 'BMI', type: 'number', precision: 2 },
  {
    key: 'bodyFatRate',
    label: '体脂率',
    type: 'number',
    unit: '%',
    precision: 2
  },
  {
    key: 'waterRate',
    label: '水分率',
    type: 'number',
    unit: '%',
    precision: 2
  },
  {
    key: 'skeletalMuscleRate',
    label: '骨骼肌率',
    type: 'number',
    unit: '%',
    precision: 2
  },
  {
    key: 'boneRatio',
    label: '骨骼率',
    type: 'number',
    unit: '%',
    precision: 2
  },
  {
    key: 'proteinRate',
    label: '蛋白质率',
    type: 'number',
    unit: '%',
    precision: 2
  },

  {
    key: 'visceralFatIndex',
    label: '内脏脂肪指数',
    type: 'number',
    precision: 0
  },
  {
    key: 'subcutaneousFat',
    label: '皮下脂肪',
    type: 'number',
    unit: 'mm',
    precision: 1
  },
  {
    key: 'leanBodyMass',
    label: '去脂体重',
    type: 'number',
    unit: 'kg',
    precision: 1
  },
  {
    key: 'bodyAge',
    label: '身体年龄',
    type: 'number',
    unit: '岁',
    precision: 0
  },
  {
    key: 'basalMetabolism',
    label: '基础代谢',
    type: 'number',
    unit: 'kcal',
    precision: 0
  },
  {
    key: 'activeMetabolism',
    label: '活动代谢',
    type: 'number',
    unit: 'kcal',
    precision: 0
  },
  {
    key: 'targetWeight',
    label: '目标体重',
    type: 'number',
    unit: 'kg',
    precision: 1
  },
  { key: 'bodyType', label: '体型', type: 'string' }
] as const

interface HistoryRecordsProps {
  records: BodyMetricsRecord[]
  onRecordsChange: (records: BodyMetricsRecord[]) => void
}

const HistoryRecords = forwardRef<HistoryRecordsRef, HistoryRecordsProps>(
  ({ records, onRecordsChange }, ref) => {
    // 状态管理
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [currentRecord, setCurrentRecord] =
      useState<BodyMetricsRecord | null>(null)
    const [editFormData, setEditFormData] = useState<
      Partial<BodyMetricsRecord>
    >({})
    const [isLoading, setIsLoading] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

    // 当前编辑记录变化时更新表单数据
    useEffect(() => {
      if (currentRecord) {
        setEditFormData({ ...currentRecord })
      }
    }, [currentRecord])

    // 打开编辑弹窗
    const handleEdit = async (record: BodyMetricsRecord) => {
      try {
        setIsLoading(true)
        const latestRecord = await getRecordById(record.id)
        if (latestRecord) {
          setCurrentRecord(latestRecord)
          setEditFormData({ ...latestRecord })
          setEditModalVisible(true)
        } else {
          message.error('记录不存在或已被删除')
        }
      } catch (err) {
        message.error('加载记录失败')
        console.error('加载记录失败:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // 确认删除记录
    const handleDelete = (recordId: string) => {
      Modal.confirm({
        title: '确认删除',
        content: '此操作将永久删除该记录，删除后不可恢复',
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        async onOk() {
          try {
            setIsLoading(true)
            await deleteRecordById(recordId)
            // 更新记录列表
            const updatedRecords = records.filter(r => r.id !== recordId)
            onRecordsChange(updatedRecords)
            message.success('记录已删除')
          } catch (err) {
            message.error('删除失败，请重试')
            console.error('删除记录失败:', err)
          } finally {
            setIsLoading(false)
          }
        }
      })
    }

    // 处理表单数据变更
    const handleFormChange = (
      key: keyof BodyMetricsRecord,
      value: string | number | null | undefined
    ) => {
      // 过滤掉null值，确保不会将null传入状态
      const sanitizedValue = value === null ? undefined : value
      setEditFormData((prev: Partial<BodyMetricsRecord>) => ({
        ...prev,
        [key]: sanitizedValue
      }))
    }

    // 保存修改
    const handleSaveEdit = async () => {
      if (!currentRecord) return

      // 基础验证
      if (!editFormData.date) {
        message.warning('请填写日期')
        return
      }

      try {
        setIsLoading(true)
        // 构建更新后的记录
        const updatedRecord: BodyMetricsRecord = {
          ...currentRecord,
          ...editFormData,
          id: currentRecord.id, // 保持ID不变
          createdAt: currentRecord.createdAt // 保持创建时间不变
        }

        // 保存到数据库
        const savedRecord = await updateRecord(updatedRecord)
        if (savedRecord.id) {
          // 更新列表
          const updatedRecords = records.map(r =>
            r.id === currentRecord.id ? savedRecord : r
          )
          onRecordsChange(updatedRecords)
          setEditModalVisible(false)
          message.success('记录已更新')
        } else {
          message.error('更新失败，请重试')
        }
      } catch (err) {
        message.error('更新失败，请重试')
        console.error('更新记录失败:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // 表格选择功能配置
    const rowSelection: TableRowSelection<BodyMetricsRecord> = {
      selectedRowKeys,
      onChange: keys => {
        setSelectedRowKeys(keys as string[])
      }
    }

    // 批量删除选中记录
    const handleBatchDelete = () => {
      if (selectedRowKeys.length === 0) {
        message.warning('请先选择要删除的记录')
        return
      }

      Modal.confirm({
        title: '批量删除',
        content: `确认删除选中的 ${selectedRowKeys.length.toString()} 条记录？`,
        okText: '确认删除',
        cancelText: '取消',
        okType: 'danger',
        async onOk() {
          try {
            setIsLoading(true)
            // 批量删除
            for (const id of selectedRowKeys) {
              await deleteRecordById(id)
            }
            // 更新列表
            const updatedRecords = records.filter(
              r => !selectedRowKeys.includes(r.id)
            )
            onRecordsChange(updatedRecords)
            setSelectedRowKeys([])
            message.success(
              `已删除 ${selectedRowKeys.length.toString()} 条记录`
            )
          } catch (err) {
            message.error('批量删除失败')
            console.error('批量删除失败:', err)
          } finally {
            setIsLoading(false)
          }
        }
      })
    }

    // 清空选中状态
    const handleClearSelection = () => {
      setSelectedRowKeys([])
    }
    // 使用useImperativeHandle将方法暴露给父组件
    useImperativeHandle(ref, () => ({
      refreshRecords
    }))
    // 刷新记录列表
    const refreshRecords = async () => {
      try {
        const dbRecords = await getAllRecordsFromDB()
        onRecordsChange(dbRecords)
        message.success('记录已更新')
      } catch (err) {
        message.error('刷新记录失败')
        console.error('刷新记录失败:', err)
      }
    }
    // 处理导入文件
    const handleImportFile = async (file: File) => {
      console.log('导入文件:', file)
      setIsImporting(true)
      try {
        const importedCount = await importRecordsFromFile(file)
        await refreshRecords()
        message.success(`成功导入 ${importedCount.toString()} 条记录`)
      } catch (err) {
        message.error('导入失败：文件格式无效')
        console.error(err)
      } finally {
        setIsImporting(false)
      }
    }
    // 上传组件配置（用于导入）
    const importUploadProps: UploadProps = {
      name: 'file',
      accept: '.json',
      multiple: false, // 允许用户一次选多个文件时设为 true，这里强制单文件
      maxCount: 1, // AntD 4.17+ 支持：超过 1 个会自动把旧的替换掉
      showUploadList: false,
      beforeUpload: () => false, // 阻止自动上传
      onChange: info => {
        // 2. 只拿最新这一次选中的文件
        const rawFile = info.file as unknown as File
        console.log('上传文件:', rawFile, info)
        void handleImportFile(rawFile) // 直接传 File 对象
      }
    }
    // 处理导出文件
    const handleExportFile = async () => {
      if (records.length === 0) {
        message.warning('暂无记录可导出')
        return
      }

      try {
        await exportRecordsToFile()
        message.success('导出成功')
      } catch (err) {
        message.error('导出失败')
        console.error('导出失败:', err)
      }
    }
    const btnArray = () => (
      <div>
        <Space size="middle">
          <Button
            variant="outlined"
            color="primary"
            icon={<ReloadOutlined />}
            onClick={() => void refreshRecords()}
          >
            刷新
          </Button>
          <Upload {...importUploadProps}>
            <Button
              icon={<UploadOutlined />}
              variant="outlined"
              color="purple"
              loading={isImporting}
            >
              导入
            </Button>
          </Upload>
          <Button
            icon={<DownloadOutlined />}
            variant="outlined"
            color="cyan"
            onClick={() => void handleExportFile()}
          >
            导出
          </Button>
        </Space>
      </div>
    )
    if (records.length === 0) {
      return (
        <Card title="历史数据管理" variant="outlined">
          <div style={{ textAlign: 'right' }}>{btnArray()}</div>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Paragraph type="secondary">暂无身体指标记录</Paragraph>
            <Text type="secondary">
              请上传图片识别并保存记录，或导入已有记录文件
            </Text>
          </div>
        </Card>
      )
    }

    return (
      <>
        {/* 记录表格 - 包含所有指标字段 */}
        <Card title="历史数据管理" variant="outlined">
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {/* 批量操作工具栏 */}
            {records.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <Space size="middle">
                  <Button
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleClearSelection}
                    icon={<SyncOutlined />}
                    size="small"
                  >
                    清空选择
                  </Button>
                  <Button
                    danger
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleBatchDelete}
                    icon={<DeleteOutlined />}
                    size="small"
                  >
                    批量删除 ({selectedRowKeys.length})
                  </Button>
                </Space>
              </div>
            )}
            {btnArray()}
          </div>

          <Table
            dataSource={records}
            rowKey="id"
            rowSelection={rowSelection}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20'],
              showTotal: total => `共 ${total.toString()} 条记录`
            }}
            scroll={{ x: 'max-content' }} // 横向滚动支持
            loading={isLoading}
            size="middle"
          >
            {/* 日期列 */}
            <Column
              title="测量日期"
              dataIndex="date"
              key="date"
              width={120}
              sorter={(a: BodyMetricsRecord, b: BodyMetricsRecord) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              }
            />

            {/* 体重列 */}
            <Column
              title="体重(kg)"
              dataIndex="weight"
              key="weight"
              width={100}
              sorter={(a: BodyMetricsRecord, b: BodyMetricsRecord) =>
                (a.weight ?? 0) - (b.weight ?? 0)
              }
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />

            {/* BMI列 */}
            <Column
              title="BMI"
              dataIndex="bmi"
              key="bmi"
              width={80}
              sorter={(a: BodyMetricsRecord, b: BodyMetricsRecord) =>
                (a.bmi ?? 0) - (b.bmi ?? 0)
              }
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />

            {/* 体脂率列 */}
            <Column
              title="体脂率(%)"
              dataIndex="bodyFatRate"
              key="bodyFatRate"
              width={100}
              sorter={(a: BodyMetricsRecord, b: BodyMetricsRecord) =>
                (a.bodyFatRate ?? 0) - (b.bodyFatRate ?? 0)
              }
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />

            {/* 水分率列 */}
            <Column
              title="水分率(%)"
              dataIndex="waterRate"
              key="waterRate"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            <Column
              title="骨骼肌率(%)"
              dataIndex="skeletalMuscleRate"
              key="skeletalMuscleRate"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 骨骼率列 */}
            <Column
              title="骨骼率(%)"
              dataIndex="boneRatio"
              key="boneRatio"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 蛋白质率列 */}
            <Column
              title="蛋白质率(%)"
              dataIndex="proteinRate"
              key="proteinRate"
              width={110}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 肌肉率列 */}
            <Column
              title="肌肉率(%)"
              dataIndex="muscleRate"
              key="muscleRate"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />

            <Column
              title="内脏脂肪指数"
              dataIndex="visceralFatIndex"
              key="visceralFatIndex"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 去脂体重列 */}
            <Column
              title="去脂体重(kg)"
              dataIndex="leanBodyMass"
              key="leanBodyMass"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 基础代谢列 */}
            <Column
              title="基础代谢"
              dataIndex="basalMetabolism"
              key="basalMetabolism"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 活动代谢列 */}
            <Column
              title="活动代谢"
              dataIndex="activeMetabolism"
              key="activeMetabolism"
              width={100}
              render={(value: string | number | null) =>
                value ?? <Text type="secondary">--</Text>
              }
            />
            {/* 体型列 */}
            <Column
              title="体型"
              dataIndex="bodyType"
              key="bodyType"
              width={100}
              render={value =>
                value ? <Tag>{value}</Tag> : <Text type="secondary">--</Text>
              }
            />
            {/* 操作列 */}
            <Column
              title="操作"
              key="action"
              width={160}
              render={(_, record: BodyMetricsRecord) => (
                <Space size="small">
                  <Tooltip title="编辑记录">
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => void handleEdit(record)}
                      disabled={isLoading}
                    />
                  </Tooltip>
                  <Tooltip title="删除记录">
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={() => {
                        handleDelete(record.id)
                      }}
                      disabled={isLoading}
                    />
                  </Tooltip>
                </Space>
              )}
            />
          </Table>
        </Card>

        {/* 编辑弹窗 - 包含所有可编辑字段 */}
        <Modal
          title="编辑身体指标记录"
          open={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false)
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setEditModalVisible(false)
              }}
              icon={<CloseOutlined />}
              disabled={isLoading}
            >
              取消
            </Button>,
            <Button
              key="save"
              type="primary"
              onClick={() => void handleSaveEdit()}
              icon={<SaveOutlined />}
              loading={isLoading}
            >
              保存修改
            </Button>
          ]}
          width={900}
          destroyOnHidden
          maskClosable={false}
        >
          {currentRecord && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                maxHeight: '500px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}
            >
              {metricsConfig.map(
                ({ key, label, type, unit, precision, required }) => (
                  <div
                    key={key}
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Text strong>
                        {label}
                        {unit ? `(${unit})` : ''}
                      </Text>
                      {required && <Text type="danger">*</Text>}
                    </label>

                    {type === 'string' ? (
                      <Input
                        value={(editFormData[key] as string) || ''}
                        onChange={e => {
                          handleFormChange(key, e.target.value)
                        }}
                        placeholder={`请输入${label}`}
                        disabled={isLoading}
                      />
                    ) : (
                      <InputNumber
                        value={editFormData[key] as number}
                        onChange={value => {
                          handleFormChange(key, value)
                        }}
                        placeholder={`请输入${label}`}
                        style={{ width: '100%' }}
                        step={0.01}
                        precision={precision}
                        disabled={isLoading}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </Modal>
      </>
    )
  }
)

export default HistoryRecords
