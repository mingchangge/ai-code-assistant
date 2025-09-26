import { useState } from 'react'
import { Table, Input, InputNumber, Typography, Button, Space } from 'antd'
import { EditOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import type { TableItem, TableColumn } from './types'

const { Text } = Typography

interface MetricsTableProps {
  tableData: TableItem[]
  onSaveEdit: (updatedData: TableItem[]) => void
}

const MetricsTable = ({ tableData, onSaveEdit }: MetricsTableProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<TableItem[]>([...tableData])

  // 指标名称映射（用于表格显示）
  const labelMap: Record<TableItem['key'], string> = {
    date: '日期',
    weight: '体重',
    bmi: 'BMI',
    bodyFatRate: '体脂率',
    waterRate: '水分率',
    muscleRate: '肌肉率',
    proteinRate: '蛋白质率',
    visceralFatIndex: '内脏脂肪指数',
    subcutaneousFat: '皮下脂肪',
    leanBodyMass: '去脂体重',
    bodyAge: '身体年龄',
    basalMetabolism: '基础代谢',
    activeMetabolism: '活动代谢',
    targetWeight: '目标体重',
    weightControl: '体重控制',
    fatControl: '脂肪控制',
    muscleControl: '肌肉控制',
    bodyType: '体型'
  }

  // 表格列配置
  const columns: TableColumn[] = [
    {
      title: '身体指标',
      dataIndex: 'key',
      key: 'key',
      width: '30%',
      render: (_, record) => labelMap[record.key]
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
      width: '60%',
      render: (value, record) => {
        // 非编辑状态：显示文本或提示
        if (!isEditing) {
          return value === undefined || value === '' ? (
            <Text type="warning">未识别到</Text>
          ) : (
            value
          )
        }

        // 编辑状态：根据指标类型渲染不同输入框
        const isStringType = record.key === 'date' || record.key === 'bodyType'
        return isStringType ? (
          <Input
            value={(value as string) || ''}
            onChange={e => {
              handleValueChange(record.key, e.target.value)
            }}
            placeholder="请输入内容"
          />
        ) : (
          <InputNumber
            value={value as number}
            onChange={val => {
              handleValueChange(record.key, val ?? undefined)
            }}
            style={{ width: '100%' }}
            placeholder="请输入数值"
            step={0.1}
            precision={1}
          />
        )
      }
    }
  ]

  // 编辑时更新数据
  const handleValueChange = (
    key: TableItem['key'],
    value: number | string | undefined
  ) => {
    setEditData(prev =>
      prev.map(item => (item.key === key ? { ...item, value } : item))
    )
  }

  // 切换编辑状态
  const toggleEdit = () => {
    if (isEditing) {
      // 取消编辑：恢复原始数据
      setEditData([...tableData])
    }
    setIsEditing(!isEditing)
  }

  // 保存编辑结果
  const handleSave = () => {
    onSaveEdit([...editData])
    setIsEditing(false)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '16px'
        }}
      >
        {isEditing ? (
          <Space size="middle">
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button icon={<UndoOutlined />} onClick={toggleEdit}>
              取消
            </Button>
          </Space>
        ) : (
          <Button icon={<EditOutlined />} onClick={toggleEdit}>
            编辑
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={editData}
        pagination={false}
        rowKey="key"
        bordered
        scroll={{ x: 'max-content' }}
        tableLayout="fixed"
      />
    </div>
  )
}

export default MetricsTable
