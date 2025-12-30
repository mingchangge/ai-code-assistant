import { useState } from 'react'
import { Button, Progress, Space, message } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import type { BodyMetrics } from './types'
import Tesseract from 'tesseract.js'

interface RecognitionControllerProps {
  isRecognizing: boolean
  selectedImage: string | null
  sendRecognizedData: (data: {
    rawText: string
    parsedData: BodyMetrics
  }) => void
  sendIsRecognizing: (isRecognizing: boolean) => void
}

const RecognitionController = ({
  isRecognizing,
  selectedImage,
  sendRecognizedData,
  sendIsRecognizing
}: RecognitionControllerProps) => {
  const [progress, setProgress] = useState<number>(0)

  // 解析OCR文本
  const parseOcrText = (text: string) => {
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
  }
  // 处理识别操作
  const onRecognize = () => {
    setProgress(0)
    if (!selectedImage) {
      message.warning('请先上传图片')
      return
    }

    // 发送识别开始信号
    sendIsRecognizing(true)

    // 调用Tesseract.js进行识别
    Tesseract.recognize(selectedImage, 'chi_sim', {
      logger: m => {
        if (m.status === 'recognizing text') {
          setProgress(Math.floor(m.progress * 100))
        }
      }
    })
      .then(({ data: { text } }) => {
        const parsed = parseOcrText(text)
        sendRecognizedData({ rawText: text, parsedData: parsed })
        message.success('识别成功')
      })
      .catch((err: unknown) => {
        console.error('识别失败:', err instanceof Error ? err.message : err)
        message.error('识别失败，请重试')
      })
      .finally(() => {
        sendIsRecognizing(false)
        setProgress(100)
      })
  }
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={isRecognizing ? <SyncOutlined spin /> : undefined}
          onClick={onRecognize}
          disabled={!selectedImage || isRecognizing}
        >
          {isRecognizing ? `识别中... ${progress.toString()}%` : '开始识别'}
        </Button>
      </div>

      {/* 进度条：仅在识别中显示 */}
      {isRecognizing && (
        <Progress
          percent={progress}
          status={progress === 100 ? 'success' : 'active'}
        />
      )}
    </Space>
  )
}

export default RecognitionController
