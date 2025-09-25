import { useState, useEffect, useCallback } from 'react'
import {
  Button,
  Progress,
  Alert,
  Card,
  Typography,
  Space,
  Tag,
  Divider,
  Switch
} from 'antd'
import {
  ScanOutlined,
  SyncOutlined,
  CheckOutlined,
  EditOutlined
} from '@ant-design/icons'
import Tesseract, { type Worker } from 'tesseract.js'

import {
  type BodyCompositionData,
  processRecognitionText
} from '@/utils/textParser'
import { ImageProcessor } from '@/utils/imageProcessor'

const { Text } = Typography

interface ImageRecognizerProps {
  imageData: string | null
  onRecognitionComplete: (data: BodyCompositionData) => void
}

const ImageRecognizer = ({
  imageData,
  onRecognitionComplete
}: ImageRecognizerProps) => {
  console.log('ImageRecognizer imageData', imageData)
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false)
  const [recognitionProgress, setRecognitionProgress] = useState<number>(0)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string>('')
  const [parsedData, setParsedData] = useState<BodyCompositionData | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [useEnhancement, setUseEnhancement] = useState<boolean>(true)
  const [processedImage, setProcessedImage] = useState<string | null>(null)

  // 初始化Tesseract工作器
  useEffect(() => {
    let currentWorker: Worker | null = null

    const initWorker = async () => {
      try {
        // 初始化工作器，配置识别参数
        const newWorker = await Tesseract.createWorker('chi_sim+eng', 1, {
          logger: m => {
            if (m.status === 'recognizing text') {
              setRecognitionProgress(Math.round(m.progress * 100))
            }
          }
        })

        currentWorker = newWorker
        setWorker(newWorker)
      } catch (error) {
        console.error('Worker初始化失败:', error)
        setRecognitionError('识别服务初始化失败，请刷新页面重试')
      }
    }

    void initWorker()

    // 组件卸载时清理工作器
    return () => {
      if (currentWorker) {
        void currentWorker.terminate()
      }
    }
  }, [])

  // 当原图或增强选项变化时预处理图像
  useEffect(() => {
    if (imageData && useEnhancement) {
      ImageProcessor.preprocessImage(imageData)
        .then(processed => {
          setProcessedImage(processed)
        })
        .catch((error: unknown) => {
          console.error('图像预处理失败:', error)
          setProcessedImage(imageData) // 失败时使用原图
        })
    } else {
      setProcessedImage(imageData)
    }
  }, [imageData, useEnhancement])

  // 取消识别
  const cancelRecognition = useCallback(async () => {
    if (worker) {
      await worker.terminate()
      setWorker(null)
      setIsRecognizing(false)
      setRecognitionProgress(0)

      // 重新初始化工作器
      const newWorker = await Tesseract.createWorker('chi_sim+eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setRecognitionProgress(Math.round(m.progress * 100))
          }
        }
      })
      setWorker(newWorker)
    }
  }, [worker])

  // 开始识别
  const startRecognition = useCallback(async () => {
    console.log(
      'ImageRecognizer startRecognition processedImage',
      processedImage
    )
    if (!processedImage || !worker || isRecognizing) {
      return
    }

    setIsRecognizing(true)
    setRecognitionError(null)
    setRawText('')
    setParsedData(null)
    setRecognitionProgress(0)

    try {
      // 使用预处理后的图像进行识别
      const { data } = await worker.recognize(processedImage)

      if (!data.text.trim()) {
        throw new Error('未识别到任何文本，请确保图片清晰且包含可识别的文字')
      }

      // 保存原始识别文本
      setRawText(data.text)

      // 处理并解析文本
      const result = processRecognitionText(data.text)
      setParsedData(result)
    } catch (error) {
      console.error('识别错误:', error)
      setRecognitionError(
        error instanceof Error ? error.message : '图片识别失败，请重试'
      )
    } finally {
      setIsRecognizing(false)
    }
  }, [processedImage, worker, isRecognizing])

  // 确认并提交识别结果
  const confirmRecognition = useCallback(() => {
    if (parsedData) {
      onRecognitionComplete(parsedData)
      // 重置状态，准备下一次识别
      setRawText('')
      setParsedData(null)
    }
  }, [parsedData, onRecognitionComplete])

  return (
    <Card variant="outlined">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* 图像增强选项 */}
        <Space style={{ justifyContent: 'flex-end' }}>
          <Text>启用图像增强</Text>
          <Switch
            checked={useEnhancement}
            onChange={setUseEnhancement}
            disabled={isRecognizing}
          />
        </Space>

        {/* 显示预处理后的图像预览 */}
        {processedImage && !isRecognizing && (
          <Card
            variant="outlined"
            title={
              <Space size="small">
                {/* <ImageOutlined /> */}
                <Text>处理后图像预览</Text>
              </Space>
            }
          >
            <img
              src={processedImage}
              alt="处理后的图像"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                border: '1px solid #f0f0f0'
              }}
            />
          </Card>
        )}

        <Button
          type="primary"
          icon={isRecognizing ? <SyncOutlined spin /> : <ScanOutlined />}
          size="middle"
          onClick={() => void startRecognition()}
          disabled={!processedImage || isRecognizing || !worker}
          style={{ width: '100%' }}
        >
          {isRecognizing ? '正在识别...' : '开始识别身体成分数据'}
        </Button>

        {isRecognizing && (
          <div>
            <Progress
              percent={recognitionProgress}
              status="active"
              strokeColor="#1890ff"
            />
            <Text
              type="secondary"
              style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}
            >
              正在分析图片中的体重、BMI、体脂率等信息...
            </Text>
            <Button
              type="text"
              danger
              onClick={() => void cancelRecognition()}
              style={{ marginTop: '8px' }}
            >
              取消识别
            </Button>
          </div>
        )}

        {recognitionError && (
          <Alert
            message="识别失败"
            description={recognitionError}
            type="error"
            showIcon
          />
        )}

        {rawText && (
          <>
            <Divider orientation="left">
              <Text type="secondary">原始识别文本</Text>
            </Divider>
            <Card variant="outlined">
              <Text>{rawText}</Text>
            </Card>
          </>
        )}

        {parsedData && (
          <>
            <Divider orientation="left">
              <Text type="secondary">识别结果</Text>
            </Divider>

            <Card variant="outlined">
              <Space direction="vertical" size="small">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: '8px'
                  }}
                >
                  {/* 显示识别到的字段 */}
                  {parsedData.weight !== undefined && (
                    <div>
                      <Text type="secondary">体重:</Text>
                      <Text strong>{parsedData.weight} 公斤</Text>
                    </div>
                  )}

                  {parsedData.bmi !== undefined && (
                    <div>
                      <Text type="secondary">BMI:</Text>
                      <Text strong>{parsedData.bmi}</Text>
                    </div>
                  )}

                  {parsedData.bodyFatRate !== undefined && (
                    <div>
                      <Text type="secondary">体脂率:</Text>
                      <Text strong>{parsedData.bodyFatRate}%</Text>
                    </div>
                  )}

                  {parsedData.waterRate !== undefined && (
                    <div>
                      <Text type="secondary">水分率:</Text>
                      <Text strong>{parsedData.waterRate}%</Text>
                    </div>
                  )}

                  {parsedData.bodyAge !== undefined && (
                    <div>
                      <Text type="secondary">身体年龄:</Text>
                      <Text strong>{parsedData.bodyAge} 岁</Text>
                    </div>
                  )}

                  {parsedData.bodyType && (
                    <div>
                      <Text type="secondary">体型:</Text>
                      <Tag
                        color={
                          parsedData.bodyType.includes('肥胖')
                            ? 'red'
                            : 'orange'
                        }
                      >
                        {parsedData.bodyType}
                      </Tag>
                    </div>
                  )}
                </div>

                <Space
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    justifyContent: 'flex-end'
                  }}
                >
                  <Button
                    icon={<CheckOutlined />}
                    type="primary"
                    onClick={confirmRecognition}
                  >
                    确认并保存
                  </Button>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => {
                      // 这里可以添加编辑功能
                      alert('编辑功能可在此处实现')
                    }}
                  >
                    手动修正
                  </Button>
                </Space>
              </Space>
            </Card>
          </>
        )}
      </Space>
    </Card>
  )
}

export default ImageRecognizer
