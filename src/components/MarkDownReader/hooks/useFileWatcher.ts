import { useEffect, useRef } from 'react'

/**
 * 文件监控hook - 使用内容长度比较的可靠方式
 */
export const useFileWatcher = (
  fileName: string,
  docsPath: string,
  onFileChange: () => void,
  checkInterval = 3000
) => {
  const lastContentLengthRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 创建新的AbortController用于取消网络请求
    abortControllerRef.current = new AbortController()

    // 初始化获取文件内容长度
    const initFileInfo = async () => {
      try {
        const response = await fetch(`${docsPath}/${fileName}`, {
          signal: abortControllerRef.current?.signal
        })
        if (response.ok) {
          const content = await response.text()
          lastContentLengthRef.current = content.length
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('初始化文件监控失败:', error.message)
        }
      }
    }

    void initFileInfo()

    // 设置定时检查 - 使用内容长度比较
    const checkFileChange = async () => {
      // 检查是否已经被取消
      if (abortControllerRef.current?.signal.aborted) {
        return
      }
      try {
        const response = await fetch(`${docsPath}/${fileName}`, {
          signal: abortControllerRef.current?.signal
        })
        if (response.ok) {
          const content = await response.text()
          const currentLength = content.length

          // 比较内容长度变化
          if (currentLength !== lastContentLengthRef.current) {
            lastContentLengthRef.current = currentLength
            onFileChange()
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('文件监控检查失败:', error.message)
        }
      }

      // 只有在组件仍然挂载时才设置下一次检查
      if (!abortControllerRef.current?.signal.aborted) {
        timeoutRef.current = setTimeout(
          () => void checkFileChange(),
          checkInterval
        )
      }
    }

    // 开始轮询
    timeoutRef.current = setTimeout(() => void checkFileChange(), checkInterval)

    return () => {
      // 取消所有正在进行的网络请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      // 清除定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [fileName, docsPath, onFileChange, checkInterval])
}
