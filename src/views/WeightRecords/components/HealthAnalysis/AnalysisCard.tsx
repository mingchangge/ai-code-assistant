import { useState, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import BaseECharts from '@/components/BaseECharts'
import {
  Card,
  Tag,
  Statistic,
  Button,
  Alert,
  Space,
  Tooltip,
  Typography
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

// --- 1. Styled Components 定义 ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`

const StyledCard = styled(Card)`
  /* 🟢 修改 1: 使用 flex 布局，确保卡片结构稳固 */
  display: flex;
  flex-direction: column;

  /* 🟢 修改 2: 使用 min-height 替代 height。
     这样在内容较少时能撑满 Grid 高度，内容较多时会自动长高，不会截断图表 */
  min-height: 100%;

  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* 🟢 修改 3: 让 Body 区域占据剩余空间并使用 flex 纵向排列 */
  .ant-card-body {
    padding: 16px 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* 让内容分布更均匀 */
  }
`

const CardTitle = styled.span`
  font-weight: 700;
  font-size: 14px;
`

const InterpretationText = styled.div`
  margin-top: 8px;
  color: #8c8c8c;
  font-size: 13px;
  /* 保持固定高度，防止文字过多挤压图表 */
  height: 40px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`

const ChartContainer = styled.div`
  /* 🟢 修改 4: 增加 flex-shrink: 0，这非常关键！
     它告诉浏览器：“无论空间多挤，都不要压缩这个 div 的高度” */
  flex-shrink: 0;

  /* 适当调整高度，128px 可能略小，建议 140-160px */
  min-height: 140px;
  width: 100%;

  /* 调整边距，确保视觉平衡 */
  margin: 16px -8px;
`

const AnimatedAlert = styled(Alert)`
  margin-top: 8px;
  animation: ${fadeIn} 0.3s ease-out;

  .ant-alert-message {
    font-weight: 600;
  }
`

const SuffixText = styled.span`
  font-size: 14px;
  color: #8c8c8c;
  margin-left: 4px;
`

// --- 2. 类型定义 ---

interface AnalysisCardProps {
  data: AnalysisResult
}

interface StatusConfig {
  color: string
  text: string
}

// 简单的 Series 对象类型定义，避免使用 any
// 根据实际 ECharts 使用到的属性进行定义
interface ChartSeriesItem {
  type?: string
  data?: number[]
  smooth?: boolean
  showSymbol?: boolean
  areaStyle?: Record<string, unknown>
  itemStyle?: Record<string, unknown>
  lineStyle?: Record<string, unknown>
  [key: string]: unknown // 允许其他 ECharts 属性
}

// --- 3. 组件逻辑 ---

export const AnalysisCard = ({ data }: AnalysisCardProps) => {
  const [showAdvice, setShowAdvice] = useState(false)

  // 修复：status 映射逻辑
  const getStatusConfig = (status: string): StatusConfig => {
    // 显式定义 Map 类型为 Record<string, ...> 以支持任意字符串索引
    const map: Record<string, StatusConfig> = {
      normal: { color: 'success', text: '标准' },
      low: { color: 'warning', text: '偏低' },
      high: { color: 'warning', text: '偏高' },
      risk: { color: 'error', text: '风险' },
      unknown: { color: 'default', text: '未知' }
    }

    // 如果 status 不在 map 中，map[status] 为 undefined，回退到 map.unknown
    return map[status] ?? map.unknown
  }

  const getTrendIcon = (trend: string, metricKey: string) => {
    const config = METRIC_CONFIG[metricKey as keyof typeof METRIC_CONFIG] as
      | MetricConfigItem
      | undefined

    const isHigherBetter = config?.type === 'min'

    const colorGood = '#3f8600'
    const colorBad = '#cf1322'
    const colorNeutral = '#8c8c8c'

    switch (trend) {
      case 'stable':
        return <MinusOutlined style={{ color: colorNeutral }} />
      case 'up':
        return (
          <ArrowUpOutlined
            style={{ color: isHigherBetter ? colorGood : colorBad }}
          />
        )
      case 'down':
        return (
          <ArrowDownOutlined
            style={{ color: isHigherBetter ? colorBad : colorGood }}
          />
        )
      default:
        return null
    }
  }

  const finalChartOption = useMemo(() => {
    if (!data.chartOption.xAxis || !Array.isArray(data.chartOption.series)) {
      return {}
    }

    const seriesList = data.chartOption.series as ChartSeriesItem[]
    const baseSeries: ChartSeriesItem = seriesList[0] || {}

    return {
      ...data.chartOption,
      grid: {
        top: 10,
        right: 0,
        bottom: 0,
        left: 0,
        containLabel: false
      },
      xAxis: {
        // 确保 xAxis 存在再展开，虽然上面做了判断，TS 可能还需要断言或 ?.
        ...(data.chartOption.xAxis as Record<string, unknown>),
        show: false
      },
      yAxis: {
        type: 'value',
        scale: true,
        show: false,
        splitLine: { show: false }
      },
      series: [
        {
          ...baseSeries,
          showSymbol: false,
          smooth: true,
          areaStyle: {
            opacity: 0.1,
            color: '#1890ff'
          },
          itemStyle: { color: '#1890ff' },
          lineStyle: { width: 2 }
        }
      ]
    }
  }, [data.chartOption])

  const statusConfig = getStatusConfig(data.status)

  return (
    <StyledCard
      title={
        <Space>
          <CardTitle>{data.label}</CardTitle>
          <Tooltip title="基于最近一次测量及历史趋势分析">
            <InfoCircleOutlined
              style={{ color: '#bfbfbf', fontSize: '12px' }}
            />
          </Tooltip>
        </Space>
      }
      extra={<Tag color={statusConfig.color}>{statusConfig.text}</Tag>}
    >
      {/* 1. 核心数值区 */}
      <div>
        <Statistic
          value={data.currentValue}
          precision={1}
          prefix={getTrendIcon(data.trend, data.metric)}
          suffix={
            <SuffixText>
              (
              {data.diff > 0
                ? `+${data.diff.toFixed(1)}`
                : data.diff.toFixed(1)}
              )
            </SuffixText>
          }
          valueStyle={{ fontSize: '1.5rem', fontWeight: 600 }}
        />
        <InterpretationText>{data.interpretation}</InterpretationText>
      </div>

      {/* 2. 可视化图表区 */}
      <ChartContainer>
        <BaseECharts option={finalChartOption} />
      </ChartContainer>

      {/* 3. 建议交互区 */}
      <div>
        <Button
          type="link"
          icon={<BulbOutlined />}
          size="small"
          onClick={() => {
            setShowAdvice(!showAdvice)
          }}
          style={{ paddingLeft: 0, paddingBottom: 0, height: 'auto' }}
        >
          {showAdvice ? '收起建议' : '查看专家建议'}
        </Button>

        {showAdvice && (
          <AnimatedAlert
            message="智能改善建议"
            description={
              <Paragraph
                style={{
                  marginBottom: 0,
                  fontSize: '12px',
                  whiteSpace: 'pre-line',
                  color: '#595959'
                }}
              >
                {data.advice}
              </Paragraph>
            }
            type="info"
            showIcon
          />
        )}
      </div>
    </StyledCard>
  )
}
