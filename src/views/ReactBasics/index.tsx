import { useState } from 'react'
import styled from 'styled-components'
import MyComponent from './components/MyComponent'
import MyButton from './components/MyButton'
import MyButtonShared from './components/MyButton2'

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
`
function ReactBasics() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  return (
    <ReactWrapper>
      <h1>React Basics</h1>
      <MyComponent />
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
    </ReactWrapper>
  )
}

export default ReactBasics
