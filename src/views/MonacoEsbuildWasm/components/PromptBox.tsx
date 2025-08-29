import { useState } from 'react'
import { Button, Flex, Input } from 'antd'
import { askSpark, assemble } from '@/utils/spark'

interface PromptBoxProps {
  onFiles: (files: Record<string, string>) => void
}

export default function PromptBox({ onFiles }: PromptBoxProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    try {
      const raw = await askSpark(
        `请严格按照以下格式要求返回代码:
          1. 单段格式（≤1000字符）: {"type":"single","lang":"js","code":{"html":"...","css":"...","js":"..."},"code_length":number,"js_sha256":"..."}
          2. 多段格式（>1000字符）: {"type":"multi","lang":"js","code_part":number,"code_total_parts":number,"chunk":"...","js_sha256":"..."}
          3. code 字段为 JSON 字符串，内含 html、css、js 三个键；当总长度>1000 时，按 html→css→js 顺序依次拆分，每段≤1000 字符，未用到的键留空字符串。
          4. 确保JSON语法正确，转义字符使用恰当
          5. 只返回JSON内容，不包含其他解释文本
          用户需求: ${prompt}
          注意：请务必严格按照上述格式返回，确保JSON语法正确且无多余内容
        `.trim()
      )
      const map = await assemble(raw)
      onFiles({
        'index.html': map.html,
        'style.css': map.css,
        'index.js': map.js
      })
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : '生成失败')
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
        onPressEnter={() => {
          void handle()
        }}
      />
      <Button type="primary" onClick={() => void handle()} disabled={loading}>
        {loading ? '生成中…' : '星火生成'}
      </Button>
    </Flex>
  )
}
