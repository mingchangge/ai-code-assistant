import { useState, useEffect } from 'react'
import { Button, Progress, Space, message } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
// 导入我们的服务和类型
import { initializeModels, runRecognition } from '@/services/recognitionService'
import type { RecognitionResult } from './types'

interface RecognitionControllerProps {
  isRecognizing: boolean
  selectedImage: string | null
  // 更新sendRecognizedData的类型签名
  sendRecognizedData: (data: RecognitionResult) => void
  sendIsRecognizing: (isRecognizing: boolean) => void
}

const RecognitionController = ({
  isRecognizing,
  selectedImage,
  sendRecognizedData,
  sendIsRecognizing
}: RecognitionControllerProps) => {
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] =
    useState<string>('正在加载AI模型...')

  // 在组件挂载时，只调用一次模型初始化函数
  useEffect(() => {
    initializeModels()
      .then(() => {
        setModelsLoaded(true)
      })
      .catch((error: unknown) => {
        console.error(error)
        setLoadingMessage('模型加载失败，请刷新页面。')
        message.error(error instanceof Error ? error.message : String(error))
      })
  }, []) // 空依赖数组确保只运行一次

  // 处理识别操作的函数现在非常简洁
  const onRecognize = async () => {
    if (!selectedImage) {
      message.warning('请先上传图片')
      return
    }

    sendIsRecognizing(true)

    try {
      // 只需调用一行服务函数！
      const result: RecognitionResult = await runRecognition(selectedImage)
      sendRecognizedData(result)
      message.success('识别成功')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('识别失败:', errorMessage)
      message.error(`识别失败: ${errorMessage}`)
    } finally {
      sendIsRecognizing(false)
    }
  }

  // --- UI部分 ---

  // 如果模型正在加载，显示加载状态
  if (!modelsLoaded) {
    return (
      <Space direction="vertical" align="center" style={{ width: '100%' }}>
        <SyncOutlined spin style={{ fontSize: '24px', color: '#1677ff' }} />
        <span>{loadingMessage}</span>
      </Space>
    )
  }

  // 模型加载完毕后，显示识别按钮
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={isRecognizing ? <SyncOutlined spin /> : undefined}
          onClick={() => void onRecognize()}
          disabled={!selectedImage || isRecognizing}
        >
          {isRecognizing ? '智能识别中...' : '开始识别'}
        </Button>
      </div>

      {/* 识别中的进度条，因为自定义模型速度很快，可以考虑用不确定进度的加载条 */}
      {isRecognizing && (
        <Progress percent={50} status="active" showInfo={false} />
      )}
    </Space>
  )
}

export default RecognitionController
