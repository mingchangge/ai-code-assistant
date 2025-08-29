import { useState } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole
} from '@codesandbox/sandpack-react'
import { Flex } from 'antd'
import EditorPanel from './EditorPanel'
import styled from 'styled-components'
import getThemeStyles from '@/utils/getThemeStyles'

type FileRecord = Record<string, string>

const themeStyles = getThemeStyles()
const StyledFlex = styled.div`
  .code-box {
    height: calc(100vh - 238px);
    border: 1px solid ${themeStyles.borderColor};
    .flex-1 {
      flex: 1;
      min-width: 0;
      width: 50%;
      height: 100%;
      /* 默认占据一半宽度 */
      border-inline-end: 1px solid ${themeStyles.borderColor};
      &:last-child {
        border-inline-end: none;
      }
      .editor-panel {
        width: 100%;
        height: 100%;
        text-align: left;
        .editor-tabs {
          background-color: #f3f4f6;
          /* 浅灰背景 */
          color: #374151;
          /* 深灰文字 */
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid ${themeStyles.borderColor};
        }

        .editor-tabs button {
          padding: 0.5rem 0.75rem;
          border: none;
          background: transparent;
          font-size: 0.875rem;
          cursor: pointer;
          border-radius: 0.25rem;
          transition: background-color 0.15s;
        }

        .editor-tabs button.bg-gray-900 {
          background-color: #e5e7eb;
          /* 当前页签高亮 */
          font-weight: 600;
        }
        .editor-box {
          padding: 0;
          height: calc(100% - 49px);
          background-color: #f9fafb;
          /* 浅灰背景 */
          border-radius: 0;
          /* 圆角 */
          overflow-y: auto;
          /* 滚动条 */
        }
      }
    }
    .flex-vertical {
      width: 100%;
      height: 50%;
      &:last-child {
        border-block-start: 1px solid ${themeStyles.borderColor};
      }
      .sp-stack {
        height: 100%;
      }
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
    'index.js': 'console.log("Hello!");'
  })

  return (
    <StyledFlex>
      <SandpackProvider template="vanilla" files={files}>
        <Flex wrap="nowrap" className="code-box">
          <div className="flex-1">
            <EditorPanel files={files} onChange={setFiles} />
          </div>
          <Flex wrap className="flex-1">
            <div className="flex-vertical">
              <SandpackPreview />
            </div>
            <div className="flex-vertical">
              {/* 有错误会直接打印 */}
              <SandpackConsole />
            </div>
          </Flex>
        </Flex>
      </SandpackProvider>
    </StyledFlex>
  )
}
