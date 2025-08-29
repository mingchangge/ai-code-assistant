import { useState, useCallback } from 'react'
import { Flex } from 'antd'
import PromptBox from './components/PromptBox'
import MonacoEditor from './components/MonacoEditor'
import CodePreview from './components/CodePreview'
import styled from 'styled-components'

type FileRecord = Record<string, string>
// 样式
const StyledCodeBox = styled.div`
  .code-box {
    height: calc(100vh - 238px);
  }
  .prompt-box {
    margin: 1rem 0 1.4rem;
  }
  .flex-1 {
    flex: 1;
    min-width: 0;
    width: 50%;
    height: 100%;
    /* 默认占据一半宽度 */

    .editor-panel {
      width: 100%;
      height: 100%;
    }
  }
`
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
    <StyledCodeBox>
      <PromptBox onFiles={handleFiles} />
      <Flex gap="small" wrap="nowrap" className="code-box">
        <div className="flex-1">
          {/* 左侧编辑面板 */}
          <MonacoEditor files={files} onFilesChange={handleFiles} />
        </div>
        <div className="flex-1">
          {/* 右侧预览 */}
          <CodePreview files={files} />
        </div>
      </Flex>
    </StyledCodeBox>
  )
}
