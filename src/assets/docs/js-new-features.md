# js 新特性汇总（从2015年开始到今年，倒序。）

JavaScript 作为 Web 开发的核心语言，自 1995 年诞生以来经历了翻天覆地的变化。从最初简单的脚本语言，到如今功能强大的全栈开发工具，JavaScript 的进化历程见证了 Web 技术的飞速发展。2015 年，ECMAScript 6（ES6）的发布标志着 JavaScript 进入了一个新​的时代，每年都会推出新的特性，以适应现代开发需求。

本文汇总了从 2015 年开始到今年的 JavaScript 新特性，以帮助开发者了解最新的语言特性和语法糖，使用时间倒序的方式使得读者可以从近到远的了解最新特性。数据可能存在不全以及谬误，欢迎指正。

## ES2025新特性

1. 管道运算符（|>）：简化了函数调用链，提高了代码的可读性：
   ```js
   const result = 10 |> (x => x * 2) |> (x => x + 1)
   console.log(result) // 21
   ```
2. 记录（Record）和元组（Tuple）：提供了不可变的数据结构：
   ```js
   const record = { a: 1, b: 2 }
   const tuple = [1, 2, 3]
   ```
3. 模式匹配（match）：提供了一种简洁的方式来处理复杂的条件分支：
   ```js
   const result = match(value) {
     case 1: return 'one'
     case 2: return 'two'
     default: return 'other'
   }
   ```
4. 迭代器辅助方法：提供了一些方便的方法来操作迭代器：
   ```js
   arr.values()​
   .drop(10)​
   .take(10)​
   .filter(el => el < 10)​
   .map(el => el + 5)​
   .toArray();
   ```
5. Set 增强方法：提供了集合运算的便捷方法：
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
