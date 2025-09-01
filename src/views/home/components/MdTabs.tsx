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

const tabs: TabItem[] = Object.entries(mdMap).map(([filePath, url]) => {
  const key = filePath.replace(/^.*\/([^/]+)\.md$/, '$1') // 文件名作为 key
  return { key, label: key.replace(/\w/, c => c.toUpperCase()) + 'Notes', url }
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
        children: <MarkdownReader mdUrl={url} />
      }))}
    />
  )
}
