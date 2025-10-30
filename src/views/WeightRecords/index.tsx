import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, Typography, message, Row, Col, Spin, Tabs } from 'antd'
import Tesseract from 'tesseract.js'
import type { UploadProps } from 'antd'
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<string>('')
  const [parsedData, setParsedData] = useState<BodyMetrics | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false)
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false)
  const [records, setRecords] = useState<BodyMetricsRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(true)
  const historyRecordsRef = useRef<HistoryRecordsRef>(null)

  // 页面初始化：加载历史记录
  useEffect(() => {
    const loadRecords = async () => {
      try {
        setLoadingRecords(true)
        const dbRecords = await getAllRecordsFromDB()
        setRecords(dbRecords)
        console.log('加载历史记录:', dbRecords)
      } catch (err) {
        message.error('加载历史记录失败')
        console.error('加载历史记录失败:', err)
      } finally {
        setLoadingRecords(false)
      }
    }
    void loadRecords()
  }, [])

  // 处理图片上传
  const handleImageChange: UploadProps['onChange'] = info => {
    if (info.fileList.length > 0) {
      const file = info.fileList[info.fileList.length - 1]
      if (file.originFileObj) {
        setSelectedImage(URL.createObjectURL(file.originFileObj))
        setOcrResult('')
        setParsedData(null)
        setProgress(0)
      }
    }
  }

  // 解析OCR识别结果
  const parseOcrText = useCallback((text: string): BodyMetrics => {
    const data: BodyMetrics = {
      date: '',
      weight: undefined,
      bmi: undefined,
      bodyFatRate: undefined,
      waterRate: undefined,
      skeletalMuscleRate: undefined,
      boneRatio: undefined,
      proteinRate: undefined,
      muscleRate: undefined,
      visceralFatIndex: undefined,
      subcutaneousFat: undefined,
      leanBodyMass: undefined,
      bodyAge: undefined,
      basalMetabolism: undefined,
      activeMetabolism: undefined,
      targetWeight: undefined,
      weightControl: undefined,
      fatControl: undefined,
      muscleControl: undefined,
      bodyType: ''
    }

    // 关键字映射表
    const keywordMap: Record<string, keyof BodyMetrics> = {
      体重: 'weight',
      BMl: 'bmi', // 兼容可能的OCR识别错误
      BMI: 'bmi',
      体脂率: 'bodyFatRate',
      水分率: 'waterRate',
      骨骼肌率: 'skeletalMuscleRate',
      骨骼率: 'boneRatio',
      蛋白质率: 'proteinRate',
      肌肉率: 'muscleRate',
      内脏脂肪指数: 'visceralFatIndex',
      皮下脂肪: 'subcutaneousFat',
      去脂体重: 'leanBodyMass',
      身体年龄: 'bodyAge',
      基础代谢: 'basalMetabolism',
      活动代谢: 'activeMetabolism',
      建议体重: 'targetWeight',
      目标体重: 'targetWeight',
      体重控制: 'weightControl',
      脂肪控制: 'fatControl',
      肌肉控制: 'muscleControl',
      体型: 'bodyType'
    }

    // 提取数字
    const matchNumber = (str: string): number | undefined => {
      // 预处理：去除所有空格和非数字相关的特殊字符
      const cleaned = str.replace(/[^\d.-]/g, '')
      // 处理可能的多个小数点（只保留第一个）
      const dotIndex = cleaned.indexOf('.')
      const normalized =
        dotIndex !== -1
          ? cleaned.substring(0, dotIndex + 1) +
            cleaned.substring(dotIndex + 1).replace(/\./g, '')
          : cleaned

      const regex = /-?\d+(\.\d+)?/
      const match = regex.exec(normalized)

      if (match) {
        const num = parseFloat(match[0])
        return isNaN(num) ? undefined : num
      }
      return undefined
    }

    const lines = text.split('\n')

    lines.forEach(line => {
      const cleanLine = line.replace(/\s+/g, '')

      // 提取日期
      const dateMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(cleanLine)
      if (!data.date && dateMatch) {
        data.date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
      } else if (!data.date) {
        // 尝试匹配 月/日 格式
        const monthDayMatch = /(\d{2})月(\d{2})日/.exec(cleanLine)
        if (monthDayMatch) {
          const year = new Date().getFullYear()
          data.date = `${year.toString()}-${monthDayMatch[1]}-${monthDayMatch[2]}`
        }
      }

      // 匹配关键字并提取数据
      for (const keyword in keywordMap) {
        if (cleanLine.startsWith(keyword)) {
          const dataKey = keywordMap[keyword]
          const valueStr = cleanLine.substring(keyword.length)

          if (dataKey === 'bodyType') {
            data.bodyType = valueStr.replace(/型$/, '').trim() + '型'
          } else {
            let value = matchNumber(valueStr)

            if (value !== undefined) {
              // 数据清洗与纠错
              if (dataKey === 'bmi' && value > 50) {
                value /= 10 // 处理可能的小数点识别错误
              }
              if (
                (String(dataKey).includes('Rate') ||
                  String(dataKey).includes('率')) &&
                value > 100
              ) {
                value /= 10 // 处理百分比可能的识别错误
              }
              data[dataKey] = value
            }
          }
          break
        }
      }
    })
    console.log('data', data)
    return data
  }, [])

  // 处理识别操作
  const handleRecognize = useCallback(() => {
    if (!selectedImage) {
      message.warning('请先上传图片')
      return
    }

    setIsRecognizing(true)
    setProgress(0)
    setOcrResult('')
    setParsedData(null)

    Tesseract.recognize(selectedImage, 'chi_sim', {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.floor(m.progress * 100))
        }
      }
    })
      .then(({ data: { text } }) => {
        setOcrResult(text)
        const parsed = parseOcrText(text)
        setParsedData(parsed)
        message.success('识别成功')
      })
      .catch((err: unknown) => {
        console.error('识别失败:', err instanceof Error ? err.message : err)
        message.error('识别失败，请重试')
      })
      .finally(() => {
        setIsRecognizing(false)
        setProgress(100)
      })
  }, [selectedImage, parseOcrText])

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
        padding: '24px',
        overflowY: 'auto'
      }}
    >
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            <ImageUploader
              selectedImage={selectedImage}
              onImageChange={handleImageChange}
            />
            <div style={{ marginTop: '24px' }}>
              <RecognitionController
                isRecognizing={isRecognizing}
                progress={progress}
                hasImage={!!selectedImage}
                onRecognize={handleRecognize}
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
