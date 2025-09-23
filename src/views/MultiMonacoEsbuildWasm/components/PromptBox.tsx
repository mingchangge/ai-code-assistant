import { useState } from 'react'
import { Button, Flex, Input } from 'antd'
import { assembleStream } from '@/utils/sparkMulti'

interface PromptBoxProps {
  onFiles: (files: Record<string, string>) => void
}

export default function PromptBox({ onFiles }: PromptBoxProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  /* 拉取完整代码：支持多轮 */
  const pullAll = async () => {
    console.log('用户需求：', prompt)
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const { html, css, js } = await assembleStream(prompt) // ← 换这个方法
      onFiles({ 'index.html': html, 'style.css': css, 'index.js': js })
    } catch (err: unknown) {
      console.error(err)
      alert((err as Error).message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex gap="small" wrap="nowrap" className="prompt-box">
      <Input
        type="text"
        placeholder="写一个带动画的登录表单"
        value={prompt}
        onChange={e => {
          setPrompt(e.target.value)
        }}
        onPressEnter={() => void pullAll()}
        disabled={loading}
      />
      <Button type="primary" onClick={() => void pullAll()} disabled={loading}>
        {loading ? '生成中…' : '星火生成'}
      </Button>
    </Flex>
  )
}
