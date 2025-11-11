import { useState } from 'react'
import type { CollapseProps } from 'antd'
import { Collapse } from 'antd'
import styled from 'styled-components'
import Profile, {
  Profile2,
  Profile3,
  Profile4,
  Profile5
} from './components/Profile'
import MyComponent from './components/MyComponent'
import MyButton from './components/MyButton'
import MyButtonShared from './components/MyButton2'
import TimeChange from './components/TimeChange'
import ExpandCode from './components/ExpandCode'

const products = [
  { title: 'Cabbage', id: 1 },
  { title: 'Garlic', id: 2 },
  { title: 'Apple', id: 3 }
]
const listItem = products.map(product => (
  <li key={product.id}>{product.title}</li>
))
const ReactWrapper = styled.div`
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  position: relative;
  .avatar {
    border: 0px solid #ccc;
    border-radius: 100%;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
    div {
      background: #eee;
      padding: 20px;
      text-align: left;
      button {
        padding: 10px 20px;
        margin-right: 10px;
      }
    }
  }
  .grid2 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 4px !important;
    div {
      padding: 0px;
      h3 {
        font-size: 20px;
      }
      p {
        font-size: 16px;
      }
    }
  }
  .card2 {
    width: 120px;
    height: 120px;
    border: 1px solid #ccc;
    border-radius: 14px;
    text-align: center !important;
    p {
      margin: 10px auto;
    }
  }
`
function ReactBasics() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  const imgProps = {
    person: {
      name: '随机图片 4',
      imageSrc: 'https://picsum.photos/400/225?random=4'
    },
    size: 100,
    isSepia: true,
    thickBorder: false
  }
  const items: CollapseProps['items'] = [
    {
      key: '1',
      label: 'Hello 亲爱的朋友， 欢迎来到React的世界！',
      children: <MyComponent />
    },
    {
      key: '2',
      label: '90% 的前端都没摸过的 20 个 JS 神级 API！',
      children: <ExpandCode />
    },
    {
      key: '3',
      label: 'props 传递',
      children: (
        <div className="grid">
          <div>
            <h2>将 Props 传递给组件-Avatar解构传入</h2>
            <Profile />
          </div>
          <div>
            <h2>将 Props 传递给组件-props作为一整个对象传入</h2>
            <Profile2 />
          </div>
          <div>
            <h2>不使用 JSX 展开语法传递 props-父组件挨个传递子组件属性 </h2>
            <Profile3
              person={{
                name: '随机图片 3',
                imageSrc: 'https://picsum.photos/400/225?random=3'
              }}
              size={100}
              isSepia={true}
              thickBorder={true}
            />
          </div>
          <div>
            <h2>使用 JSX 展开语法传递 props-解构父组件对象属性 </h2>
            <div className="grid2">
              <div>
                <Profile4 {...imgProps} />
              </div>
              <div>
                {' '}
                <h3>css sepia() </h3>
                <p>
                  该CSS函数将输入图像转换为棕褐色，使其呈现更温暖、更偏黄/棕色的外观。如：sepia(0.65)
                </p>
              </div>
            </div>
          </div>
          <div>
            <h2>将 JSX 作为子组件传递 </h2>
            <Profile5 />
          </div>
          <div>
            <h2>Props 随时间变化 </h2>
            <TimeChange />
          </div>
        </div>
      )
    },
    {
      key: '4',
      label: 'Products列表渲染',
      children: (
        <div className="grid">
          <div>
            <h2>Products列表渲染</h2>
            <ul>
              {products.map(product => (
                <li key={product.id}>{product.title}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Products列表渲染</h2>
            <ul>{listItem}</ul>
          </div>
        </div>
      )
    },
    {
      key: '5',
      label: 'MyButton组件',
      children: (
        <div className="grid">
          <div>
            <h2>MyButton组件-单独状态</h2>
            <MyButton />
            <MyButton />
          </div>
          <div>
            <h2>MyButton组件-共享状态</h2>
            <MyButtonShared count={count} onClick={handleClick} />
            <MyButtonShared count={count} onClick={handleClick} />
          </div>
        </div>
      )
    }
  ]
  return (
    <ReactWrapper>
      <h1>React Basics</h1>
      {/* <MyComponent /> */}
      <Collapse items={items} defaultActiveKey={['1']} />
    </ReactWrapper>
  )
}

export default ReactBasics
