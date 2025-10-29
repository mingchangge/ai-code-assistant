import { useEffect, useRef, memo } from 'react'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

interface BaseEChartsProps {
  // 图表数据
  data?: object | undefined
  // 图表配置选项
  option: EChartsOption
  // 图表宽度，默认为'100%'
  width?: number | string
  // 图表高度，默认为'400px'
  height?: number | string
  // 图表实例准备好后的回调函数
  onChartReady?: (chart: ECharts) => void
  // 图表事件处理函数
  onEvents?: Record<string, (...args: unknown[]) => void>
  // 是否显示加载状态
  loading?: boolean
  // 加载配置
  loadingOption?: object | undefined
  // 主题
  theme?: string
}

const BaseECharts = memo(
  ({
    data,
    option,
    width = '100%',
    height = '400px',
    onChartReady,
    onEvents,
    loading = false,
    loadingOption,
    theme
  }: BaseEChartsProps) => {
    const chartRef = useRef<HTMLDivElement>(null)
    const chartInstance = useRef<ECharts | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)

    // 初始化图表
    useEffect(() => {
      if (chartRef.current && !chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current, theme)

        // 注册事件处理函数
        if (onEvents) {
          Object.keys(onEvents).forEach(eventName => {
            chartInstance.current?.on(eventName, onEvents[eventName])
          })
        }

        // 调用图表准备好的回调
        if (onChartReady) {
          onChartReady(chartInstance.current)
        }
      }

      // 组件卸载时销毁图表
      return () => {
        if (chartInstance.current) {
          chartInstance.current.dispose()
          chartInstance.current = null
        }
      }
    }, [theme, onChartReady, onEvents])

    // 更新图表配置和数据
    useEffect(() => {
      if (chartInstance.current) {
        chartInstance.current.setOption(option, true)
      }
    }, [option, data])

    // 处理加载状态
    useEffect(() => {
      if (chartInstance.current) {
        if (loading) {
          chartInstance.current.showLoading('default', loadingOption)
        } else {
          chartInstance.current.hideLoading()
        }
      }
    }, [loading, loadingOption])

    // 处理窗口大小变化
    useEffect(() => {
      if (chartRef.current) {
        // 创建ResizeObserver实例
        resizeObserverRef.current = new ResizeObserver(entries => {
          if (chartInstance.current) {
            chartInstance.current.resize()
          }
          console.log('resize', entries)
        })

        // 开始观察目标元素，将ResizeObserver实例与chartRef指向的DOM节点建立了观察关系
        resizeObserverRef.current.observe(chartRef.current)

        // 组件卸载或图表引用变化时断开观察
        return () => {
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect()
            resizeObserverRef.current = null
          }
        }
      }
    }, [])

    return (
      <div
        ref={chartRef}
        style={{
          width,
          height
        }}
      />
    )
  }
)

BaseECharts.displayName = 'BaseECharts'

export default BaseECharts
