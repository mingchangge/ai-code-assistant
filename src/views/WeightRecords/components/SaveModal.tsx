import { Modal, Button, Typography, message } from 'antd'
import type { BodyMetrics } from './types'

const { Text } = Typography

interface SaveModalProps {
  visible: boolean
  metricsData: BodyMetrics | null
  onCancel: () => void
  onConfirmSave: () => void
}

const SaveModal = ({
  visible,
  metricsData,
  onCancel,
  onConfirmSave
}: SaveModalProps) => {
  // 模拟保存逻辑（可替换为API请求）
  const handleSave = () => {
    if (!metricsData) {
      message.warning('无有效数据可保存')
      return
    }

    onConfirmSave()
  }

  return (
    <Modal
      title="保存身体指标数据"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          确认保存
        </Button>
      ]}
      destroyOnHidden={true}
    >
      <div>
        <Text>请确认以下数据是否正确，确认后将保存至系统：</Text>
        <div style={{ marginTop: '16px' }}>
          <p>
            <strong>日期：</strong>
            {metricsData?.date ?? '未设置'}
          </p>
          <p>
            <strong>体重：</strong>
            {metricsData?.weight ?? '未识别'}
          </p>
          <p>
            <strong>BMI：</strong>
            {metricsData?.bmi ?? '未识别'}
          </p>
          <p>
            <strong>体型：</strong>
            {metricsData?.bodyType ?? '未识别'}
          </p>
        </div>
      </div>
    </Modal>
  )
}

export default SaveModal
