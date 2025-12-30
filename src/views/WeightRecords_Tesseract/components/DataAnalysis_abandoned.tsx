// Transformers.js + Phi-3

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card,
  Splitter,
  Typography,
  List,
  Descriptions,
  message,
  Button,
  Spin
} from 'antd'
import MarkdownIt from 'markdown-it'
import type { BodyMetricsRecord } from '@/views/WeightRecords/components/types'

const { Title, Text } = Typography

type Status =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string }
  | { type: 'analyzing'; message: string }
  | { type: 'done'; message: string }
  | { type: 'error'; message: string }

const md = new MarkdownIt()

export default function DataAnalysis({
  records
}: {
  records: BodyMetricsRecord[]
}) {
  const [status, setStatus] = useState<Status>({
    type: 'idle',
    message: '准备就绪，点击按钮开始分析。'
  })
  const [analysisResult, setAnalysisResult] = useState<string>('')
  const [modelLoaded, setModelLoaded] = useState(false)

  const workerRef = useRef<Worker | null>(null)

  // 初始化 Worker
  useEffect(() => {
    if (!workerRef.current) {
      const worker = new Worker(
        new URL('@/workers/modelWorker_abandoned', import.meta.url),
        {
          type: 'module'
        }
      )
      workerRef.current = worker
      worker.onmessage = ({
        data
      }: MessageEvent<{ type: string; message: string; result?: string }>) => {
        const { type, message: msgText, result } = data

        switch (type) {
          case 'LOADING':
            setStatus({ type: 'loading', message: msgText })
            break
          case 'MODEL_READY':
            setModelLoaded(true)
            setStatus({
              type: 'idle',
              message: '模型加载完毕，可以开始分析了。'
            })
            break
          case 'ANALYZING':
            setStatus({ type: 'analyzing', message: msgText })
            break
          case 'GENERATION_DONE':
            setAnalysisResult(result ?? '')
            setStatus({ type: 'done', message: '分析完成！' })
            break
          case 'ERROR':
            setStatus({ type: 'error', message: msgText })
            message.error(msgText)
            break
        }
      }

      worker.onerror = error => {
        console.error('Worker error:', error)
        setStatus({ type: 'error', message: `Worker 崩溃: ${error.message}` })
        message.error('模型推理线程崩溃，请刷新页面重试')
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const handleAnalysis = useCallback(() => {
    if (!records.length) {
      message.warning('暂无体重记录，请先添加记录')
      return
    }

    if (!workerRef.current) {
      message.error('模型线程未初始化')
      return
    }

    // 发送初始化 + 推理指令
    workerRef.current.postMessage({
      type: 'INIT_MODEL'
    })

    // 等待模型加载完成（通过 onmessage 监听）
    // 实际推理在 worker 中自动触发
    workerRef.current.postMessage({
      type: 'GENERATE',
      payload: {
        prompt: `
          <|system|>
          你是顶级健身教练和营养顾问，基于用户身体指标数据，用中文生成Markdown格式分析报告，包含：1.数据趋势解读 2.当前状态评估 3.个性化运动建议 4.精准饮食指导 5.总结与鼓励
          <|end|>
          <|user|>
          我的身体数据记录：${JSON.stringify(records.slice(0, 14), null, 2)}
          <|end|>
          <|assistant|>
          好的，这是为您准备的专业健身与营养分析报告：
        `.trim(),
        config: {
          max_new_tokens: 1024,
          temperature: 0.7,
          top_k: 50,
          do_sample: true,
          pad_token_id: 50256
        }
      }
    })
  }, [records])

  const renderAnalysisContent = () => {
    switch (status.type) {
      case 'loading':
      case 'analyzing':
        return (
          <div style={{ textAlign: 'center', paddingTop: 50 }}>
            <Spin size="large" />
            <p
              style={{
                marginTop: 20,
                fontSize: 14,
                maxWidth: 400,
                margin: '20px auto 0'
              }}
            >
              {status.message}
            </p>
          </div>
        )
      case 'done':
        return (
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{ __html: md.render(analysisResult) }}
            style={{ padding: '0 16px' }}
          />
        )
      case 'error':
        return (
          <Text
            type="danger"
            style={{ fontSize: 14, lineHeight: 1.6, padding: '16px' }}
          >
            {status.message}
          </Text>
        )
      default:
        return <p style={{ fontSize: 14, padding: '16px' }}>{status.message}</p>
    }
  }

  return (
    <Splitter
      style={{
        height: 600,
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        padding: 12,
        borderRadius: 4
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
            onClick={handleAnalysis}
            loading={status.type === 'loading' || status.type === 'analyzing'}
            style={{ marginBottom: 12 }}
          >
            {modelLoaded ? '开始分析' : '加载 AI 并分析'}
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
          AI 分析与建议
        </Title>
        <Card
          style={{
            marginLeft: 12,
            height: 'calc(100% - 44px)',
            overflowY: 'auto',
            border: '1px solid #f0f0f0'
          }}
        >
          {renderAnalysisContent()}
        </Card>
      </Splitter.Panel>
    </Splitter>
  )
}
