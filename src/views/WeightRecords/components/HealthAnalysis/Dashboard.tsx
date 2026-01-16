import { useEffect, useState, useRef } from 'react'
import {
  Button,
  Row,
  Col,
  Skeleton,
  Empty,
  Alert,
  Typography,
  Card,
  Space
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
  const [loadStatus, setLoadStatus] = useState({
    llm: '', // 大模型进度
    rag: '' // 向量模型进度
  }) // 模型下载进度
  const [aiContent, setAiContent] = useState<string>('')
  const [aiStatus, setAiStatus] = useState<string>('')
  const [modelReady, setModelReady] = useState(false) // 模型是否预热完成
  const [modelError, setModelError] = useState(false) // 模型加载是否失败
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 是否正在生成中

  // Refs (用于性能优化和安全)
  const contentBuffer = useRef('')
  const lastUpdateRef = useRef(0)
  const isMounted = useRef(true) // 🔒 安全锁：防止卸载后更新状态

  // 🟢 核心: 流水线控制 (Charts + RAG -> LLM)
  useEffect(() => {
    isMounted.current = true
    let isPipelineActive = true

    const runPipeline = async () => {
      if (!historyData || historyData.length === 0) {
        setReports([])
        return
      }

      // 1. 初始化状态
      setBasicLoading(true)
      setError(null)
      setModelError(false)
      setAiContent('')

      const handleStatusUpdate = (status: string) => {
        if (!isMounted.current) return
        const translated = translateProgress(status)
        if (status.startsWith('[LLM]')) {
          setLoadStatus(prev => ({ ...prev, llm: translated }))
        } else if (status.startsWith('[RAG]')) {
          setLoadStatus(prev => ({ ...prev, rag: translated }))
        }
      }

      try {
        console.log('🚀 [Pipeline] 阶段一：并行加载图表与知识库')

        // --- 阶段一：并行任务 ---

        // 任务 A: 仅创建 Promise，不在此处处理 .then，交给后面统一处理
        const chartsPromise = AdvisorService.analyzeBasic(
          historyData,
          userProfile
        )

        // 任务 B: RAG 初始化
        const ragPromise = AdvisorService.initKnowledgeBase(handleStatusUpdate)

        // 等待阶段一全部完成 (无论成功失败，这里都不会抛错)
        const [chartsResult, ragResult] = await Promise.allSettled([
          chartsPromise,
          ragPromise
        ])

        // 🛡️ 检查组件是否还挂载
        if (!isMounted.current || !isPipelineActive) return

        // 🟢 逻辑分支 1：处理图表结果
        if (chartsResult.status === 'fulfilled') {
          // 成功：渲染图表
          setReports(chartsResult.value)
          setBasicLoading(false)
        } else {
          // 失败：显示基础服务错误，并终止后续流程
          console.error('Charts Analysis Failed:', chartsResult.reason)
          setError('基础数据分析服务不可用')
          setBasicLoading(false)
          return // 🚨 图表挂了，就不继续加载 LLM 了
        }

        // 🟢 逻辑分支 2：处理 RAG 结果 (可选：如果 RAG 挂了，是否继续？)
        if (ragResult.status === 'rejected') {
          console.error('RAG Init Failed:', ragResult.reason)
          // RAG 挂了通常意味着 AI 无法正常工作，标记模型错误
          setModelError(true)
          return // 🚨 终止流程
        }

        console.log('🚀 [Pipeline] 阶段二：加载 AI 思考引擎 (LLM)')

        // --- 阶段二：串行任务 ---
        // 只有上面两个都成功了，才会走到这里
        await AdvisorService.initReasoningEngine(handleStatusUpdate)
      } catch (err) {
        // 这里的 catch 现在只负责捕获 "阶段二 (LLM)" 的错误
        // 因为阶段一的错误已经被 allSettled 处理掉了
        console.error('Pipeline Stage 2 Error:', err)
        if (isMounted.current && isPipelineActive) {
          setModelError(true)
        }
      }
    }

    void runPipeline()

    return () => {
      isMounted.current = false
      isPipelineActive = false
    }
  }, [historyData, userProfile])

  // 🟢 辅助 Effect: 只要状态文案变绿，强制解锁按钮
  useEffect(() => {
    const ragReady =
      loadStatus.rag.includes('准备就绪') || loadStatus.rag.includes('ready')
    const llmReady = loadStatus.llm.includes('加载完毕')

    if (ragReady && llmReady && !modelReady) {
      setModelReady(true)
    }
  }, [loadStatus, modelReady])

  // 🛠️ 辅助函数：将英文日志翻译成友好的中文
  const translateProgress = (text: string) => {
    if (!text) return ''
    // =================================================
    // 🤖 分支 A: 处理 LLM (千问大模型)
    // =================================================
    if (text.startsWith('[LLM]')) {
      const content = text.replace('[LLM] ', '')

      // 1. 缓存加载
      const cacheMatch = /Loading model from cache\[(\d+)\/(\d+)\]/.exec(
        content
      )
      if (cacheMatch) {
        const current = parseInt(cacheMatch[1], 10)
        const total = parseInt(cacheMatch[2], 10)
        const percent = Math.floor((current / total) * 100)
        return `🤖 [AI引擎] 校验缓存... ${percent.toFixed(0)}%`
      }

      // 2. 网络下载
      const fetchMatch = /(\d+)% completed/.exec(content)
      if (fetchMatch && content.includes('fetched')) {
        return `🤖 [AI引擎] 正在下载... ${fetchMatch[1]}%`
      }

      if (content.includes('Loading GPU shader'))
        return '⚡️ [AI引擎] 编译着色器...'
      if (content.includes('Finish loading')) return '✅ [AI引擎] 加载完毕'

      return `🤖 ${content}`
    }

    // =================================================
    // 📚 分支 B: 处理 RAG (向量化模型)
    // =================================================
    if (text.startsWith('[RAG]')) {
      const parts = text.replace('[RAG] ', '').split('|')
      const status = parts[0]
      const progress = parts[1] || '0'
      const numProgress = parseFloat(progress)

      if (status === 'ready') {
        return '✅ [知识库] 准备就绪'
      }

      // 🟢 状态 2: 中间态 (下载完了，正在编译/加载 WASM)
      // 此时进度已达 100，但状态还是 loading
      if (numProgress >= 100) {
        return '⚙️ 模型下载完毕，正在加载模型资源...'
      }
      switch (status) {
        case 'checking-network':
          return '🔍 [知识库] 连接网络...'
        case 'switching-local':
          return '🏠 [知识库] 切换本地模式...'
        case 'loading':
          return `📥 [知识库] 加载资源... ${progress}%`
        case 'ready':
          return '✅ [知识库] 准备就绪'
        default:
          return `📚 [知识库] ${status}...`
      }
    }

    // 兜底显示原文
    return text
  }

  // --- 2. 按钮点击处理 ---
  const handleStartAnalysis = async () => {
    if (isAnalyzing) return // 防止连点

    // 初始文案
    setLoadStatus(prev => ({ ...prev, llm: '🚀 正在启动 AI 引擎...' }))
    // 重置错误状态，给 LLMService 一个重试的机会
    setModelError(false)
    setIsAnalyzing(true)
    setAiContent('')
    contentBuffer.current = '' // 清空缓存

    // 设置初始状态提示
    if (!modelReady) {
      setAiStatus('正在完成模型最后加载...')
    } else {
      setAiStatus('💭 AI 正在深度思考中...')
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
          if (status.startsWith('[LLM]')) {
            setLoadStatus(prev => ({ ...prev, llm: translated }))
          } else if (status.startsWith('[RAG]')) {
            setLoadStatus(prev => ({ ...prev, rag: translated }))
          }
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

  // 🟢 辅助变量：是否显示进度区域
  const showProgress =
    !modelReady && !modelError && (loadStatus.llm || loadStatus.rag)

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
                {showProgress && (
                  <div style={{ marginTop: 12 }}>
                    <Space
                      direction="vertical"
                      style={{ width: '100%' }}
                      size={4}
                    >
                      {loadStatus.rag && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#13c2c2',
                            textAlign: 'center'
                          }}
                        >
                          {loadStatus.rag}
                        </div>
                      )}
                      {loadStatus.llm && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#1677ff',
                            textAlign: 'center'
                          }}
                        >
                          {loadStatus.llm}
                        </div>
                      )}
                    </Space>
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
