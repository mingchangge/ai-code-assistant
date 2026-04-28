import { useState, useEffect } from 'react'
import { Segmented, Card } from 'antd'
import type { BodyMetricsRecord } from './types'
import BaseECharts from '@/components/BaseECharts'

// 检查是否是轴参数
const isAxisParams = (p: unknown): p is Record<string, unknown>[] =>
  Array.isArray(p)

const options: { label: string; value: string }[] = [
  { label: '体重', value: 'weight' },
  { label: '体脂率', value: 'bodyFatRate' },
  { label: '水分率', value: 'waterRate' },
  { label: '肌肉量', value: 'muscleRate' },
  { label: '骨骼肌率', value: 'skeletalMuscleRate' },
  { label: '骨骼率', value: 'boneRatio' },
  { label: '蛋白质率', value: 'proteinRate' },
  { label: '基础代谢', value: 'basalMetabolism' },
  { label: '活动代谢', value: 'activeMetabolism' }
]
function HistoryEcharts({ records }: { records: BodyMetricsRecord[] }) {
  const [selected, setSelected] = useState('weight')
  const [chartData, setChartData] = useState<(string | number | undefined)[]>(
    []
  )
  const [xAxisData, setXAxisData] = useState<string[]>([])
  const [yAxisMin, setYAxisMin] = useState({
    min: 45.0,
    max: 65.0,
    interval: 5.0,
    unit: 'kg'
  })

  const onChange = (value: string) => {
    setSelected(value)
  }

  useEffect(() => {
    const sortedRecords = [...records]
      .filter(
        item =>
          item.date && item[selected as keyof BodyMetricsRecord] !== undefined
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (sortedRecords.length === 0) return

    const data = sortedRecords
      .filter(item => item[selected as keyof BodyMetricsRecord])
      .map(item => item[selected as keyof BodyMetricsRecord])
    const dates = sortedRecords.filter(item => item.date).map(item => item.date)

    // 设置图表数据和x轴数据
    setChartData(data)
    setXAxisData(dates)
    const numericData = data.filter(val => typeof val === 'number')
    const minValue = Math.min(...numericData)
    const maxValue = Math.max(...numericData)
    setYAxisMin({
      min: selected === 'weight' ? 50.0 : Math.ceil(minValue) - 2.0,
      max:
        selected === 'weight' ? Math.ceil(maxValue) : Math.ceil(maxValue) + 2.0,
      interval: 2.0,
      unit:
        selected === 'weight'
          ? 'kg'
          : selected.includes('Metabolism')
            ? 'kcal'
            : '%'
    })
  }, [records, selected])

  return (
    <Card title="体重记录图表" style={{ width: '100%', marginBottom: 24 }}>
      <Segmented value={selected} options={options} onChange={onChange} />
      <div>
        <BaseECharts
          key={selected}
          height={600}
          option={{
            grid: {
              left: '8%',
              right: '8%',
              bottom: '0%',
              top: '60px', // 从15%加大到18%，让y轴有足够长度延伸到箭头
              containLabel: true
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'shadow' },
              formatter: (params: unknown) => {
                if (!isAxisParams(params)) return ''
                const first = params[0]
                const name = String(first.name) // 保证是 string
                const value = Number(first.value)
                if (selected === 'weight') {
                  const unit = yAxisMin.unit // 体重单位（如kg）
                  const standard = yAxisMin.min // 标准体重（目标值）
                  const distance = value - standard // 距离标准值的差值
                  const needEffort = (distance * 2).toFixed(2) // 还需努力的斤数（1kg=2斤）
                  // 动态颜色：距离标准值为负（低于标准）用绿色，为正（高于标准）用红色
                  const distanceColor = distance < 0 ? '#52c41a' : '#ff4d4f'
                  const effortText =
                    distance > 0
                      ? `
                        <div class="effort-item" style="font-size:16px; margin-bottom:6px;">
                          <span class="icon">💦</span> 
                          <span class="label">还需努力：</span>
                          <span class="value" style="color:#fa8c16;">${needEffort} 斤</span>
                        </div>
                      `
                      : `
                        <div class="effort-item" style="color:#52c41a;">
                          <span class="icon">✅</span> 
                          <span>已达到标准体重！</span>
                        </div>
                      `

                  return `
                    <div class="tooltip-container">
                      <!-- 1. 日期标题：加粗放大，底部边框分隔 -->
                      <div class="date-title" style="font-size:16px; font-weight:700; color:#1f2937; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #f3f4f6;">
                        ${name}
                      </div>
                      <!-- 2. 核心体重数据：最大号字体+橙色，突出显示 -->
                      <div class="weight-item" style="font-size:18px; font-weight:700; margin:8px 0;">
                        <span class="label" style="color:#6b7280;">当前体重：</span>
                        <span class="value" style="color:#fa8c16;">${value.toFixed(2)} ${unit}</span>
                      </div>
                      <!-- 3. 距离标准值：动态颜色+图标 -->
                      <div class="distance-item" style="font-size:16px; margin:8px 0;">
                        <span class="icon">📊</span> 
                        <span class="label" style="color:#6b7280;">距离标准值：</span>
                        <span class="value" style="color:${distanceColor};font-weight:700;">${distance.toFixed(2)} ${unit}</span>
                      </div>
                      <!-- 4. 还需努力/已达标：根据情况显示 -->
                      ${effortText}
                    </div>
                  `
                } else {
                  const selectedOption = options.find(
                    opt => opt.value === selected
                  )
                  return `
                    <div class="tooltip-container">
                      <!-- 1. 日期标题：加粗放大，底部边框分隔 -->
                      <div class="date-title" style="font-size:16px; font-weight:700; color:#1f2937; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #f3f4f6;">
                        ${name}
                      </div>
                      <!-- 2. 核心体重数据：最大号字体+橙色，突出显示 -->
                      <div class="weight-item" style="font-size:18px; font-weight:700; margin-bottom:8px;">
                        <span class="label" style="color:#6b7280;">${selectedOption?.label ?? selected}：</span>
                        <span class="value" style="color:#fa8c16;">${value.toFixed(2)} %</span>
                      </div>
                    </div>
                  `
                }
              }
            },
            xAxis: {
              type: 'category',
              data: xAxisData,
              splitArea: {
                interval: 1,
                show: true
              },
              axisLine: {
                show: true,
                symbol: ['none', 'none']
              },
              axisTick: {
                show: true,
                inside: true
              },
              axisPointer: {
                show: true,
                type: 'line'
              }
            },
            yAxis: {
              name: `单位：${yAxisMin.unit}`,
              type: 'value',
              min: yAxisMin.min,
              max: yAxisMin.max,
              interval: yAxisMin.interval,
              axisLabel: {
                formatter: `{value}` // 显示单位
              },
              axisLine: {
                show: true,
                symbol: ['none', 'none']
              },
              axisTick: {
                show: true,
                inside: true
              },
              minorTick: {
                show: true,
                splitNumber: 2
              },
              minorSplitLine: {
                show: true,
                lineStyle: {
                  color: 'rgba(235, 141, 10, 1)',
                  type: 'dashed'
                }
              },
              axisPointer: {
                show: true,
                type: 'line'
              },
              splitArea: {
                interval: 1,
                show: true
              },
              splitLine: {
                lineStyle: {
                  color: 'rgba(169, 167, 167, 1)',
                  type: 'dashed'
                }
              }
            },
            series: [
              {
                name: '实际体重',
                data: chartData,
                type: 'line',
                areaStyle: {
                  color: 'rgba(4, 65, 247, 1)',
                  opacity: 0.1
                }
              }
            ]
          }}
        />
      </div>
    </Card>
  )
}

export default HistoryEcharts
