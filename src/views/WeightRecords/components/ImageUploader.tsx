import { useState } from 'react'
import { Upload, Button, Divider, Space, Image } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'

interface ImageUploaderProps {
  sendImageData: (imageUrl: string) => void
}

const ImageUploader = ({ sendImageData }: ImageUploaderProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  // 处理图片上传
  const handleImageChange: UploadProps['onChange'] = info => {
    if (info.fileList.length > 0) {
      const file = info.fileList[info.fileList.length - 1]
      if (file.originFileObj) {
        setSelectedImage(URL.createObjectURL(file.originFileObj))
        // 发送图片数据到父组件
        sendImageData(URL.createObjectURL(file.originFileObj))
      }
    }
  }
  // 上传配置：仅本地预览，阻止自动上传
  const uploadProps: UploadProps = {
    listType: 'picture',
    beforeUpload: () => false,
    onChange: handleImageChange,
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
              <Image
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
