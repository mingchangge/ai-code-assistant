import { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'

import { formatCode } from '@/utils/format'

interface MonacoEditorProps {
  files: Record<string, string>
  onFilesChange: (next: Record<string, string>) => void
}

// 编辑器
export default function MonacoEditor({
  files,
  onFilesChange
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [activeFile, setActiveFile] = useState(Object.keys(files)[0])

  /* 用 ref 保存最新的 files，避免放到 useEffect 依赖里 */
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  /* 1. 只在挂载时创建一次编辑器 */
  useEffect(() => {
    if (!containerRef.current) return

    editorRef.current = monaco.editor.create(containerRef.current, {
      value: '', // 初始值为空
      automaticLayout: true, // 自动调整大小
      theme: 'vs-dark', // 暗色主题
      minimap: { enabled: true }, // 开启小地图
      glyphMargin: false, // 关闭字形边距
      lineNumbers: 'on', // 显示行号
      wordWrap: 'on', // 开启换行
      scrollBeyondLastLine: false, // 禁止滚动到最后一行之后
      folding: true, // 开启代码折叠
      language: 'html' // 初始语言
    })

    return () => editorRef.current?.dispose()
  }, [])

  // 只在「activeFile」变化时执行，且保证编辑器存活
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // 用 AbortController 防止组件卸载后仍执行
    const ac = new AbortController()

    void (async () => {
      const newLang = activeFile.endsWith('.html')
        ? 'html'
        : activeFile.endsWith('.css')
          ? 'css'
          : 'javascript'

      const formatted = await formatCode(files[activeFile] ?? '', newLang)
      if (ac.signal.aborted) return // 组件已卸载

      // 1. 旧 model 存在就 dispose
      editor.getModel()?.dispose()

      // 2. 创建并设置新 model
      const newModel = monaco.editor.createModel(formatted, newLang)
      editor.setModel(newModel)

      // 3. 立即格式化一次（可选）
      void editor.getAction('editor.action.formatDocument')?.run()

      // 4. 监听 model 变化
      const disposable = newModel.onDidChangeContent(() => {
        onFilesChange({ ...files, [activeFile]: newModel.getValue() })
      })

      return () => {
        disposable.dispose()
        newModel.dispose()
      }
    })()

    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]) // 只依赖 activeFile，不依赖 files（用 ref 拿最新值）

  return (
    <div className="editor-panel">
      {/* 文件 Tab */}
      <div
        style={{ display: 'flex', gap: 8, padding: 8, background: '#1e1e1e' }}
      >
        {Object.keys(files).map(f => (
          <button
            key={f}
            onClick={() => setActiveFile(f)}
            style={{
              padding: '4px 8px',
              background: activeFile === f ? '#0e639c' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: 4
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 编辑器容器 */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
