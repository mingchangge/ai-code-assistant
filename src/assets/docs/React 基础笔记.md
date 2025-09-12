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

# 题外话

## 下面代码在浏览器的.card::before元素中可以看到角度的变化，但是却没在浏览器上出现动画效果

```html
<div className="card">
  <p className="normal">这是一个段落</p>
</div>
```

```css
/* 注册自定义属性 */
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
.card::before {
  content: '';
  position: absolute;
  inset: -4px;
  /* 边框厚度 */
  border-radius: inherit;
  background: linear-gradient(var(--angle), #5ddcff, #3c67e3 43%, #4e00c2);
  animation: spin 2.5s linear infinite;
  z-index: -1;
}

@keyframes spin {
  to {
    --angle: 360deg;
  }
}
```

### 原因：

`--angle` 在 `@keyframes` 里被当成**普通的自定义属性**来理解，而**不是**注册后的 `<angle>` 类型变量；  
Chrome 目前只会对**显式写死**的 `transform: rotate(var(--angle))` 做插值，却不会重新解析 `linear-gradient(var(--angle), …)` 里的角度。
换句话说：- 你在 DevTools → Elements → Computed 里能看到 `--angle` 从 0deg → 360deg 递增；- 但 `linear-gradient` 的角度在**第一帧就被固化**了，后续不会再重算，所以视觉上“不动”。
官方结论：
这是**已知限制**，而不是你写错：

- [CSS Images 4](https://drafts.csswg.org/css-images-4/#linear-gradient-syntax) 里允许 `<angle>` 用变量；
- 但 Blink（Chrome）目前**只对 `transform`/`opacity` 等“可插值列表”做运行时重算**，渐变函数里的角度变量**不会触发重绘**。
- 因此 `@property` + `linear-gradient(var(--angle))` 在 `@keyframes` 里**还不生效**。

### 什么时候能用？

等 Chrome 实现“渐变函数内插值”后（官方 issue 还在开），下面代码才会真正动起来：

```css
@keyframes spin {
  to {
    --angle: 360deg;
  } /* 目前只会改值，不会重算渐变 */
}
```
