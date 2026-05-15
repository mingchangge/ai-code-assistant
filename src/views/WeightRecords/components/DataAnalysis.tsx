// DataAnalysis.tsx
import { useState, useRef, useCallback } from 'react'
import {
  AutoTokenizer,
  TextGenerationPipeline,
  pipeline
} from '@huggingface/transformers'
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
import MarkdownIt from 'markdown-it'
import WorkerConstructor from '@/workers/opfs-cache.worker?worker'
import { registerSW } from '@/utils/register-sw'
import type { BodyMetricsRecord } from './types' // 你的类型定义文件
import { METRIC_KEY_MAP_REVERSE } from '@/services/ocr/weight-domain/constants.ts'

const { Title, Text } = Typography

/* ---------- 严格类型定义 ---------- */
type Status =
  | { type: 'idle'; message: string }
  | { type: 'loading'; message: string; progress: number }
  | { type: 'analyzing'; message: string }
  | { type: 'done'; message: string }
  | { type: 'error'; message: string }

// 常量
const md = new MarkdownIt()

// 组件
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

  const pipelineRef = useRef<TextGenerationPipeline | null>(null)

  /* 初始化模型（仅执行一次） */
  const initializeModel = useCallback(async (): Promise<void> => {
    setStatus({
      type: 'loading',
      message: '首次缓存模型到浏览器...',
      progress: 0
    })
    // 获取 OPFS 根目录
    const root = await navigator.storage.getDirectory()
    // 检查是否存在 models 目录
    const modelDir = await root.getDirectoryHandle('models', { create: true })

    let needCache = false
    try {
      // 检查是否已缓存模型
      await modelDir.getDirectoryHandle('phi3')
    } catch {
      // 如果模型不存在，标记为需要下载
      needCache = true
    }
    // 仅在需要下载无缓存时执行
    if (needCache) {
      const worker = new WorkerConstructor()
      await new Promise<void>((resolve, reject) => {
        worker.onmessage = ({
          data
        }: MessageEvent<{ type: string; percent?: number }>) => {
          if (data.type === 'progress')
            setStatus({
              type: 'loading',
              message: '缓存中...',
              progress: data.percent ?? 0
            })
          if (data.type === 'done') resolve()
        }
        worker.onerror = reject
        worker.postMessage(window.location.origin)
      })
    }

    // 通过 SW 加载（Hub 字符串，但流量被截获到 OPFS）
    const MODEL_ID = 'Xenova/Phi-3-mini-4k-instruct'
    try {
      await registerSW()
      const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
      try {
        const pipe = await pipeline('text-generation', MODEL_ID, {
          device: 'webgpu',
          tokenizer
        })

        pipelineRef.current = pipe
        setStatus({ type: 'idle', message: '模型加载完毕，可以开始分析了。' })
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        setStatus({ type: 'error', message: `模型加载失败pipeline: ${msg}` })
        message.error(`模型加载失败pipeline: ${msg}`)
      }
      // const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus({ type: 'error', message: `模型加载失败tokenizer: ${msg}` })
      message.error(`模型加载失败tokenizer: ${msg}`)
    }
  }, [])
  /* 分析按钮回调 */
  const handleAnalysis = useCallback(async (): Promise<void> => {
    if (!records.length) {
      message.warning('暂无体重记录，请先添加记录')
      return
    }

    if (!pipelineRef.current) await initializeModel()
    if (!pipelineRef.current) return

    setStatus({ type: 'analyzing', message: 'AI 正在分析您的数据，请稍候...' })

    try {
      const prompt = `
        <|system|>
        你是一位顶级的私人健身教练和营养顾问。你的任务是基于用户提供的身体指标数据，给出一份专业、详尽且充满鼓励的分析报告和行动建议。请严格使用中文回答，并以 Markdown 格式进行组织。

        你的分析应包含以下部分：
        1. 数据趋势解读
        2. 当前状态评估
        3. 个性化运动建议
        4. 精准饮食指导
        5. 总结与鼓励
        <|end|>
        <|user|>
        这是我的身体数据记录（JSON 格式），请帮我分析：
        ${JSON.stringify(records.slice(0, 14), null, 2)}
        <|end|>
        <|assistant|>
        好的，这是为您准备的专业健身与营养分析报告：
      `.trim()

      const result = await pipelineRef.current(prompt, {
        max_new_tokens: 1024,
        temperature: 0.7,
        top_k: 50,
        do_sample: true
      })

      const text: string =
        (result[0]?.generated_text.split('<|assistant|>').pop()?.trim() as
          | string
          | undefined) ?? ('未能生成有效分析，请稍后重试。' as string)

      setAnalysisResult(text)
      setStatus({ type: 'done', message: '分析完成！' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setStatus({ type: 'error', message: `分析过程中出现错误: ${msg}` })
      message.error(`分析失败: ${msg}`)
    }
  }, [records, initializeModel])

  /* 渲染右侧内容 */
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

  /* ---------- UI ---------- */
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
            {pipelineRef.current ? '开始分析' : '加载 AI 并分析'}
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
                    <Descriptions.Item
                      key={k}
                      label={
                        k === 'date'
                          ? '测量日期'
                          : ((METRIC_KEY_MAP_REVERSE[k] ?? k) as string)
                      }
                    >
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
            overflowY: 'auto'
          }}
        >
          {renderAnalysisContent()}
        </Card>
      </Splitter.Panel>
    </Splitter>
  )
}
