import { useState } from 'react'
import BaseECharts from '@/components/BaseECharts'
import {
  Card,
  Tag,
  Statistic,
  Button,
  Alert,
  Space,
  Typography,
  Tooltip
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  InfoCircleOutlined,
  BulbOutlined
} from '@ant-design/icons'
import { METRIC_CONFIG } from '@/services/advisor/config/metrics'
import type { AnalysisResult, MetricConfigItem } from '@/services/advisor'

const { Paragraph } = Typography

interface AnalysisCardProps {
  data: AnalysisResult
}

export const AnalysisCard = ({ data }: AnalysisCardProps) => {
  const [showAdvice, setShowAdvice] = useState(false)

  // 1. 状态映射：将业务状态映射为 Antd 的 Tag 颜色
  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      normal: { color: 'success', text: '标准' },
      low: { color: 'warning', text: '偏低' },
      high: { color: 'warning', text: '偏高' },
      risk: { color: 'error', text: '风险' },
      unknown: { color: 'default', text: '未知' }
    }
    const { color, text } = map[status] || map.unknown
    return <Tag color={color}>{text}</Tag>
  }

  // 2. 趋势映射：映射为图标和颜色
  const getTrendIcon = (trend: string, metricKey: string) => {
    const config = METRIC_CONFIG[metricKey] as MetricConfigItem
    // 判断该指标是“越大越好”还是“越小越好”
    // type 为 'min' (如下限34%) 通常意味着越大越好
    const isHigherBetter = config?.type === 'min'

    // 定义颜色
    const colorGood = '#3f8600' // 绿
    const colorBad = '#cf1322' // 红
    const colorNeutral = '#8c8c8c'

    if (trend === 'stable')
      return <MinusOutlined style={{ color: colorNeutral }} />

    if (trend === 'up') {
      return (
        <ArrowUpOutlined
          style={{ color: isHigherBetter ? colorGood : colorBad }}
        />
      )
    }

    if (trend === 'down') {
      return (
        <ArrowDownOutlined
          style={{ color: isHigherBetter ? colorBad : colorGood }}
        />
      )
    }

    return null
  }

  return (
    <Card
      className="h-full shadow-sm"
      style={{ padding: '16px 20px' }}
      // 卡片右上角显示状态标签
      extra={getStatusTag(data.status)}
      title={
        <Space>
          <span className="font-bold">{data.label}</span>
          <Tooltip title="基于最近一次测量及历史趋势分析">
            <InfoCircleOutlined className="text-gray-400 text-xs font-normal" />
          </Tooltip>
        </Space>
      }
    >
      {/* 上半部分：数值展示 */}
      <div className="mb-4">
        <Statistic
          value={data.currentValue}
          precision={1}
          prefix={getTrendIcon(data.trend, data.metric)}
          suffix={
            <span className="text-sm text-gray-500 ml-1">
              ({data.diff > 0 ? `+${data.diff.toString()}` : data.diff})
            </span>
          }
          valueStyle={{ fontSize: '1.5rem', fontWeight: 600 }}
        />
        <div className="mt-2 text-gray-500 text-sm h-10 overflow-hidden text-ellipsis leading-5">
          {data.interpretation}
        </div>
      </div>

      {/* 中间：ECharts 图表 */}
      <div className="h-32 -mx-2 mb-3">
        <BaseECharts
          option={{
            ...data.chartOption,
            grid: {
              top: 10, // 留出一点头部给最高点
              right: 0, // 不需要右边距
              bottom: 0, // 不需要底边距 (隐藏X轴时)
              left: 0, // 不需要左边距 (隐藏Y轴刻度时)
              containLabel: false // 让图表充满容器
            },
            xAxis: {
              ...data.chartOption.xAxis,
              show: false // 彻底隐藏 X 轴
            },
            yAxis: {
              type: 'value',
              scale: true, // 关键：让波动看起来更明显，不要从0开始
              show: false, // 彻底隐藏 Y 轴，只看趋势线
              splitLine: { show: false } // 去掉网格线，更清爽
            },
            // 添加渐变区域填充，增加高级感
            series: [
              {
                ...data.chartOption.series[0],
                showSymbol: false, // 只有 hover 时显示点
                areaStyle: {
                  opacity: 0.1,
                  color: '#1890ff' // 或动态取色
                },
                itemStyle: { color: '#1890ff' },
                lineStyle: { width: 2 }
              }
            ]
          }}
        />
      </div>

      {/* 底部：建议折叠区 */}
      <div>
        <Button
          type="link"
          icon={<BulbOutlined />}
          size="small"
          onClick={() => {
            setShowAdvice(!showAdvice)
          }}
          style={{ paddingLeft: 0 }}
        >
          {showAdvice ? '收起建议' : '查看专家建议'}
        </Button>

        {showAdvice && (
          <Alert
            message="智能改善建议"
            description={
              <Paragraph
                className="mb-0 text-xs"
                style={{ whiteSpace: 'pre-line' }}
              >
                {data.advice}
              </Paragraph>
            }
            type="info"
            showIcon
            className="mt-2 animate-fadeIn" // 假设你有fadeIn动画，没有可去掉
          />
        )}
      </div>
    </Card>
  )
}
