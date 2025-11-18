import { Tabs } from 'antd'
import MdTabs from '@/components/MarkDownReader/MdTabs'

export default function IPFS() {
  const defaultMdMap = import.meta.glob<string>('@/views/IPFS/*.md', {
    query: '?url',
    import: 'default',
    eager: true
  })
  const docsPath = '/views/IPFS'
  const items = [
    {
      key: '1',
      label: `IPFS简介`,
      children: (
        <MdTabs
          mdMap={defaultMdMap}
          docsPath={docsPath}
          containerHeight="calc(100vh - 288px)"
        />
      )
    }
  ]

  return (
    <div>
      <h1>IPFS：星际文件系统</h1>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  )
}
