import { useState, useRef, useCallback } from 'react'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'
import MarkdownIt from 'markdown-it'
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
const md = new MarkdownIt()
// 根据硬件并发数选择推荐模型
// const getRecommendedModel = () => {
//   if (navigator.hardwareConcurrency >= 8) return 'Mistral-7B-v0.3-q4f16_1-MLC';
//   else return 'Phi-3-mini-4k-instruct-q4f16_1-MLC';
// };
const selectedModel = 'Qwen3-0.6B-q4f32_1-MLC'
// 打印所有模型配置
// console.log(prebuiltAppConfig.model_list.map(m => m))
export default function DataAnalysis({
  records
}: {
  records: BodyMetricsRecord[]
}) {
  const [status, setStatus] = useState<Status>({
    type: 'idle',
    message: '准备就绪，点击按钮开始分析。'
  })
  const [analysisResult, setAnalysisResult] = useState('')
  const engineRef = useRef<MLCEngine | null>(null)

  // AI分析--初始化进度回调
  const initProgressCallback = (initProgress: InitProgressReport) => {
    console.log(initProgress)
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
    } else {
      // 初次加载但进度为0的情况
      message = '准备模型...'
    }
    console.log(12121)
    setStatus({
      type: 'loading',
      message: message,
      progress: progress
    })
    console.log(initProgress)
  }

  // 初始化AI
  const initializeModel = useCallback(async () => {
    console.log('Initializing model...')
    setStatus({ type: 'loading', message: '准备模型...', progress: 0 })
    try {
      const engine = await CreateMLCEngine(selectedModel, {
        initProgressCallback: initProgressCallback
      })
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
  // 工具函数：清理 AI 输出
  const sanitizeAIPart = (text: string): string => {
    return text
      .replace(/^#+\s*/gm, '') // 移除用户内容中可能的 #
      .replace(/^[*-]\s*/gm, '') // 可选：移除列表符号
      .replace(/\n{3,}/g, '\n\n') // 防止过多空行
      .trim()
  }
  // AI分析--非流式输出
  const handleAnalysis = useCallback(async () => {
    if (!records.length) {
      message.warning('暂无体重记录，请先添加记录')
      return
    }

    // 确保引擎已加载
    if (!engineRef.current) {
      await initializeModel()
    }
    if (!engineRef.current) return

    setStatus({ type: 'analyzing', message: '正在分析趋势...' })
    setAnalysisResult('') // 清空旧结果

    const recentData = records.slice(0, 10).map(r => ({
      date: r.date,
      weight: r.weight,
      bmi: r.bmi,
      bodyFatRate: r.bodyFatRate,
      muscleRate: r.muscleRate,
      visceralFatIndex: r.visceralFatIndex
    }))

    const dataStr = JSON.stringify(recentData, null, 2)

    try {
      // === 第1轮：趋势解读 ===
      const trendRes = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              '你是一位专业健身教练。请基于用户的身体数据，用中文直接回答以下问题。' +
              '禁止输出任何 <think> 标签、推理过程或内部思考。不要使用Markdown，不要编号，不要标题，直接回答，不超过150字。'
          },
          {
            role: 'user',
            content: `请分析以下身体数据的近期变化趋势（重点关注体重、BMI、体脂率）：\n\n${dataStr}`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
      const trend = trendRes.choices[0]?.message?.content?.trim() ?? ''
      setStatus({ type: 'analyzing', message: '正在评估当前状态...' })
      // === 第2轮：状态评估 ===
      const assessRes = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              '你是一位专业健身教练。请基于用户的身体数据，用中文直接回答以下问题。' +
              '禁止输出任何 <think> 标签、推理过程或内部思考。不要使用Markdown，不要编号，不要标题，直接回答，不超过150字。'
          },
          {
            role: 'user',
            content: `这是我的身体数据：\n\n${dataStr}\n\n请评估我当前的健康状态（如体脂是否偏高、肌肉量是否充足等）。`
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      })
      const assessment = assessRes.choices[0]?.message?.content?.trim() ?? ''
      setStatus({ type: 'analyzing', message: '正在生成建议...' })

      // === 第3轮：运动与饮食建议 ===
      const adviceRes = await engineRef.current.chat.completions.create({
        messages: [
          {
            role: 'system',
            content:
              '你是一位专业健身教练。请基于用户的身体数据，用中文直接回答以下问题。' +
              '禁止输出任何 <think> 标签、推理过程或内部思考。不要使用Markdown，不要编号，不要标题，直接回答，不超过150字。'
          },
          {
            role: 'user',
            content: `这是我的身体数据：\n\n${dataStr}\n\n请给出具体建议。`
          }
        ],
        max_tokens: 500,
        temperature: 0.4
      })
      const advice = adviceRes.choices[0]?.message?.content?.trim() ?? ''

      // 拼接最终结果
      const cleanPart = (text: string) =>
        text
          .split('\n')
          .map(line => line.trimStart())
          .join('\n')
          .trim()

      const finalMarkdown = [
        '## 📈 数据趋势解读',
        cleanPart(sanitizeAIPart(trend)),
        '',
        '## ⚖️ 当前状态评估',
        cleanPart(sanitizeAIPart(assessment)),
        '',
        '## 💡 个性化建议',
        cleanPart(sanitizeAIPart(advice))
      ].join('\n')

      setAnalysisResult(finalMarkdown)
      setStatus({ type: 'done', message: '分析完成' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setStatus({ type: 'error', message: `分析失败：${errorMessage}` })
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
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <Spin size="large" />
            <p style={{ marginTop: 10 }}>{status.message}</p>
          </div>
        )
      case 'done':
        return (
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: md.render(analysisResult) }}
          />
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
          AI 分析与建议 (使用webllm加载千问模型和非流式输出)
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
