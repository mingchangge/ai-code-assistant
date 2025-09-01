import { useState } from 'react'
import Preview from './Preview'
import styled from 'styled-components'
import getThemeStyles from '@/utils/getThemeStyles'

type FileRecord = Record<string, string>

const themeStyles = getThemeStyles()
const StyledBox = styled.div`
  .code-box {
    height: calc(100vh - 168px);
    border: 1px solid ${themeStyles.borderColor};
    .sp-wrapper,
    .sp-layout,
    .sp-stack {
      height: 100% !important;
    }
    .sp-preview-container {
      border-left: 1px solid ${themeStyles.borderColor};
    }
  }
`

export default function Sandpack() {
  const [files] = useState<FileRecord>({
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
    'index.js': 'console.log("Hello!");'
  })

  return (
    <StyledBox>
      <div className="code-box">
        <Preview files={files} />
      </div>
    </StyledBox>
  )
}
