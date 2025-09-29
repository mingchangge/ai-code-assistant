import { Spin, Typography } from 'antd'
import { SyncOutlined } from '@ant-design/icons'

const { Text } = Typography

interface LoadingSpinnerProps {
  visible: boolean
}

const LoadingSpinner = ({ visible }: LoadingSpinnerProps) => {
  if (!visible) return null

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 0',
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: '8px',
        margin: '20px 0'
      }}
    >
      <Spin indicator={<SyncOutlined spin size={16} />} size="large" />
      <Text style={{ display: 'block', marginTop: '16px', fontSize: '16px' }}>
        正在进行文本识别，请稍候...
      </Text>
    </div>
  )
}

export default LoadingSpinner
