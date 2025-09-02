import { useState } from 'react'
import { Tabs } from 'antd'
import MarkdownReader from './MarkdownReader'

// 使用 import.meta.glob 一次拿到所有 *.md?url
const mdMap = import.meta.glob<string>('@/assets/docs/*.md', {
  query: '?url',
  import: 'default',
  eager: true
})

// 把 Record 转成数组并保持顺序
interface TabItem {
  key: string
  label: string
  url: string
}

// 格式化文件名
const formatFileName = (fileName: string) => {
  // 去除.md后缀
  const nameWithoutExt: string = fileName.replace(/^.*\/([^/]+)\.md$/, '$1')

  // 处理包含-的情况，拆分后首字母大写再拼接
  const words = nameWithoutExt.split('-')
  const capitalizedWords = words.map(word => {
    // 首字母大写，其余字母保持原样
    return word.charAt(0).toUpperCase() + word.slice(1)
  })

  // 拼接并添加Notes
  return capitalizedWords.join('') + 'Notes'
}
const tabs: TabItem[] = Object.entries(mdMap).map(([filePath, url]) => {
  const key = formatFileName(filePath) // 文件名作为 key
  const fileName = url.split('/').pop() ?? ''
  return { key, label: key, url: fileName }
})

export default function MdTabs() {
  const [activeKey, setActiveKey] = useState<string>(tabs[0]?.key ?? '')

  return (
    <Tabs
      activeKey={activeKey}
      defaultActiveKey="1"
      tabPosition="left"
      style={{ height: '100%' }}
      onChange={setActiveKey}
      items={tabs.map(({ key, label, url }) => ({
        key,
        label,
        children: <MarkdownReader fileName={url} />
      }))}
    />
  )
}
