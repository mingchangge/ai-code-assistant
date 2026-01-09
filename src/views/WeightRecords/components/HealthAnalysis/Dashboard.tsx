import { useEffect, useState, useRef } from 'react'
import {
  Button,
  Row,
  Col,
  Skeleton,
  Empty,
  Alert,
  Typography,
  Card
} from 'antd'
import { ThunderboltOutlined, ReloadOutlined } from '@ant-design/icons'
import { AdvisorService, type AnalysisResult } from '@/services/advisor'
import { AnalysisCard } from './AnalysisCard'
import { AiReportView } from './AiReportView'
import type { DashboardProps } from '../types'

const { Title, Text } = Typography

export const HealthDashboard = ({
  historyData,
  userProfile
}: DashboardProps) => {
  // --- State Definitions ---
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [basicLoading, setBasicLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI 相关状态
  const [aiContent, setAiContent] = useState<string>('')
  const [aiStatus, setAiStatus] = useState<string>('')
  const [modelReady, setModelReady] = useState(false) // 模型是否预热完成
  const [modelError, setModelError] = useState(false) // 模型加载是否失败
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 是否正在生成中

  // Refs (用于性能优化和安全)
  const contentBuffer = useRef('')
  const lastUpdateRef = useRef(0)
  const isMounted = useRef(true) // 🔒 安全锁：防止卸载后更新状态

  // --- 1. 初始化 & 预热 ---
  useEffect(() => {
    isMounted.current = true

    const initSequence = async () => {
      if (!historyData || historyData.length === 0) {
        setReports([])
        return
      }

      setBasicLoading(true)
      setError(null)
      // 重置 AI 状态
      setAiContent('')
      setAiStatus('')
      setModelError(false)

      try {
        // A. 基础数据 (同步显示)
        const basicResults = await AdvisorService.analyzeBasic(
          historyData,
          userProfile
        )

        if (isMounted.current) {
          setReports(basicResults)
          setBasicLoading(false)
        }

        // B. 模型预热 (后台静默运行)
        if (basicResults.length > 0) {
          try {
            await AdvisorService.preload(status => {
              // 仅在控制台记录，不触发 React 渲染以免卡顿
              console.log('Background Warmup:', status)
            })
            if (isMounted.current) {
              setModelReady(true)
              console.log('✅ AI 模型预热完毕')
            }
          } catch (e) {
            console.error('预热失败', e)
            if (isMounted.current) setModelError(true)
          }
        }
      } catch (err) {
        console.error(err)
        if (isMounted.current) setError('基础数据分析服务不可用。')
      } finally {
        if (isMounted.current) setBasicLoading(false)
      }
    }

    void initSequence()

    return () => {
      isMounted.current = false // 标记组件已卸载
    }
  }, [historyData, userProfile])

  // --- 2. 按钮点击处理 ---
  const handleStartAnalysis = async () => {
    if (isAnalyzing) return // 防止连点

    setIsAnalyzing(true)
    setAiContent('')
    contentBuffer.current = '' // 清空缓存

    // 设置初始状态提示
    if (!modelReady) {
      setAiStatus('正在完成模型最后加载...')
    } else {
      setAiStatus('正在深度阅读您的体征数据...')
    }

    try {
      await AdvisorService.analyzeAI(
        reports,
        userProfile,
        text => {
          if (!isMounted.current) return

          // 🔥 优化：写入 Buffer
          contentBuffer.current = text
          const now = Date.now()

          // 🔥 优化：节流渲染 (100ms 一次)
          if (now - lastUpdateRef.current > 100) {
            setAiContent(contentBuffer.current)
            lastUpdateRef.current = now
          }
        },
        status => {
          if (isMounted.current) setAiStatus(status)
        }
      )
    } catch (e) {
      console.error(e)
      if (isMounted.current) {
        setAiContent('**分析服务遇到问题，请稍后重试。**')
      }
    } finally {
      if (isMounted.current) {
        // 🔥 关键修复：循环结束后，强制刷新一次，确保最后几个字显示出来
        setAiContent(contentBuffer.current)
        setIsAnalyzing(false)
      }
    }
  }

  // --- Render Helpers ---
  if (error)
    return (
      <Alert message="分析失败" description={error} type="error" showIcon />
    )

  if (!basicLoading && reports.length === 0 && !error) {
    return <Empty description="暂无数据" />
  }

  // 按钮文案逻辑
  const getButtonText = () => {
    if (modelError) return '模型加载失败 (点击重试)'
    if (!modelReady) return 'AI 引擎加载中...'
    if (isAnalyzing) return 'AI 正在思考...'
    if (aiContent) return '重新生成分析' // 如果已有内容，显示重新生成
    return '开始 AI 深度分析'
  }
  const buttonStyle = {
    background:
      modelReady && !isAnalyzing
        ? 'linear-gradient(90deg, #1677ff, #3b5999)' // 蓝色渐变
        : undefined, // 未就绪或加载中使用默认样式
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    height: '48px',
    fontSize: '16px'
  }
  return (
    // 使用 style 代替 className="pb-8" (32px)
    <div style={{ paddingBottom: 32 }}>
      {/* 头部区域：使用 style 代替 mb-6 (24px) */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          全维健康分析报告
        </Title>
        <Text type="secondary">
          基于 {userProfile.age}岁{' '}
          {userProfile.gender === 'female' ? '女性' : '男性'} 标准库生成
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* LEFT: 基础数据 */}
        <Col xs={24} lg={16} xl={17}>
          {basicLoading ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : (
            <Row gutter={[16, 16]}>
              {reports.map(report => (
                <Col xs={24} sm={12} key={report.metric}>
                  <AnalysisCard data={report} />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* RIGHT: AI 控制区与报告 */}
        <Col xs={24} lg={8} xl={7}>
          {/* 使用 style 实现 sticky 定位 */}
          <div
            style={{
              position: 'sticky',
              top: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {/* 1. 控制按钮卡片 */}
            <Card style={{ boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <Button
                type="primary"
                block
                icon={aiContent ? <ReloadOutlined /> : <ThunderboltOutlined />}
                loading={!modelReady || isAnalyzing}
                disabled={!modelReady && !modelError}
                onClick={() => void handleStartAnalysis()}
                style={buttonStyle}
              >
                {getButtonText()}
              </Button>
              {/* 仅在模型未就绪（还在下载）时显示提示 */}
              {!modelReady && !modelError && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontSize: 12,
                    color: '#9ca3af'
                  }}
                >
                  🚧 首次运行需加载 AI 资源 (约900MB)，请保持网络通畅...
                </div>
              )}
              {/* 辅助提示文案 */}
              {!isAnalyzing && !aiContent && modelReady && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontSize: 12,
                    color: '#9ca3af' // 灰色
                  }}
                >
                  ⚡️ 模型已就绪，点击即可秒级生成
                </div>
              )}
            </Card>

            {/* 2. 报告展示组件 */}
            {(aiContent || isAnalyzing) && (
              <AiReportView
                content={aiContent}
                loading={isAnalyzing}
                loadingTip={aiStatus}
              />
            )}
          </div>
        </Col>
      </Row>
    </div>
  )
}
