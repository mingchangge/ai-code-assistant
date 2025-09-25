import { useState, useEffect } from 'react'
import { Card, Space, Typography, Divider, Alert, Layout } from 'antd'
import ImageUploader from './components/ImageUploader'
import ImageRecognizer from './components/ImageRecognizer'
import RecordsTable from './components/RecordsTable'
import type { WeightRecord } from './components/types'

const { Title, Paragraph } = Typography
const { Content } = Layout

const WeightTracker = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([])
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)

  // 从本地存储加载记录
  useEffect(() => {
    const loadRecords = (): void => {
      try {
        const savedRecords = localStorage.getItem('weightRecords')
        if (savedRecords) {
          const parsedRecords = JSON.parse(savedRecords) as WeightRecord[]
          // 验证数据结构
          if (Array.isArray(parsedRecords)) {
            setWeightRecords(parsedRecords)
          }
        }
      } catch (error) {
        console.error('加载记录失败:', error)
        // 清除损坏的存储数据
        localStorage.removeItem('weightRecords')
      }
    }

    loadRecords()
  }, [])

  // 保存记录到本地存储
  useEffect(() => {
    try {
      localStorage.setItem('weightRecords', JSON.stringify(weightRecords))
    } catch (error) {
      console.error('保存记录失败:', error)
    }
  }, [weightRecords])

  // 处理新图片选择
  const handleImageSelected = (imageData: string): void => {
    setSelectedImage(imageData)
  }

  // 处理图片移除
  const handleImageRemoved = (): void => {
    setSelectedImage(null)
  }

  // 处理识别完成
  const handleRecognitionComplete = (record: WeightRecord): void => {
    // 将新记录添加到列表开头
    setWeightRecords(prev => [record, ...prev])
    // 显示成功提示
    setShowSuccessAlert(true)
    setTimeout(() => {
      setShowSuccessAlert(false)
    }, 3000)
  }

  // 删除记录
  const handleDeleteRecord = (id: string): void => {
    setWeightRecords(prev => prev.filter(record => record.id !== id))
  }

  return (
    <Layout style={{ height: '100%', overflowY: 'auto' }}>
      <Content
        style={{
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>
          体重记录追踪器
        </Title>

        {showSuccessAlert && (
          <Alert
            message="记录已保存"
            description="体重信息已成功添加到记录中"
            type="success"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 图片上传和识别区域 */}
          <Card title="上传并识别体重表" variant="borderless">
            <Paragraph>
              请上传包含体重、BMI、体脂率等信息的体重表图片，系统将自动识别并提取相关数据。
              建议图片清晰、文字水平且无反光。
            </Paragraph>

            <div
              style={{
                display: 'flex',
                gap: '20px',
                marginTop: '16px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, minWidth: '300px' }}>
                <Title level={5}>上传图片</Title>
                <ImageUploader
                  onImageSelected={handleImageSelected}
                  onImageRemoved={handleImageRemoved}
                />
              </div>

              <div style={{ flex: 1, minWidth: '300px' }}>
                <Title level={5}>图片识别</Title>
                <ImageRecognizer
                  imageData={selectedImage}
                  onRecognitionComplete={handleRecognitionComplete}
                />
              </div>
            </div>
          </Card>

          <Divider>体重记录</Divider>

          {/* 记录表格区域 */}
          <Card
            title={`历史记录 (${weightRecords.length.toString()})`}
            variant="borderless"
            style={{ marginBottom: '40px' }}
          >
            <RecordsTable
              records={weightRecords}
              onDeleteRecord={handleDeleteRecord}
            />
          </Card>
        </Space>
      </Content>
    </Layout>
  )
}

export default WeightTracker
