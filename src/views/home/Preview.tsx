import { useRef, useEffect } from 'react'
// import MonacoEditor from 'monaco-editor'
import MonacoEditor from '@monaco-editor/react'

export default function Preview({ files }: { files: Record<string, string> }) {
  const editorRef = useRef(null)

  useEffect(() => {
    const editor = MonacoEditor.create(editorRef.current, {
      value: files['index.js'] || '',
      language: 'javascript',
      theme: 'vs-dark'
    })

    return () => {
      editor.dispose()
    }
  }, [files])

  return <div ref={editorRef} style={{ width: '100%', height: '100%' }} />
}
