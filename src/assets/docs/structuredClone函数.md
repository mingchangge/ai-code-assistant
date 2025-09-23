# structuredClone 函数

`structuredClone` 是 JavaScript 中的一个内置函数，用于创建复杂数据结构的深拷贝（deep copy）。它提供了一种可靠的方式来复制包含循环引用、日期、正则表达式等特殊类型的对象。
`structuredClone` 是在 ES2022 中引入的，现在已被所有现代浏览器和 Node.js 支持，是处理复杂数据结构复制的推荐方案。

### 基本用法

```javascript
const original = { name: 'Alice', age: 30, hobbies: ['reading', 'hiking'] }
const copy = structuredClone(original)
```

### 主要特点

1. **深拷贝特性**：会递归复制所有嵌套对象和数组，而不是只复制引用
2. **支持的类型**：
   - 基本数据类型（字符串、数字、布尔值等）
   - 对象（普通对象、数组）
   - 日期对象（Date）
   - 正则表达式（RegExp）
   - 地图（Map）和集合（Set）
   - 循环引用的对象（这是它相比 `JSON.parse(JSON.stringify())` 的一大优势）

### 不支持的类型

- 函数（Function）
- 符号（Symbol）作为对象键
- DOM 节点
- WeakMap 和 WeakSet
- 错误对象（Error）

### 与其他复制方法的对比

- **浅拷贝（如 `Object.assign()` 或扩展运算符 `...`）**：只复制顶层属性，嵌套对象仍为引用
- **`JSON.parse(JSON.stringify())`**：不能处理循环引用、日期会被转为字符串、正则表达式会丢失等
- **`structuredClone`**：解决了上述方法的许多局限性，专为结构化数据克隆设计

### 示例：处理循环引用

```javascript
const obj = { name: 'Test' }
obj.self = obj // 创建循环引用

// 使用 JSON 方法会报错
try {
  JSON.parse(JSON.stringify(obj))
} catch (e) {
  console.log('JSON 方法失败:', e)
}

// 使用 structuredClone 可以正常工作
const cloned = structuredClone(obj)
console.log(cloned.self === cloned) // true（保持了循环引用）
```

## 其他深拷贝方法

### JSON 序列化 / 反序列化

使用 `JSON.stringify` 将对象转换为 JSON 字符串，然后再用 `JSON.parse` 将字符串解析回对象。这种方法简单易用，但有一些限制。

```javascript
const original = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'hiking']
}
const copy = JSON.parse(JSON.stringify(original))
```

**特点：**

- **优点**：简单快捷，适用于大多数普通对象
- **缺点**：
  - 不支持循环引用（会报错）
  - 不支持 Date（会转为字符串后无法恢复为 Date 对象）
  - 不支持 RegExp、Map、Set 等特殊类型
  - 会忽略 undefined、函数和 Symbol

### 递归手动复制

手动编写递归函数来实现深拷贝，可以根据需要处理各种类型的数据。

