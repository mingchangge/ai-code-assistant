import Editor from '@monaco-editor/react'
import { LiveProvider, LivePreview, LiveError } from 'react-live'

// 代码预览组件属性
interface PreviewProps {
  code: string
  onChange: (code: string) => void
}
// 包装代码，用于 react-live 预览
const wrapForLive = (raw: string) => {
  const body = raw.replace(/```(tsx?|jsx?)?\n([\s\S]*?)```/, '$2').trim()
  // 如果已经写了 export default，直接包 render
  if (body.startsWith('export default')) {
    return (
      body.replace('export default', 'const __LiveComponent =') +
      '\nrender(<__LiveComponent />);'
    )
  }
  // 如果只写了函数声明，直接包
  return `${body} render(<Example />); `
}
export default function CodePreview({ code, onChange }: PreviewProps) {
  return (
    <>
      <div className="grid-item">
        <Editor
          className="code-editor"
          language="javascript"
          value={code}
          onChange={value => {
            if (!value) return
            onChange(value)
          }}
        />
      </div>
      <div className="grid-item code-preview">
        <h3>预览</h3>
        <LiveProvider code={wrapForLive(code)} noInline>
          <LiveError />
          <LivePreview />
        </LiveProvider>
      </div>
    </>
  )
}
