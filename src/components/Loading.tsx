import { Spin, Space } from 'antd'

const Loading = () => (
  <Space
    size="middle"
    style={{ display: 'block', margin: '20px auto', textAlign: 'center' }}
  >
    <Spin size="large" />
  </Space>
)

export default Loading
