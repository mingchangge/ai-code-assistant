import { Button, Progress, Space } from 'antd'
import { SyncOutlined } from '@ant-design/icons'

interface RecognitionControllerProps {
  isRecognizing: boolean
  progress: number
  hasImage: boolean
  onRecognize: () => void
}

const RecognitionController = ({
  isRecognizing,
  progress,
  hasImage,
  onRecognize
}: RecognitionControllerProps) => {
  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          type="primary"
          size="large"
          icon={isRecognizing ? <SyncOutlined spin /> : undefined}
          onClick={onRecognize}
          disabled={!hasImage || isRecognizing}
        >
          {isRecognizing ? `识别中... ${progress.toString()}%` : '开始识别'}
        </Button>
      </div>

      {/* 进度条：仅在识别中显示 */}
      {isRecognizing && (
        <Progress
          percent={progress}
          status={progress === 100 ? 'success' : 'active'}
          strokeWidth={8}
        />
      )}
    </Space>
  )
}

export default RecognitionController
