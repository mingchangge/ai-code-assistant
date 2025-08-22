import { useState } from 'react'
import { askSpark } from './spark'

interface PromptBoxProps {
  onFiles: (files: Record<string, string>) => void
}

export default function PromptBox({ onFiles }: PromptBoxProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      const system =
        '你是资深前端工程师，只回答三段代码，格式：先```html（完整HTML）```再```css（完整CSS）```最后```js（完整JS）```，不要其它文字。'

      // 3. 组合成一条完整 prompt
      const fullPrompt = `${system}\n需求：${prompt}`
      const res = await askSpark(fullPrompt)
      console.log('AI 返回原始数据:', res)
      try {
        const { html, css, js } = extractBlocks(res)
        console.log('AI 返回:', { html, css, js })
        onFiles({ 'index.html': html, 'style.css': css, 'index.js': js })
      } catch {
        console.error('AI 返回格式异常:', res)
        alert('AI 返回格式异常')
      }
    } catch (error) {
      console.error('Error during AI request:', error)
      alert('AI 请求失败，请稍后再试。')
      return
    } finally {
      setLoading(false)
    }
  }

  return (
    <header>
      <input
        type="text"
        placeholder="写一个带动画的登录表单"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle()}
      />
      <button onClick={handle} disabled={loading}>
        {loading ? '生成中…' : '星火生成'}
      </button>
    </header>
  )
}
// 解析 AI 返回的 JSON 字符串
function extractBlocks(raw: string): {
  html: string
  css: string
  js: string
} {
  const map: Record<'html' | 'css' | 'js', string> = {
    html: '',
    css: '',
    js: ''
  }

  const regex = /```(html|css|js)\s*\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(raw)) !== null) {
    const key = match[1] as keyof typeof map
    map[key] = match[2].trim()
  }

  return map
}
