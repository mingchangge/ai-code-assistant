import { useState, useEffect } from 'react'
import { Select, Card } from 'antd'
import type { BodyMetricsRecord } from './types'
import BaseECharts from '@/components/BaseECharts'

function HistoryEcharts({ records }: { records: BodyMetricsRecord[] }) {
  console.log(records)
  const [selected, setSelected] = useState('weight')
  const [chartData, setChartData] = useState<(string | number | undefined)[]>(
    []
  )
  const [xAxisData, setXAxisData] = useState<string[]>([])

  const onChange = (value: string) => {
    setSelected(value)
    const newData = records.filter(item => item[value]).map(item => item[value])
    setChartData(newData)
    const newXAxisData = records
      .filter(item => item.date)
      .map(item => item.date)
    setXAxisData(newXAxisData)
  }

  useEffect(() => {
    setChartData(
      records.filter(item => item[selected]).map(item => item[selected])
    )
    setXAxisData(records.filter(item => item.date).map(item => item.date))
  }, [records, selected])

  return (
    <Card title="体重记录图表" style={{ width: '100%', marginBottom: 24 }}>
      <Select
        value={selected}
        onChange={onChange}
        options={[
          { label: '体重', value: 'weight' },
          { label: '体脂率', value: 'bodyFatRate' },
          { label: '肌肉量', value: 'muscleRate' }
        ]}
      />
      <div>
        <BaseECharts
          option={{
            xAxis: {
              type: 'category',
              data: xAxisData
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                data: chartData,
                type: 'line'
              }
            ]
          }}
        />
      </div>
    </Card>
  )
}

export default HistoryEcharts
