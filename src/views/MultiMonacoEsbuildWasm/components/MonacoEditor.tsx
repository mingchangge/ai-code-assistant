import { useEffect, useRef, useState } from 'react'
import * as monaco from 'monaco-editor'
import { formatCode } from '@/utils/format'

interface MonacoEditorProps {
  files: Record<string, string>
  onFilesChange: (next: Record<string, string>) => void
}

export default function MonacoEditor({
  files,
  onFilesChange
}: MonacoEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [activeFile, setActiveFile] = useState(() => Object.keys(files)[0])

  /* 1. 保存最新 files，避免放到 useEffect 依赖里 */
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  /* 2. 只在挂载时创建一次编辑器 */
  useEffect(() => {
    if (!containerRef.current) return
    editorRef.current = monaco.editor.create(containerRef.current, {
      value: '',
      automaticLayout: true,
      theme: 'vs-dark',
      minimap: { enabled: true },
      glyphMargin: false,
      lineNumbers: 'on',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      folding: true,
      language: 'html'
    })
    return () => editorRef.current?.dispose()
  }, [])

  /* 3. 记录「由编辑器自身触发的内容」，防止死循环 */
  const lastEmittedRef = useRef<string>('')

  /* 4. 负责：
        • activeFile 变化时切文件
        • 父组件 files 变化时把最新内容同步到编辑器
        • 监听用户输入并回传
  */
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const ac = new AbortController()

    void (async () => {
      const newLang = activeFile.endsWith('.html')
        ? 'html'
        : activeFile.endsWith('.css')
          ? 'css'
          : 'javascript'

      const contentFromProps = files[activeFile] ?? ''

      /* 如果父组件传来的内容和编辑器里一致（或刚刚由我们自己 emit），直接跳过 */
      const currentModel = editor.getModel()
      if (currentModel?.getValue() === contentFromProps) return

      /* 否则需要同步到编辑器 */
      const formatted = await formatCode(contentFromProps, newLang)
      if (ac.signal.aborted) return

      /* 1. 销毁旧 model */
      currentModel?.dispose()

      /* 2. 创建并设置新 model */
      const newModel = monaco.editor.createModel(formatted, newLang)
      editor.setModel(newModel)

      /* 3. 立即格式化一次（可选） */
      void editor.getAction('editor.action.formatDocument')?.run()

      /* 4. 监听用户输入 */
      const disposable = newModel.onDidChangeContent(() => {
        const newVal = newModel.getValue()
        lastEmittedRef.current = newVal // 记录：这次更新来自编辑器内部
        onFilesChange({ ...filesRef.current, [activeFile]: newVal })
      })

      return () => {
        disposable.dispose()
        newModel.dispose()
      }
    })()

    return () => {
      ac.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile, files]) // 现在需要把 files 放到依赖里，但内部会做 diff 防止死循环
  /* 注意：files 变化时，如果 activeFile 没变，也只会更新当前文件的内容 */

  return (
    <div className="editor-panel">
      {/* 文件 Tab */}
      <div
        style={{ display: 'flex', gap: 8, padding: 8, background: '#1e1e1e' }}
      >
        {Object.keys(files).map(f => (
          <button
            key={f}
            onClick={() => {
              setActiveFile(f)
            }}
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
      <div
        ref={containerRef}
        style={{ width: '100%', height: 'calc(100% - 47px)' }}
      />
    </div>
  )
}
