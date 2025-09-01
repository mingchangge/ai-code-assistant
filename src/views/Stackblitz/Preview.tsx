import { useEffect, useRef, useState } from 'react'
import sdk from '@stackblitz/sdk'

interface PreviewProps {
  files: Record<string, string>
}

export default function Preview({ files }: PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  // 1. 节点真正渲染到页面后再嵌入
  useEffect(() => {
    setMounted(true)
  }, [])

  // 2. 节点已挂载 & files 变化时才重新嵌入
  useEffect(() => {
    if (!mounted || !containerRef.current) return

    // 先清空旧内容
    containerRef.current.innerHTML = ''

    void sdk.embedProject(
      containerRef.current,
      {
        title: 'edit in stackblitz',
        template: 'html',
        files
      },
      { height: '100%', openFile: 'index.html' }
    )
  }, [mounted, files])

  return <div ref={containerRef} style={{ height: '100%' }} />
}
