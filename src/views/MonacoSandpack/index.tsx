import { useState } from 'react'
import {
  SandpackProvider,
  SandpackPreview,
  SandpackConsole
} from '@codesandbox/sandpack-react'
import EditorPanel from './EditorPanel'
import '@/styles/home.css'

type FileRecord = Record<string, string>

export default function Home() {
  const [files, setFiles] = useState<FileRecord>({
    'index.html': '<h1>等待生成…</h1>',
    'style.css': '',
    'index.js': ''
  })

  return (
    <SandpackProvider template="vanilla" files={files}>
      <div style={{ border: '1px solid #CCC' }}>
        <div className="flex-box">
          <div className="flex-1">
            <EditorPanel files={files} onChange={setFiles} />
          </div>
          <div className="flex-1">
            <SandpackPreview />
            {/* 有错误会直接打印 */}
            <SandpackConsole />
          </div>
        </div>
      </div>
    </SandpackProvider>
  )
}
