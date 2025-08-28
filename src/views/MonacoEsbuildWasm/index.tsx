import { useState, useCallback } from 'react'
import PromptBox from './components/PromptBox'
import MonacoEditor from './components/MonacoEditor'
import CodePreview from './components/CodePreview'
import '@/styles/home.css'

type FileRecord = Record<string, string>
export default function Home() {
  const [files, setFiles] = useState<FileRecord>({
    'index.html': `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Spark</title>
          <link rel="stylesheet" href="./style.css" />
        </head>
        <body>
          <h1>等待生成…</h1>
        </body>
      </html>`,
    'style.css': 'body{margin:0;font-family:sans-serif;background:#fafafa}',
    'index.js': 'console.log("Hello Spark");'
  })

  const handleFiles = useCallback((next: FileRecord) => {
    setFiles(next)
  }, [])

  return (
    <div>
      <PromptBox onFiles={handleFiles} />
      <div className="flex-box">
        <div className="flex-1">
          {/* 左侧编辑面板 */}
          <MonacoEditor files={files} onFilesChange={handleFiles} />
        </div>
        <div className="flex-1">
          {/* 右侧预览 */}
          <CodePreview files={files} />
        </div>
      </div>
    </div>
  )
}