```javascript
function deepClone(obj, hash = new WeakMap()) {
  // 处理null或基本类型
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  // 处理循环引用
  if (hash.has(obj)) {
    return hash.get(obj)
  }

  let cloneObj

  // 处理Symbol类型
  if (typeof obj === 'symbol') {
    return Symbol(obj.description)
  }

  // 处理Function类型
  if (typeof obj === 'function') {
    // 函数类型直接返回，不进行复制，，修改原函数会影响克隆对象中的函数
    return obj
  }

  // 处理日期类型
  if (obj instanceof Date) {
    cloneObj = new Date(obj)
    hash.set(obj, cloneObj)
    return cloneObj
  }

  // 处理正则表达式
  if (obj instanceof RegExp) {
    cloneObj = new RegExp(obj.source, obj.flags)
    // 复制正则表达式的lastIndex属性，确保正则表达式的状态在复制后保持一致
    cloneObj.lastIndex = obj.lastIndex // lastIndex：用于记录下一次匹配的起始位置。当正则表达式使用 g（全局匹配）标志时，这个属性会动态变化
    hash.set(obj, cloneObj)
    return cloneObj
  }

  // 合并处理Map和Set
  if (obj instanceof Map || obj instanceof Set) {
    // 创建对应类型的新实例
    cloneObj = new obj.constructor()
    hash.set(obj, cloneObj)

    // 遍历并复制元素（Map需要同时处理键和值，Set只需处理值）
    if (obj instanceof Map) {
      obj.forEach((value, key) => {
        cloneObj.set(deepClone(key, hash), deepClone(value, hash))
      })
    } else {
      // Set
      obj.forEach(value => {
        cloneObj.add(deepClone(value, hash))
      })
    }
    return cloneObj
  }

  // 处理数组和普通对象
  if (Array.isArray(obj)) {
    cloneObj = []
  } else {
    cloneObj = Object.create(Object.getPrototypeOf(obj))
  }

  hash.set(obj, cloneObj)

  // 处理所有键（包括Symbol键）
  const allKeys = [...Object.keys(obj), ...Object.getOwnPropertySymbols(obj)]
  allKeys.forEach(key => {
    cloneObj[key] = deepClone(obj[key], hash)
  })

  return cloneObj
}

// 测试用例
const testMap = new Map([[{ id: 1 }, 'value1']])
const testSet = new Set([1, 2, { a: 3 }])

const original = {
  map: testMap,
  set: testSet,
  self: null
}
original.self = original // 循环引用

const copy = deepClone(original)

console.log(copy.map instanceof Map) // true
console.log(copy.set instanceof Set) // true
console.log(copy.self === copy) // true（循环引用处理正常）
```

**特点：**

- **优点**：可自定义支持的类型，能处理循环引用
- **缺点**：需要手动处理各种特殊类型（如 Map、Set 等），实现较繁琐

### 使用 Lodash 的 `_.cloneDeep`方法

Lodash 是一个流行的 JavaScript 实用工具库，提供了许多便捷的函数来处理数组、对象等数据结构。`_.cloneDeep` 是 Lodash 提供的深拷贝方法，会递归复制所有嵌套对象和数组。

```javascript
import _ from 'lodash'

const original = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'hiking'],
  date: new Date()
}
const copy = _.cloneDeep(original)
```

**特点：**

- 支持几乎所有 JavaScript 类型（包括循环引用、Map、Set 等）
- 经过充分测试，稳定性高

### 使用 `MessageChannel` 进行深拷贝

通过浏览器的 MessageChannel 传递数据，利用其自动深拷贝的特性。

```javascript
const original = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'hiking'],
  date: new Date()
}

const channel = new MessageChannel()
channel.port1.postMessage(original)
channel.port2.onmessage = e => {
  const cloned = e.data
  console.log(cloned.date instanceof Date) // true（日期对象被深拷贝）
}
```

**特点：**

- **优点**：无需手动处理类型，支持循环引用
- **缺点**：异步操作，无法在同步代码中使用；不支持 Function 等类型

## jQuery 的 $.extend()

jQuery 提供的 `$.extend()` 方法可以用于对象的浅拷贝和深拷贝。通过传递 `true` 作为第一个参数，可以实现深拷贝。

```javascript
const original = {
  name: 'Alice',
  age: 30,
  hobbies: ['reading', 'hiking']
}
const copy = $.extend(true, {}, original)
```

**特点：**

- **优点**：需依赖 jQuery 库
- **缺点**：对特殊类型（如 Date）的处理可能不符合预期

## 总结

- 简单场景且无特殊类型：优先用 JSON.parse(JSON.stringify())
- 需处理复杂类型或循环引用：推荐 lodash.cloneDeep()
- 自定义需求：使用递归实现并按需扩展
- 浏览器环境且可异步：MessageChannel 是备选方案
