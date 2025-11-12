import { useState, useEffect, useRef } from 'react'
import {
  Card,
  Typography,
  message,
  Row,
  Col,
  Spin,
  Input,
  Button,
  Space
} from 'antd'

const { TextArea } = Input

type MessageType =
  | 'MODEL_INIT'
  | 'LOADING'
  | 'MODEL_READY'
  | 'ERROR'
  | 'GENERATION_DONE'

export default function TransformDemo() {
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [generating, setGenerating] = useState(false)
  const workerRef = useRef<Worker>(null)
  useEffect(() => {
    const worker = new Worker(
      new URL('@/workers/transformer.worker.ts', import.meta.url),
      {
        type: 'module'
      }
    )
    workerRef.current = worker
    workerRef.current.postMessage({ type: 'MODEL_INIT' })
    workerRef.current.onmessage = (
      event: MessageEvent<{ type: MessageType; message?: string }>
    ) => {
      const { type, message: msg } = event.data
      console.log('收到消息:', type)
      switch (type) {
        case 'MODEL_READY':
          setLoading(false)
          break
        case 'LOADING':
          setLoading(true)
          break
        case 'GENERATION_DONE':
          console.log(msg, 'GENERATION_DONE')
          setResponse(msg ?? '')
          setGenerating(false)
          break
        case 'ERROR':
          setLoading(false)
          message.error(msg ?? '模型加载失败')
          break
      }
    }
    worker.onerror = error => {
      setLoading(false)
      message.error(`模型加载失败: ${error.message}`)
    }
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])
  const handleSend = () => {
    if (!input) {
      message.error('请输入内容')
      return
    }
    setGenerating(true)
    workerRef.current?.postMessage({ type: 'SEND_PROMPT', message: input })
  }
  return (
    <div>
      <h1>Transform Demo</h1>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="模型加载">
            <Spin spinning={loading}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                <Space.Compact>
                  <Typography.Text>模型加载完成：</Typography.Text>
                </Space.Compact>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="请输入"
                    value={input}
                    onChange={e => {
                      setInput(e.target.value)
                    }}
                  />
                  <Button
                    type="primary"
                    disabled={generating}
                    onClick={handleSend}
                  >
                    {generating ? '生成中' : '发送'}
                  </Button>
                </Space.Compact>
                <Space.Compact style={{ width: '100%' }}>
                  <Typography.Text>模型响应内容：</Typography.Text>
                </Space.Compact>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    style={{ width: '100%' }}
                    disabled={true}
                    rows={4}
                    placeholder="maxLength is 128"
                    maxLength={128}
                    value={response}
                  />
                </Space.Compact>
              </Space>
            </Spin>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="模块2"></Card>
        </Col>
      </Row>
    </div>
  )
}
