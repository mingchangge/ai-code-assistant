# js 新特性汇总（从2015年开始到今年，倒序。）

JavaScript 作为 Web 开发的核心语言，自 1995 年诞生以来经历了翻天覆地的变化。从最初简单的脚本语言，到如今功能强大的全栈开发工具，JavaScript 的进化历程见证了 Web 技术的飞速发展。2015 年，ECMAScript 6（ES6）的发布标志着 JavaScript 进入了一个新​的时代，每年都会推出新的特性，以适应现代开发需求。

本文汇总了从 2015 年开始到今年的 JavaScript 新特性，以帮助开发者了解最新的语言特性和语法糖，使用时间倒序的方式使得读者可以从近到远的了解最新特性。数据可能存在不全以及谬误，欢迎指正。

## ES2025新特性

### 1.管道运算符（|>）：简化了函数调用链，提高了代码的可读性：

```js
const result = 10 |> (x => x * 2) |> (x => x + 1)
console.log(result) // 21
```

### 2.记录（Record）和元组（Tuple）：提供了不可变的数据结构：

```js
const record = { a: 1, b: 2 }
const tuple = [1, 2, 3]
```

### 3.模式匹配（match）：提供了一种简洁的方式来处理复杂的条件分支：

```js
const result = match(value) {
  case 1: return 'one'
  case 2: return 'two'
  default: return 'other'
}
```

### 4.迭代器辅助方法：提供了一些方便的方法来操作迭代器：

```js
arr.values()​
.drop(10)​
.take(10)​
.filter(el => el < 10)​
.map(el => el + 5)​
.toArray();
```

### 5.Set 增强方法：提供了集合运算的便捷方法：

```js
const set1 = new Set([1, 2, 3])
const set2 = new Set([3, 4, 5])
const union = new Set([...set1, ...set2])
const union2 = set1.union(set2)
const intersection = new Set([...set1].filter(x => set2.has(x)))
const difference = new Set([...set1].filter(x => !set2.has(x)))
console.log(union) // Set(5) { 1, 2, 3, 4, 5 }
console.log(union2) // Set(5) { 1, 2, 3, 4, 5 }
console.log(intersection) // Set(1) { 3 }
console.log(difference) // Set(2) { 1, 2 }
```

### <s>6.导入属性和 JSON 模块</s>

导入属性为导入非 JavaScript 资源提供了语法基础。首批支持的非 JavaScript 资源是 JSON 模块：

```js
// Static import
import configData1 from './config-data.json' with { type: 'json' }
// Dynamic import--测试不可用
const configData2 = await import('./config-data.json', {
  with: { type: 'json' }
})
// 输出： TypeError: Failed to fetch dynamically imported module
// 下面动态导入可用
const configData3 = await import('./config-data.json', {
  assert: { type: 'json' }
})
```

目前（截至2025年9月），`with: { type: 'json' }` 并不是 ECMAScript 2025（ES2025）的标准特性，也未被纳入任何已发布的正式规范中。

#### 关于 JSON 模块导入的规范背景：

1. **现行标准**：  
   导入 JSON 模块的标准语法是使用 `assert` 关键字，这是在 [ES Module Specifiers](https://tc39.es/proposal-import-assertions/) 提案中定义的，并已被纳入 ES2022 规范：

   ```javascript
   import config from './data.json' assert { type: 'json' }
   ```

2. **关于 `with` 语法的误解**：  
   可能混淆了其他提案或实验性语法。例如：
   - 早期有讨论用 `with` 替代 `assert` 的提案，但未被采纳
   - 某些工具（如打包器）可能有非标准扩展语法，但并非 ECMAScript 标准
   - TypeScript 或 Babel 插件可能实现过类似语法，但属于非标准实现

3. **ES2025 的实际进展**：  
   根据 TC39（ECMAScript 标准制定委员会）的公开提案进度，2025 年的规范更新中并未包含用 `with` 处理模块导入的语法。当前模块导入相关的提案主要集中在：
   - 改进模块解析算法
   - 动态导入的性能优化
   - 新的模块类型支持（如 CSS 模块）

#### 结论：

`with: { type: 'json' }` 不是 ES2025 或任何现行 ECMAScript 标准的特性，使用它会导致语法错误。正确的做法仍然是使用标准的 `assert` 语法，或通过 `fetch` 等兼容性更好的方式加载 JSON 数据。

如果需要验证语言特性的标准化状态，可以参考 TC39 的 [官方提案跟踪页面](https://github.com/tc39/proposals)。
