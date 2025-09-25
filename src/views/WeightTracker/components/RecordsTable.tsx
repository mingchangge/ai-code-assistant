import { Table, Button, Space, Typography, Tag, Empty } from 'antd'
import { DeleteOutlined, CalendarOutlined } from '@ant-design/icons'
import type { WeightRecord } from './types'

interface RecordsTableProps {
  records: WeightRecord[]
  onDeleteRecord: (id: string) => void
  disabled?: boolean
}

const RecordsTable = ({
  records,
  onDeleteRecord,
  disabled = false
}: RecordsTableProps) => {
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: WeightRecord, b: WeightRecord) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <Typography.Text>{date}</Typography.Text>
        </Space>
      )
    },
    {
      title: '体重(kg)',
      dataIndex: 'weight',
      key: 'weight',
      sorter: (a: WeightRecord, b: WeightRecord) =>
        (a.weight ?? 0) - (b.weight ?? 0),
      render: (weight: number | null) => weight ?? '-'
    },
    {
      title: 'BMI',
      dataIndex: 'bmi',
      key: 'bmi',
      sorter: (a: WeightRecord, b: WeightRecord) => (a.bmi ?? 0) - (b.bmi ?? 0),
      render: (bmi: number | null) => {
        if (bmi === null) return '-'

        let color = 'green'
        if (bmi < 18.5) color = 'blue'
        else if (bmi >= 24 && bmi < 28) color = 'orange'
        else if (bmi >= 28) color = 'red'

        return <Tag color={color}>{bmi.toFixed(1)}</Tag>
      }
    },
    {
      title: '体脂率(%)',
      dataIndex: 'bodyFat',
      key: 'bodyFat',
      sorter: (a: WeightRecord, b: WeightRecord) =>
        (a.bodyFatRate ?? 0) - (b.bodyFatRate ?? 0),
      render: (bodyFatRate: number | null) => bodyFatRate ?? '-'
    },
    {
      title: '肌肉量(kg)',
      dataIndex: 'muscleMass',
      key: 'muscleMass',
      sorter: (a: WeightRecord, b: WeightRecord) =>
        (a.muscleRate ?? 0) - (b.muscleRate ?? 0),
      render: (muscleRate: number | null) => muscleRate ?? '-'
    },
    {
      title: '水分率(%)',
      dataIndex: 'waterRate',
      key: 'waterRate',
      sorter: (a: WeightRecord, b: WeightRecord) =>
        (a.waterRate ?? 0) - (b.waterRate ?? 0),
      render: (waterRate: number | null) => waterRate ?? '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: WeightRecord) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            onDeleteRecord(record.id ?? '')
          }}
          disabled={disabled}
        >
          删除
        </Button>
      )
    }
  ]

  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty description="暂无体重记录" />
        <Typography.Text
          type="secondary"
          style={{ marginTop: '16px', display: 'block' }}
        >
          上传并识别体重表后，记录将显示在这里
        </Typography.Text>
      </div>
    )
  }

  return (
    <Table
      columns={columns}
      dataSource={records}
      rowKey="id"
      pagination={{ pageSize: 5 }}
      bordered
      scroll={{ x: 'max-content' }}
    />
  )
}

export default RecordsTable
