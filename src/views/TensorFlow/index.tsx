// 前端机器学习笔记
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import MdTabs from '@/components/MarkDownReader/MdTabs'
import Test from './components/Test'

export default function LinearRegressionForPredictingHousePrices() {
  const mdMap = import.meta.glob<string>('@/views/TensorFlow/docs/*.md', {
    query: '?url',
    import: 'default',
    eager: true
  })
  const items: TabsProps['items'] = [
    {
      key: 'notes',
      label: '学习笔记',
      children: (
        <MdTabs
          mdMap={mdMap}
          docsPath="/views/TensorFlow/docs"
          containerHeight="calc(100vh - 218px)"
        />
      )
    },
    {
      key: 'test',
      label: '练习',
      children: <Test />
    }
  ]
  return (
    <div>
      <Tabs defaultActiveKey="notes" items={items} />
    </div>
  )
}
