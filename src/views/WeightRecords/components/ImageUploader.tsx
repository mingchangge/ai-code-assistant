import { Upload, Button, Divider, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

interface ImageUploaderProps {
  selectedImage: string | null
  onImageChange: UploadProps['onChange']
}

const ImageUploader = ({
  selectedImage,
  onImageChange
}: ImageUploaderProps) => {
  // 上传配置：仅本地预览，阻止自动上传
  const uploadProps: UploadProps = {
    listType: 'picture',
    beforeUpload: () => false,
    onChange: onImageChange,
    maxCount: 1,
    accept: 'image/*',
    showUploadList: false
  }

  return (
    <div>
      <Space direction="vertical" size="large">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} size="large">
            选择图片
          </Button>
        </Upload>

        {/* 图片预览区域 */}
        {selectedImage && (
          <>
            <Divider orientation="left">图片预览</Divider>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img
                src={selectedImage}
                alt="身体指标预览"
                style={{
                  maxHeight: '400px',
                  maxWidth: '100%',
                  borderRadius: '8px',
                  border: '1px solid #eee'
                }}
              />
            </div>
          </>
        )}
      </Space>
    </div>
  )
}

export default ImageUploader
