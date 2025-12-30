import { useState, useEffect, useRef } from 'react' // 引入 useRef
import { Button, Progress, Space, message } from 'antd'
import { SyncOutlined, ScissorOutlined } from '@ant-design/icons'
import { initializeModels, runRecognition } from '@/services/ocr'
import type { RecognitionControllerProps } from '@/services/ocr/types'

const RecognitionController = ({
  historyRecords,
  isRecognizing,
  selectedImage,
  sendRecognizedData,
  sendIsRecognizing
}: RecognitionControllerProps) => {
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] =
    useState<string>('正在加载AI模型...')
  const [debugImage, setDebugImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState<boolean>(false)

  // 使用 useRef 来存储下载函数，避免因为闭包导致内存泄漏或状态丢失
  const downloadActionRef = useRef<(() => Promise<void>) | undefined>(undefined)

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
    setDebugImage(null)
    downloadActionRef.current = undefined // 重置下载函数

    try {
      // ✅ 极其简洁的调用：传入 debug: true
      const result = await runRecognition(selectedImage, historyRecords, {
        debug: true
      })

      // 1. 处理数据
      sendRecognizedData(result)

      // 2. 直接获取调试图片 (无需 new Image)
      if (result.debugImageUrl) {
        setDebugImage(result.debugImageUrl)
      }

      // 3. 保存下载函数 (无需 rawBoxes 状态)
      if (result.downloadTrainingSet) {
        downloadActionRef.current = result.downloadTrainingSet
      }

      message.success('识别成功')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('识别失败:', msg)
      message.error(`识别失败: ${msg}`)
    } finally {
      sendIsRecognizing(false)
    }
  }

  // --- 【新增】处理裁剪和下载的函数 ---
  const onCropAndDownload = async () => {
    if (!downloadActionRef.current) {
      message.warning('无法下载，请重新识别。')
      return
    }

    setIsCropping(true)
    message.info('正在打包训练集...')

    try {
      // 直接调用保存的闭包函数
      await downloadActionRef.current()
      message.success('下载已开始！')
    } catch (error) {
      console.error(error)
      message.error('打包失败')
    } finally {
      setIsCropping(false)
    }
  }

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
      {/* 在这里显示调试图片！ */}
      {debugImage && (
        <div style={{ textAlign: 'center' }}>
          <h3>AI 视野 (红框为 Agent 关注区域)：</h3>
          <img
            src={debugImage}
            alt="Debug Preview"
            style={{
              maxWidth: '100%',
              border: '1px solid #eee',
              borderRadius: '8px'
            }}
          />
          <div style={{ marginTop: 12 }}>
            <Button
              icon={isCropping ? <SyncOutlined spin /> : <ScissorOutlined />}
              onClick={() => void onCropAndDownload()}
              disabled={isCropping || !downloadActionRef.current}
            >
              {isCropping ? '正在打包...' : '下载训练集 (用于微调)'}
            </Button>
          </div>
        </div>
      )}
      {/* 识别中的进度条，因为自定义模型速度很快，可以考虑用不确定进度的加载条 */}
      {isRecognizing && (
        <Progress percent={50} status="active" showInfo={false} />
      )}
    </Space>
  )
}

export default RecognitionController
