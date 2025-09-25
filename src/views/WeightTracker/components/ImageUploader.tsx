import { useState, useRef, type ChangeEvent } from 'react'
import { Button, Card, message, Image, Typography } from 'antd'
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface ImageUploaderProps {
  onImageSelected: (imageData: string) => void
  onImageRemoved: () => void
  disabled?: boolean
}

const ImageUploader = ({
  onImageSelected,
  onImageRemoved,
  disabled = false
}: ImageUploaderProps) => {
  const [imageData, setImageData] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      event.target.value = ''
      return
    }

    // 验证文件大小（限制10MB以内）
    if (file.size > 10 * 1024 * 1024) {
      message.error('图片大小不能超过10MB')
      event.target.value = ''
      return
    }

    // 读取图片
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setImageData(dataUrl)
      onImageSelected(dataUrl)
    }

    reader.onerror = () => {
      message.error('图片读取失败，请重试')
    }

    reader.readAsDataURL(file)
  }

  const handleUploadClick = (): void => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveImage = (): void => {
    setImageData(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageRemoved()
  }

  return (
    <Card
      variant="outlined"
      style={{
        height: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {imageData ? (
        <div style={{ width: '100%', position: 'relative' }}>
          <Image
            src={imageData}
            alt="体重表预览"
            preview={false}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              border: '1px solid #e8e8e8',
              borderRadius: '4px'
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleRemoveImage}
            disabled={disabled}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Button
              onClick={handleUploadClick}
              disabled={disabled}
              size="middle"
            >
              更换图片
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '200px',
            border: '2px dashed #e8e8e8',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
          onClick={handleUploadClick}
        >
          <UploadOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={5} style={{ marginTop: '16px', marginBottom: '8px' }}>
            选择图片
          </Title>
          <Text type="secondary">支持 JPG、PNG 格式，建议图片清晰无遮挡</Text>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg, image/png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled}
          />
        </div>
      )}
    </Card>
  )
}

export default ImageUploader
