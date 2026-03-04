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

  useEffect(() => {
    // 初始化获取文件内容长度
    const initFileInfo = async () => {
      try {
        const response = await fetch(`${docsPath}/${fileName}`)
        const content = await response.text()
        lastContentLengthRef.current = content.length
      } catch (error) {
        console.error('初始化文件监控失败:', error)
      }
    }

    void initFileInfo()

    // 设置定时检查 - 使用内容长度比较
    const checkFileChange = async () => {
      try {
        const response = await fetch(`${docsPath}/${fileName}`)
        const content = await response.text()
        const currentLength = content.length

        // 比较内容长度变化
        if (currentLength !== lastContentLengthRef.current) {
          lastContentLengthRef.current = currentLength
          onFileChange()
        }
      } catch (error) {
        console.error('文件监控检查失败:', error)
      }
      // 设置下一次检查
      timeoutRef.current = setTimeout(
        () => void checkFileChange(),
        checkInterval
      )
    }

    // 开始轮询
    timeoutRef.current = setTimeout(() => void checkFileChange(), checkInterval)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [fileName, docsPath, onFileChange, checkInterval])
}
