import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, Typography, message, Row, Col, Spin, Tabs } from 'antd'
import type {
  BodyMetrics,
  BodyMetricsRecord,
  TableItem
} from './components/types'
import { addRecordToDB, getAllRecordsFromDB } from '@/utils/indexedDbHandler'

// 导入子组件
import ImageUploader from './components/ImageUploader'
import RecognitionController from './components/RecognitionController'
import LoadingSpinner from './components/LoadingSpinner'
import MetricsTable from './components/MetricsTable'
import RawTextDisplay from './components/RawTextViewer'
import SaveModal from './components/SaveModal'
import HistoryRecords, {
  type HistoryRecordsRef
} from './components/HistoryRecords'
import HistoryEcharts from './components/HistoryEcharts'

const { Title, Paragraph, Text } = Typography

const ImageRecognition = () => {
  // 状态管理
  const [loadingRecords, setLoadingRecords] = useState(true)
  const historyRecordsRef = useRef<HistoryRecordsRef>(null)
  const [records, setRecords] = useState<BodyMetricsRecord[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string>('')
  const [parsedData, setParsedData] = useState<BodyMetrics | null>(null)
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)

  // 页面初始化：加载历史记录
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoadingRecords(true)
        const dbRecords = await getAllRecordsFromDB()
        setRecords(dbRecords)
      } catch (err) {
        message.error('加载历史记录失败')
        console.error('加载历史记录失败:', err)
      } finally {
        setLoadingRecords(false)
      }
    }
    void loadRecords()
  }, [])

  // 处理图片上传后的数据
  const handleImageData = useCallback((imageUrl: string) => {
    console.log('收到图片数据:', imageUrl)
    setSelectedImage(imageUrl)
    setOcrResult('')
    setParsedData(null)
  }, [])
  // 处理识别数据
  const handleRecognizedData = ({
    rawText,
    parsedData
  }: {
    rawText: string
    parsedData: BodyMetrics
  }) => {
    // 接收原始识别数据
    setOcrResult(rawText)
    // 接收解析后的数据
    setParsedData(parsedData)
  }
  // 处理编辑保存
  const handleSaveEdit = (updatedTableData: TableItem[]) => {
    if (!parsedData) return

    // 1. 更新当前识别结果
    const updatedData = { ...parsedData }
    updatedTableData.forEach(item => {
      updatedData[item.key] = item.value
    })
    setParsedData(updatedData)

    // 2. 打开保存确认弹窗
    setSaveModalVisible(true)
  }

  // 确认保存到数据库
  const confirmSaveToDB = async () => {
    if (!parsedData) return

    try {
      await addRecordToDB(parsedData)
      // 刷新记录列表
      if (historyRecordsRef.current) {
        await historyRecordsRef.current.refreshRecords()
      }
      message.success('记录已保存')
      setSaveModalVisible(false)
    } catch (err) {
      message.error('保存记录失败')
      console.error('保存记录失败:', err)
    }
  }

  // 准备表格数据
  const tableData = parsedData
    ? Object.entries(parsedData).map(([key, value]) => ({
        key: key as keyof BodyMetrics,
        value
      }))
    : []

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        margin: '0 auto',
        padding: '0 24px 24px',
        overflowY: 'auto'
      }}
    >
      <Title level={2} style={{ textAlign: 'center', marginBottom: '12px' }}>
        体重记录
      </Title>

      {/* 历史记录数据管理（放在标题下方） */}
      <div style={{ marginBottom: '32px' }}>
        {loadingRecords ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <Text style={{ marginLeft: 8 }}>加载历史记录中...</Text>
          </div>
        ) : (
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                label: '历史数据记录',
                key: '1',
                children: (
                  <HistoryRecords
                    ref={historyRecordsRef}
                    records={records}
                    onRecordsChange={setRecords}
                  />
                )
              },
              {
                label: '历史数据图表',
                key: '2',
                children: <HistoryEcharts records={records} />
              }
            ]}
          />
        )}
      </div>
      {/* 上传识别与结果展示区 */}
      <Row gutter={[24, 24]}>
        {/* 左侧：上传与识别区 */}
        <Col xs={24} md={10}>
          <Card title="上传与识别" variant="outlined">
            <Paragraph>
              请上传包含身体指标数据的图片（如体脂秤显示界面），系统将自动识别信息。
            </Paragraph>
            <ImageUploader sendImageData={handleImageData} />
            <div style={{ marginTop: '24px' }}>
              <RecognitionController
                isRecognizing={isRecognizing}
                selectedImage={selectedImage}
                sendRecognizedData={handleRecognizedData}
                sendIsRecognizing={setIsRecognizing}
              />
            </div>
          </Card>
        </Col>

        {/* 右侧：结果展示区 */}
        <Col xs={24} md={14}>
          <Card title="识别结果" variant="outlined">
            <LoadingSpinner visible={isRecognizing} />

            {parsedData && !isRecognizing && (
              <MetricsTable tableData={tableData} onSaveEdit={handleSaveEdit} />
            )}

            {!parsedData && !isRecognizing && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <Paragraph type="secondary">识别结果将显示在这里</Paragraph>
              </div>
            )}
          </Card>

          {/* 原始文本展示 */}
          <RawTextDisplay ocrResult={ocrResult} />
        </Col>
      </Row>

      {/* 保存弹窗 */}
      <SaveModal
        visible={saveModalVisible}
        metricsData={parsedData}
        onCancel={() => {
          setSaveModalVisible(false)
        }}
        onConfirmSave={() => void confirmSaveToDB()}
      />
    </div>
  )
}

export default ImageRecognition
