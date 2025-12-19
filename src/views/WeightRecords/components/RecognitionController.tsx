import { useState, useEffect } from 'react'
import { Button, Progress, Space, message } from 'antd'
import { SyncOutlined, ScissorOutlined } from '@ant-design/icons'
// 导入我们的服务和类型
import {
  initializeModels,
  runRecognition,
  visualizeLayoutDetection,
  cropAndDownloadTrainingSet
} from '@/services/recognitionService'
import type { BoundingBox, RecognitionResult } from './types'

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
  const [debugImage, setDebugImage] = useState<string | null>(null)
  const [rawBoxes, setRawBoxes] = useState<BoundingBox[] | null>(null) // 保存原始检测框
  const [isCropping, setIsCropping] = useState<boolean>(false)

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
    setDebugImage(null) // 清空旧的可视化
    setRawBoxes(null) // 清空旧的框数据
    try {
      // 识别流程
      const result: RecognitionResult = await runRecognition(
        selectedImage,
        true
      )
      // 2. 如果识别成功，保存原始框数据用于后续裁剪
      if (result.boxesForCropping) {
        setRawBoxes(result.boxesForCropping)
      }

      // 3. 【新】调用封装好的可视化函数
      // 我们需要重新加载一次图片元素，因为runRecognition内部的元素已被回收
      const img = new Image()
      img.onload = async () => {
        const vizResult = await visualizeLayoutDetection(
          img,
          result.boxesForCropping
        )
        setDebugImage(vizResult.debugImageUrl)
      }
      img.src = selectedImage

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

  // --- 【新增】处理裁剪和下载的函数 ---
  const onCropAndDownload = async () => {
    if (!selectedImage || !rawBoxes) {
      message.warning('没有可裁剪的数据。')
      return
    }

    setIsCropping(true)
    message.info('正在裁剪并打包训练集...')

    try {
      const img = new Image()
      img.onload = async () => {
        await cropAndDownloadTrainingSet(img, rawBoxes)
        message.success('训练集已开始下载！')
      }
      img.src = selectedImage
    } catch (error) {
      console.error('裁剪失败:', error)
      message.error('裁剪打包失败。')
    } finally {
      setIsCropping(false)
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
      {/* 在这里显示调试图片！ */}
      {debugImage && (
        <div>
          <h3>布局检测结果可视化：</h3>
          <img
            src={debugImage}
            alt="Debug Preview"
            style={{ maxWidth: '100%' }}
          />
          <Button
            icon={isCropping ? <SyncOutlined spin /> : <ScissorOutlined />}
            onClick={onCropAndDownload}
            disabled={isCropping}
          >
            {isCropping ? '正在打包...' : '裁剪并下载训练集 (.zip)'}
          </Button>
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
