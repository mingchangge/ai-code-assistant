import { type ReactNode } from 'react'
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'
import LazyImage from './components/LazyImage'
import InfiniteScroll from './components/InfiniteScroll'
import styled from 'styled-components'
import getThemeStyles from '@/utils/getThemeStyles'

const themeStyles = getThemeStyles()
const ExampleBox = styled.div`
  width: 100%;
  height: calc(100vh - 168px);
  padding: 12px;
  overflow: hidden;
  .container {
    height: 100%;
    overflow: auto;
    h1 {
      text-align: left;
      margin-bottom: 40px;
      font-size: 2.5rem;
    }
    .section {
      margin: 0 20px 30px;
      h2 {
        color: #34495e;
        margin-bottom: 20px;
        font-size: 1.8rem;
      }
      .image-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
        border-radius: 12px;
        padding: 30px;
        border: 1px solid ${themeStyles.borderColor};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      @keyframes spin {
        0% {
          transform: translate(-50%, -50%) rotate(0deg);
        }
        100% {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }
    }
  }
`
// 图片懒加载数据
const images = [
  { id: 1, src: 'https://picsum.photos/400/225?random=1', alt: '随机图片 1' },
  { id: 2, src: 'https://picsum.photos/400/225?random=2', alt: '随机图片 2' },
  { id: 3, src: 'https://picsum.photos/400/225?random=3', alt: '随机图片 3' },
  { id: 4, src: 'https://picsum.photos/400/225?random=4', alt: '随机图片 4' },
  { id: 5, src: 'https://picsum.photos/400/225?random=5', alt: '随机图片 5' },
  { id: 6, src: 'https://picsum.photos/400/225?random=6', alt: '随机图片 6' },
  { id: 7, src: 'https://picsum.photos/400/225?random=7', alt: '随机图片 7' },
  { id: 8, src: 'https://picsum.photos/400/225?random=8', alt: '随机图片 8' },
  { id: 9, src: 'https://picsum.photos/400/225?random=9', alt: '随机图片 9' },
  {
    id: 10,
    src: 'https://picsum.photos/400/225?random=10',
    alt: '随机图片 10'
  },
  {
    id: 11,
    src: 'https://picsum.photos/400/225?random=11',
    alt: '随机图片 11'
  },
  {
    id: 12,
    src: 'https://picsum.photos/400/225?random=12',
    alt: '随机图片 12'
  },
  {
    id: 13,
    src: 'https://picsum.photos/400/225?random=13',
    alt: '随机图片 13'
  },
  {
    id: 14,
    src: 'https://picsum.photos/400/225?random=14',
    alt: '随机图片 14'
  },
  {
    id: 15,
    src: 'https://picsum.photos/400/225?random=15',
    alt: '随机图片 15'
  },
  {
    id: 16,
    src: 'https://picsum.photos/400/225?random=16',
    alt: '随机图片 16'
  },
  {
    id: 17,
    src: 'https://picsum.photos/400/225?random=17',
    alt: '随机图片 17'
  },
  {
    id: 18,
    src: 'https://picsum.photos/400/225?random=18',
    alt: '随机图片 18'
  },
  {
    id: 19,
    src: 'https://picsum.photos/400/225?random=19',
    alt: '随机图片 19'
  },
  {
    id: 20,
    src: 'https://picsum.photos/400/225?random=20',
    alt: '随机图片 20'
  },
  {
    id: 21,
    src: 'https://picsum.photos/400/225?random=21',
    alt: '随机图片 21'
  },
  {
    id: 22,
    src: 'https://picsum.photos/400/225?random=22',
    alt: '随机图片 22'
  },
  {
    id: 23,
    src: 'https://picsum.photos/400/225?random=23',
    alt: '随机图片 23'
  },
  {
    id: 24,
    src: 'https://picsum.photos/400/225?random=24',
    alt: '随机图片 24'
  },
  {
    id: 25,
    src: 'https://picsum.photos/400/225?random=25',
    alt: '随机图片 25'
  },
  {
    id: 26,
    src: 'https://picsum.photos/400/225?random=26',
    alt: '随机图片 26'
  },
  {
    id: 27,
    src: 'https://picsum.photos/400/225?random=27',
    alt: '随机图片 27'
  }
]

function IntersectionObserverExample() {
  // 封装公共内容结构组件
  const TabContent = ({
    title,
    children
  }: {
    title: string
    children: ReactNode
  }) => (
    <div className="section">
      <h2>{title}</h2>
      {children}
    </div>
  )
  // 选项卡数据
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '图片懒加载',
      children: (
        <TabContent title="图片懒加载">
          <div className="image-grid">
            {images.map(item => (
              <LazyImage
                key={item.id}
                src={item.src}
                alt={item.alt}
                placeholder="loading..."
              />
            ))}
          </div>
        </TabContent>
      )
    },
    {
      key: '2',
      label: '无限滚动加载',
      children: (
        <TabContent title="无限滚动加载">
          <InfiniteScroll />
        </TabContent>
      )
    }
  ]
  return (
    <ExampleBox>
      <div className="container">
        <h1>IntersectionObserver 示例</h1>
        <Tabs defaultActiveKey="2" items={items} />
      </div>
    </ExampleBox>
  )
}
export default IntersectionObserverExample
