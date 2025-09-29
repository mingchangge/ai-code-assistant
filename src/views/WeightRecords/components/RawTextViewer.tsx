import { Card, Typography, Space } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

const { Text } = Typography

interface RawTextDisplayProps {
  ocrResult: string
}

const RawTextDisplay = ({ ocrResult }: RawTextDisplayProps) => {
  if (!ocrResult) return null

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined />
          <Text>原始识别文本</Text>
        </Space>
      }
      variant="outlined"
      style={{ marginTop: '24px' }}
    >
      <Text
        style={{
          padding: '16px',
          maxHeight: '300px',
          overflow: 'auto',
          borderRadius: '4px'
        }}
      >
        {ocrResult || '无识别文本'}
      </Text>
    </Card>
  )
}

export default RawTextDisplay
