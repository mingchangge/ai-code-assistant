# css-in-js

CSS-in-JS 是一种将 **CSS 样式写在 JavaScript 文件里** 的技术方案，而不是传统的 `.css`、`.scss` 或 `.less` 文件。它的核心理念是：**用 JavaScript 写样式，让样式和组件逻辑更紧密地结合在一起**。

1. 用 CSS-in-JS原因：
   | 传统 CSS 的问题 | CSS-in-JS 的解决方式 |
   |-----------------|----------------------|
   | **全局作用域** 导致样式冲突 | 样式默认是 **局部作用域**（组件级） |
   | 命名困难（BEM 规范复杂） | 自动生成唯一类名，无需手动命名 |
   | 样式和组件逻辑分离 | 样式和组件 **同文件、同作用域**，便于维护 |
   | 动态样式困难（如根据 props 改变颜色） | 可直接使用 JavaScript 变量和逻辑 |
   | 死代码难以清理 | 组件卸载时，样式自动移除 |

2. CSS-in-JS 的写法示例（以 `styled-components` 为例）：

   ```jsx
   import styled from 'styled-components'

   // 创建一个带样式的按钮组件
   const Button = styled.button`
     background: ${props => (props.primary ? 'blue' : 'white')};
     color: ${props => (props.primary ? 'white' : 'blue')};
     padding: 10px 20px;
     border: 1px solid blue;
     border-radius: 4px;
   `

   // 使用组件
   function App() {
     return (
       <div>
         <Button>普通按钮</Button>
         <Button primary>主要按钮</Button>
       </div>
     )
   }
   ```

3. 流行的 CSS-in-JS 库
   | 库名 | 特点 |
   | --------------------- | ------------------------------------- |
   | **styled-components** | 使用模板字符串写 CSS，语法直观 |
   | **Emotion** | 性能更好，支持多种写法（字符串/对象） |
   | **Linaria** | 构建时提取 CSS，零运行时（性能最优） |
   | **JSS** | 使用 JavaScript 对象描述样式 |

4. 优缺点总结：
   - ✅ **优点**：
     - 样式模块化，避免冲突
     - 支持动态样式（props、state 驱动）
     - 样式和组件逻辑紧密结合

   - ❌ **缺点**：
     - 运行时性能开销（部分库）
     - 学习成本（需要熟悉新语法）
     - 调试略复杂（需借助浏览器 DevTools 插件）

5. 什么时候用 CSS-in-JS？
   - ✅ **React/Vue 组件化项目**（尤其是需要动态样式时）
   - ✅ **设计系统**（如 Material-UI、Chakra UI）
   - ❌ **简单静态页面**（传统 CSS 更简单）

**总结：**

> CSS-in-JS 不是必须的，但在大型组件化项目中，它能让样式管理更 **模块化、可维护、动态化**。

---

## 安装依赖

```bash
# 核心 CSS-in-JS 库
npm install styled-components
# TypeScript 类型支持（可选，若用 TS）
npm install -D @types/styled-components
```

---

## Linaria构建时提取 CSS，零运行时（性能最优），它是否支持动态样式？

**Linaria 支持动态样式**，但它通过一种特殊的方式实现，使得**运行时开销为零**，性能最优。

- ✅ 支持动态样式方式：

  Linaria 在**构建时**将动态表达式（如 props、状态）转换为 **CSS 自定义属性（CSS Variables）**，从而保留动态能力，同时避免了运行时 JS 计算样式的开销。

  **示例代码：**

  ```jsx
  import { styled } from '@linaria/react'

  const Button = styled.button`
    background: ${props => (props.primary ? 'blue' : 'white')};
    color: ${props => (props.primary ? 'white' : 'blue')};
  `
  ```

  在构建时，这段代码会被编译成类似于：

  ```css
  .button_abc123 {
    background: var(--button-background);
    color: var(--button-color);
  }
  ```

  然后在组件渲染时，React 会通过内联样式或 CSS 变量注入动态值：

  ```html
  <button
    class="button_abc123"
    style="--button-background: blue; --button-color: white;"
  >
    Click me
  </button>
  ```

- ✅ 注意限制
  - **依赖现代浏览器支持的 CSS 变量**，因此不兼容 IE11。
  - **动态表达式必须是纯函数，<font color="red">不能访问浏览器 API（如 `window`）</font>，**否则会导致构建失败或 SSR 问题。
  - 对于**运行时才能确定的值**（如 `window.innerWidth`），Linaria 无法提取，需要手动处理为函数形式，但这会引入运行时逻辑。

**总结：**

> Linaria 支持**基于 props 的动态样式**，但它是通过**构建时生成 CSS 变量**实现的，因此**运行时零开销**，性能最优，可以放在开发依赖中。

---

## styled-components是怎样支持动态样式？

`styled-components` 的“动态样式”**完全在运行时完成**：

它在浏览器里把模板字符串重新解析成真正的 CSS，再把计算结果以 `<style>` 标签实时插到 `<head>` 里。因此它既没有“构建时提取”，也谈不上“零运行时”。

1. 运行时如何工作（简化流程）

   ```jsx
   const Button = styled.button`
     color: ${props => (props.primary ? 'blue' : 'gray')};
     font-size: ${props => props.size}px;
   `
   ```

   渲染 `<Button primary size={18}>` 时：
   1. 拿到 `props` → 执行箭头函数 → 得到 `color: blue; font-size: 18px;`
   2. 根据返回值生成一串 **唯一类名**（如 `.sc-bdnxRM.hYjGrK`）
   3. 把这段最终 CSS 插进 `<head>` 里的 `<style>` 标签
   4. 给 `<button>` 加上这个唯一类名

   Chrome DevTools → Elements → `<head>` 能看到实时插入的 `<style>` 块。

2. 代价与特点

   | 优点                                                                                   | 代价                                                |
   | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
   | 任何 JS 表达式都能写（可访问 `window`、定时器、任意函数）                              | 运行时解析 + 插入 → 带来额外 JS 执行和内存占用      |
   | 服务端渲染（`styled-components/server`) 可一次性抽 CSS，但依旧是**运行时生成**后再抽走 | 包体积大（约 12 kB gzip），每渲染一次就重新计算一次 |

**总结：**

`styled-components` 的动态样式靠 **运行时模板字符串求值 + 动态插 style 标签** 实现，灵活度高，却也因此有不可避免的运行时开销，与 Linaria 的“零运行时”路线正好相反。styled-components 需要在「用户运行时」动态生成 CSS，开发依赖会被打包排除，导致样式失效。<font color="red">**因此，需要放在生产依赖**</font>

────────────────
