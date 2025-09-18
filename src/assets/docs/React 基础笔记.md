# React Basics

React 应用程序是由 组件 组成的。一个组件是 UI（用户界面）的一部分，它拥有自己的逻辑和外观。组件可以小到一个按钮，也可以大到整个页面。

React 组件是返回标签的 JavaScript 函数：

```jsx
function MyButton() {
  return <button>My Button</button>
}
export default MyButton
```

**React 组件必须以大写字母开头，而 HTML 标签则必须是小写字母。** `export default` 关键字指定了文件中的主要组件。

## 使用 JSX 编写标签

上面所使用的标签语法被称为 JSX。它是可选的，但大多数 React 项目会使用 JSX，主要是它很方便。JSX 允许你在 JavaScript 中编写类似 HTML 的标签,但比 HTML 更加严格。你必须闭合标签，如 `<br />`。你的组件也不能返回多个 JSX 标签。你必须将它们包裹到一个共享的父级中，比如 `<div>...</div>` 或使用空的 `<>...</>` 包裹：

```jsx
function MyComponent() {
  return (
    <>
      <h1>Hello World</h1>
      <p>这是一个段落</p>
    </>
  )
}
export default MyComponent
```

## 添加样式

在 React 中，你可以使用 className 来指定一个 CSS 的 class。它与 HTML 的 class 属性的工作方式相同：`<img className="avatar" />`
然后，你可以在一个单独的 CSS 文件中为它编写 CSS 规则：

```css
.avatar {
  border-radius: 50%;
}
```

React 并没有规定你如何添加 CSS 文件。最简单的方式是使用 HTML 的 <link> 标签。

## 显示数据

JSX 会让你把标签放到 JavaScript 中。而大括号会让你 “回到” JavaScript 中，这样你就可以从你的代码中嵌入一些变量并展示给用户。
你还可以将 JSX 属性 “转义到 JavaScript”，但你必须使用 **大括号** 而非引号。例如，`className={title}` 是将 title 变量传递给 className，作为 CSS 的 class。

```jsx
const info = {
  name: 'react',
  color: 'red'
}

function MyComponent() {
  return (
    <>
      <h2 className="title">Hello {info.name}</h2>
      <p style={{ color: info.color }}>这是一个段落</p>
    </>
  )
}
export default MyComponent
```

## 列表渲染

```jsx
const products = [
  { title: 'Cabbage', id: 1 },
  { title: 'Garlic', id: 2 },
  { title: 'Apple', id: 3 }
]
const listItem = products.map(product => (
  <li key={product.id}>{product.title}</li>
))
return <ul>{listItem}</ul>
```

或

```jsx
return (
  <ul>
    {products.map(product => (
      <li key={product.id}>{product.title}</li>
    ))}
  </ul>
)
```

`<li>` 有一个 `key` 属性。对于列表中的每一个元素，你都应该传递一个字符串或者数字给 `key`，用于在其兄弟节点中唯一标识该元素。通常 `key` 来自你的数据，比如数据库中的 ID。如果你在后续插入、删除或重新排序这些项目，React 将依靠你提供的 key 来思考发生了什么。

## 响应事件

```jsx
function MyButton() {
  const handleClick = () => {
    console.log('click')
  }
  return <button onClick={handleClick}>My Button</button>
}
export default MyButton
```

`onClick={handleClick}` 的结尾**没有**小括号！不要 **调用** 事件处理函数：你只需 **把函数传递给事件** 即可。当用户点击按钮时 React 会调用你传递的事件处理函数。

## 状态(state)

```jsx
import { useState } from 'react'

function MyButton() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  return <button onClick={handleClick}>My Button {count}</button>
}
export default MyButton
```

`useState` 是一个 React Hook。它让你在函数组件中添加状态。`useState` 接受状态的初始值，并返回一个包含当前状态和更新该状态的函数的数组。你可以多次调用 `useState` 来添加多个状态变量。

## 使用Hook

以 `use` 开头的函数被称为 **Hook**。**useState** 是 React 提供的一个内置 Hook。你可以在 [React API](https://zh-hans.react.dev/reference/react) 参考 中找到其他内置的 Hook。你也可以通过组合现有的 Hook 来编写属于你自己的 Hook。

Hook 比普通函数更为严格。你只能在你的组件（或其他 Hook）的 **顶层** 调用 Hook。如果你想在一个条件或循环中使用 `useState`，请提取一个新的组件并在组件内部使用它。

## 共享状态

有时你希望多个组件共享状态。你可以将状态提升到它们的最近公共父组件中，然后通过 props 将状态和更新状态的函数传递给子组件。
父组件：

```jsx
import { useState } from 'react'
import MyButtonShared from './components/MyButton2'
function ReactBasics() {
  const [count, setCount] = useState(0)
  const handleClick = () => {
    setCount(count + 1)
  }
  return (
    <div>
      <MyButtonShared count={count} onClick={handleClick} />
      <MyButtonShared count={count} onClick={handleClick} />
    </div>
  )
}
export default ReactBasics
```

子组件：

```jsx
function MyButtonShared({
  count,
  onClick
}: {
  count: number
  onClick: () => void
}) {
  return <button onClick={onClick}>My Button {count}</button>
}
export default MyButtonShared
```
