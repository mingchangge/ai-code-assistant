import { useState, useEffect, useMemo } from 'react'
import { Tabs } from 'antd'
import MarkdownReader from './MarkdownReader'

interface TabItem {
  key: string
  label: string
  url: string
}

interface MdTabsProps {
  /**
   * 可选的mdMap参数，如果不传入则使用默认的
   * 格式：Record<文件路径, URL字符串>
   */
  mdMap?: Record<string, string>
  /**
   * 可选的文档路径前缀，用于自定义文档位置
   * 默认值：'/docs'
   */
  docsPath?: string
  /**
   * 可选的标签位置参数，用于自定义标签位置
   * 默认值：'left'
   */
  tabPosition?: 'left' | 'right' | 'top' | 'bottom'
}

/**
 * 格式化文件名：去除扩展名，将连字符分隔的单词转换为驼峰命名
 * @example "user-guide.md" -> "UserGuide"
 */
const formatFileName = (fileName: string): string => {
  const nameWithoutExt = fileName.replace(/^.*\/([^/]+)\.md$/, '$1')
  const words = nameWithoutExt.split('-')

  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

// 默认的mdMap，当外部不传入时使用
const defaultMdMap = import.meta.glob<string>('@/assets/docs/*.md', {
  query: '?url',
  import: 'default',
  eager: true
})

export default function MdTabs({
  mdMap = defaultMdMap,
  docsPath = '/docs',
  tabPosition = 'left'
}: MdTabsProps) {
  const tabs: TabItem[] = useMemo(() => {
    return Object.entries(mdMap).map(([filePath, url]) => {
      const key = formatFileName(filePath)
      const fileName = url.split('/').pop() ?? ''
      return { key, label: key, url: fileName }
    })
  }, [mdMap])

  const [activeKey, setActiveKey] = useState<string>('')

  // 处理空状态和默认激活项
  useEffect(() => {
    if (tabs.length > 0 && !activeKey) {
      setActiveKey(tabs[0].key)
    }
  }, [tabs, activeKey])

  if (tabs.length === 0) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center',
          color: '#999',
          fontSize: '16px'
        }}
      >
        暂无文档
      </div>
    )
  }

  return (
    <Tabs
      activeKey={activeKey}
      tabPosition={tabPosition}
      style={{ height: '100%' }}
      onChange={setActiveKey}
      items={tabs.map(({ key, label, url }) => ({
        key,
        label,
        children: (
          <MarkdownReader key={url} fileName={url} docsPath={docsPath} />
        )
      }))}
    />
  )
}
