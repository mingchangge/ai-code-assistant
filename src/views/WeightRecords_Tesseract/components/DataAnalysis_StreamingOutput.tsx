import { useState, useRef, useCallback } from 'react'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'
import {
  Card,
  Splitter,
  Typography,
  List,
  Descriptions,
  message,
  Button,
  Progress,
  Spin
} from 'antd'
import type { BodyMetricsRecord } from '@/views/WeightRecords/components/types'
const { Title, Text } = Typography

type Status =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string; progress: number }
  | { type: 'analyzing'; message: string }
  | { type: 'done'; message: string }
  | { type: 'error'; message: string }

interface InitProgressReport {
  progress: number
  timeElapsed: number
  text: string
}

// 常量
// 根据硬件并发数选择推荐模型
// const getRecommendedModel = () => {
//   if (navigator.hardwareConcurrency >= 8) return 'Mistral-7B-v0.3-q4f16_1-MLC';
//   else return 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
// };
const selectedModel = 'Phi-3-mini-4k-instruct-q4f16_1-MLC'

export default function DataAnalysis({
  records
}: {
  records: BodyMetricsRecord[]
}) {
  const [status, setStatus] = useState<Status>({
    type: 'idle',
    message: '准备就绪，点击按钮开始分析。'
  })
  // 状态定义
  const [analysisState, setAnalysisState] = useState({
    trend: '',
    assessment: '',
    advice: '',
    currentSection: '' as 'trend' | 'assessment' | 'advice' | null
  })
  const engineRef = useRef<MLCEngine | null>(null)

  // AI分析--初始化进度回调
  const initProgressCallback = (initProgress: InitProgressReport) => {
    let progress = initProgress.progress * 100
    let message = '缓存中...'
    // 检查是否正在从缓存加载模型
    if (initProgress.text.includes('Loading model from cache')) {
      // 从text中提取进度信息，如 "Loading model from cache[78/83]"
      const regex = /\[(\d+)\/(\d+)\]/
      const match = regex.exec(initProgress.text)
      if (match && match.length >= 3) {
        const current = parseInt(match[1], 10)
        const total = parseInt(match[2], 10)
        if (!isNaN(current) && !isNaN(total) && total > 0) {
          progress = (current / total) * 100
        }
      }
      message = '从缓存加载模型...'
    } else if (progress === 0) {
      // 初次加载但进度为0的情况
      message = '准备模型...'
    }
    setStatus({
      type: 'loading',
      message: message,
      progress: progress
    })
    console.log(initProgress)
  }

  // 初始化AI
  const initializeModel = useCallback(async () => {
    setStatus({ type: 'loading', message: '准备模型...', progress: 0 })
    try {
      const engine = await CreateMLCEngine(
        selectedModel,
        { initProgressCallback: initProgressCallback } // engineConfig
      )
      engineRef.current = engine
      // 模型初始化成功后更新状态
      setStatus({
        type: 'idle',
        message: '模型已就绪，点击按钮开始分析。'
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setStatus({
        type: 'error',
        message: `模型加载失败：${errorMessage}`
      })
    }
  }, [])

  // AI分析-流式输出
  const handleAnalysis = useCallback(async () => {
    if (!records.length) {
      message.warning('暂无体重记录，请先添加记录')
      return
    }

    if (!engineRef.current) {
      await initializeModel()
    }
    if (!engineRef.current) return

    // 清空并初始化状态
    setAnalysisState({
      trend: '',
      assessment: '',
      advice: '',
      currentSection: 'trend'
    })
    setStatus({ type: 'analyzing', message: '正在分析数据趋势...' })

    const recentData = records.slice(0, 10).map(r => ({
      date: r.date,
      weight: r.weight,
      bmi: r.bmi,
      bodyFatRate: r.bodyFatRate,
      muscleRate: r.muscleRate,
      visceralFatIndex: r.visceralFatIndex
    }))
    const dataStr = JSON.stringify(recentData, null, 2)

    // 流式生成单段，并实时更新对应字段
    const streamSection = async (
      section: 'trend' | 'assessment' | 'advice',
      userPrompt: string,
      systemTask: string,
      maxTokens: number
    ) => {
      if (!engineRef.current) throw new Error('引擎未就绪')

      const stream = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `你是一位专业健身教练。${systemTask}用中文回答，仅输出纯文本内容，不要使用Markdown、编号、项目符号、标题或换行符。语言简洁、专业、自然。`
          },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.35,
        stream: true
      })

      let accumulated = ''
      setAnalysisState(prev => ({
        ...prev,
        [section]: '',
        currentSection: section
      }))

      for await (const chunk of stream) {
        const content = chunk.choices[0].delta.content ?? ''
        if (typeof content === 'string') {
          accumulated += content
          // 实时更新该段内容（React 会自动批处理，性能可接受）
          setAnalysisState(prev => ({ ...prev, [section]: accumulated }))
        }
      }

      // 段落结束，清理多余空白
      setAnalysisState(prev => ({
        ...prev,
        [section]: accumulated.trim()
      }))
    }

    try {
      // 第一段：趋势
      await streamSection(
        'trend',
        `请分析以下身体数据的近期变化趋势（重点关注体重、BMI、体脂率）：\n\n${dataStr}`,
        '请分析用户的身体指标变化趋势。',
        200
      )

      // 第二段：评估
      setStatus({ type: 'analyzing', message: '正在评估当前健康状态...' })
      await streamSection(
        'assessment',
        `这是我的身体数据：\n\n${dataStr}\n\n请评估我当前的健康状态（如体脂是否偏高、肌肉量是否充足等）。`,
        '请评估用户的当前健康状态。',
        200
      )

      // 第三段：建议
      setStatus({ type: 'analyzing', message: '正在生成个性化建议...' })
      await streamSection(
        'advice',
        `这是我的身体数据：\n\n${dataStr}\n\n请给出一条最关键的运动建议和一条饮食建议，具体可行。`,
        '请给出一条运动建议和一条饮食建议。',
        250
      )

      setStatus({ type: 'done', message: '分析完成' })
    } catch (error) {
      console.error('[Stream Analysis Error]', error)
      const msg = error instanceof Error ? error.message : '未知错误'
      setStatus({ type: 'error', message: `分析失败：${msg}` })
    }
  }, [records, initializeModel])
  // AI区渲染内容
  const renderAnalysisContent = () => {
    switch (status.type) {
      case 'loading':
        return (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <Progress type="circle" percent={Math.round(status.progress)} />
            <p style={{ marginTop: 10 }}>{status.message}</p>
          </div>
        )
      case 'analyzing':
        return (
          <div className="markdown-body">
            {/* 趋势 */}
            {analysisState.trend && (
              <>
                <h3>📈 数据趋势解读</h3>
                <p>{analysisState.trend}</p>
              </>
            )}

            {/* 评估 */}
            {analysisState.assessment && (
              <>
                <h3>⚖️ 当前状态评估</h3>
                <p>{analysisState.assessment}</p>
              </>
            )}

            {/* 建议 */}
            {analysisState.advice && (
              <>
                <h3>💡 个性化建议</h3>
                <p>{analysisState.advice}</p>
              </>
            )}

            {/* 底部加载提示 */}
            <div style={{ textAlign: 'center', paddingTop: 50 }}>
              <Spin size="large" />
              <p style={{ marginTop: 10 }}>{status.message}</p>
            </div>
          </div>
        )
      case 'done':
        return (
          <div className="markdown-body">
            {analysisState.trend && (
              <>
                <h3>📈 数据趋势解读</h3>
                <p>{analysisState.trend}</p>
              </>
            )}

            {analysisState.assessment && (
              <>
                <h3>⚖️ 当前状态评估</h3>
                <p>{analysisState.assessment}</p>
              </>
            )}

            {analysisState.advice && (
              <>
                <h3>💡 个性化建议</h3>
                <p>{analysisState.advice}</p>
              </>
            )}
          </div>
        )
      case 'error':
        return <Text type="danger">{status.message}</Text>
      case 'idle':
      default:
        return <p>{status.message}</p>
    }
  }
  return (
    <Splitter
      style={{
        height: 600,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        padding: 12
      }}
    >
      <Splitter.Panel collapsible min="20%">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Title level={4} style={{ marginBottom: 12 }}>
            体重数据展示
          </Title>
          <Button
            type="primary"
            onClick={() => void handleAnalysis()}
            loading={status.type === 'loading' || status.type === 'analyzing'}
            style={{ marginBottom: 12 }}
          >
            {engineRef.current ? '开始分析' : '加载 AI 并分析'}
          </Button>
        </div>

        <div
          style={{
            paddingRight: 12,
            height: 'calc(100% - 44px)',
            overflowY: 'auto'
          }}
        >
          <List
            dataSource={records}
            renderItem={item => (
              <List.Item>
                <Descriptions
                  bordered
                  size="small"
                  column={2}
                  style={{ width: '100%' }}
                >
                  {Object.entries(item).map(([k, v]) => (
                    <Descriptions.Item key={k} label={k}>
                      {String(v)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </List.Item>
            )}
          />
        </div>
      </Splitter.Panel>

      <Splitter.Panel collapsible min="20%">
        <Title level={4} style={{ marginBottom: 12, paddingLeft: 12 }}>
          AI 分析与建议 (使用webllm加载phi3模型和流式输出)
        </Title>
        <Card
          style={{
            marginLeft: 12,
            height: 'calc(100% - 44px)',
            overflowY: 'auto'
          }}
        >
          {renderAnalysisContent()}
        </Card>
      </Splitter.Panel>
    </Splitter>
  )
}
