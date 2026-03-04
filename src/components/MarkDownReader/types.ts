// 目录项接口
export interface TocItem {
  index: number
  text: string
  level: number
}

// MarkdownReader组件属性接口
export interface MarkdownReaderProps {
  fileName: string
  docsPath?: string
  containerHeight?: string
  reloadInterval?: number
}
