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
import StickyBox from 'react-sticky-box'
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
  const [downloadProgress, setDownloadProgress] = useState('') // 模型下载进度
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
    let timer: number

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
              // 1. 检查组件是否还在 (防止卸载后更新报错)
              if (!isMounted.current) return

              // 2. 翻译并更新 State，这样界面才会变
              const translated = translateProgress(status)
              setDownloadProgress(translated)
            })
            if (isMounted.current) {
              setModelReady(true)
              console.log('✅ AI 模型预热完毕')
              setDownloadProgress('') // 清空进度文案
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
    timer = window.setTimeout(() => {
      void initSequence()
    }, 300)
    return () => {
      isMounted.current = false // 标记组件已卸载
      window.clearTimeout(timer) // 清除定时器
      timer = 0
    }
  }, [historyData, userProfile])

  // 🛠️ 辅助函数：将英文日志翻译成友好的中文
  const translateProgress = (text: string) => {
    if (!text) return ''

    // 🟢 1. 优先处理：缓存加载 (修复 0% -> 100% 跳变的问题)
    // 原始日志: "Loading model from cache[5/30]: 0MB loaded. 0% completed..."
    const cacheMatch = /Loading model from cache\[(\d+)\/(\d+)\]/.exec(text)
    if (cacheMatch) {
      const current = parseInt(cacheMatch[1], 10)
      const total = parseInt(cacheMatch[2], 10)
      // 手动计算百分比
      const percent = Math.floor((current / total) * 100)
      return `💾 正在校验本地缓存... ${percent.toFixed(0)}%`
    }

    // 🟢 2. 处理：GPU Shader 编译 (通常是最后一步)
    if (text.includes('Loading GPU shader modules')) {
      return '⚡️ 正在编译 GPU 着色器...'
    }

    // 🟢 3. 处理：网络下载
    // 原始日志: "... 26MB fetched. 3% completed"
    const fetchMatch = /(\d+)% completed/.exec(text)
    if (fetchMatch) {
      const percent = fetchMatch[1]
      // 只有当文本包含 'fetched' (下载) 或者 percent > 0 时才显示下载
      // 避免缓存加载时的 "0% completed" 误入这里
      if (text.includes('fetched') || parseInt(percent) > 0) {
        return `📥 正在下载模型资源... ${percent}%`
      }
    }

    // 🟢 4. 其他状态映射
    if (text.includes('Start to fetch')) return '🚀 开始建立连接...'
    if (text.includes('Finish loading')) return '✅ 模型加载完成，即将开始...'

    return text // 兜底显示原文
  }

  // --- 2. 按钮点击处理 ---
  const handleStartAnalysis = async () => {
    if (isAnalyzing) return // 防止连点

    setDownloadProgress('🚀 正在启动 AI 引擎...') // 初始文案
    // 重置错误状态，给 LLMService 一个重试的机会
    setModelError(false)
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
        // 🟢 状态回调 (必须保留！) 它保证了：无论是由 `useEffect` 触发的“自动下载”，还是由用户点击触发的“手动重试下载”，界面上都能正确显示进度条。
        status => {
          // 拦截状态文本，进行翻译并设置到 state
          const translated = translateProgress(status)
          setDownloadProgress(translated)
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
        // 循环结束后，强制刷新一次，确保最后几个字显示出来
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
    background: modelError
      ? 'linear-gradient(90deg, #ff4d4f, #cf1322)' // 红色渐变：网络中断/重试
      : modelReady && !isAnalyzing
        ? 'linear-gradient(90deg, #1677ff, #3b5999)' // 蓝色渐变：就绪/可生成
        : undefined, // ⚪️ 灰色 加载中/预热中 (由 loading 属性控制样式)
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    height: '48px',
    fontSize: '16px',
    transition: 'all 0.3s'
  }
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          全维健康分析报告
        </Title>
        <Text type="secondary">
          基于 {userProfile.age}岁{' '}
          {userProfile.gender === 'female' ? '女性' : '男性'} 标准库生成
        </Text>
      </div>

      <Row gutter={[24, 24]} align="stretch">
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
          <StickyBox offsetTop={16} offsetBottom={20}>
            <div
              style={{
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
                  icon={
                    aiContent ? <ReloadOutlined /> : <ThunderboltOutlined />
                  }
                  loading={(!modelReady && !modelError) || isAnalyzing}
                  disabled={!modelReady && !modelError}
                  onClick={() => void handleStartAnalysis()}
                  style={buttonStyle}
                >
                  {getButtonText()}
                </Button>
                {!modelReady && !modelError && downloadProgress && (
                  <div style={{ marginTop: 12 }}>
                    {/* 方案 A: 纯文字提示 */}
                    <div
                      style={{
                        fontSize: 12,
                        color: '#1677ff',
                        textAlign: 'center',
                        transition: 'all 0.3s'
                      }}
                    >
                      {downloadProgress}
                    </div>
                  </div>
                )}
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
          </StickyBox>
        </Col>
      </Row>
    </div>
  )
}
