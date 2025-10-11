# js使用技巧

**JavaScript** 是一门强大且灵活的语言，拥有丰富的特性和语法糖。

本文旨在分享一些常用的 JavaScript 技巧，帮助开发者更高效地编写代码。当然了，有时候写着写着会出现一些偏离主题的内容，但学习嘛，就像登山一样，总有一些风景是需要欣赏的。所以，偶尔停下来，欣赏一下风景，也是很有必要的。但最终目的还是登山，只要不忘初心，偶尔开开小差，无伤大雅。

## 1. 使用解构从对象中提取属性

```js
const user = {
  profile: { name: '张三', age: 30 },
  address: { city: '北京' }
}
const {
  profile: { name: userName, age: userAge },
  address: { city: userCity }
} = user
console.log(userName, userAge, userCity)
//输出：张三 30 北京
```

## 2. 数组去重

### 1. 使用 Set（最简洁高效，推荐）

**原理**：Set 是 ES6 新增的数据结构，其特性是 “成员唯一，不允许重复值”。利用这一特性，可快速实现去重。

**步骤**：

- 将数组转为 Set（自动去重）；
- 再将 Set 转回数组（用 Array.from() 或扩展运算符 ...）。

**代码**：

```js
const arr2 = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const unique = arr => [...new Set(arr)]
console.log('去重后的数组:', unique(arr2))
//输出：[1, 2, 3, 4, 5, NaN]
```

或者使用 Array.from(new Set(arr))

```js
const arr2 = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const unique2 = arr => Array.from(new Set(arr))
console.log('去重后的数组:', unique2(arr2))
//输出：[1, 2, 3, 4, 5, NaN]
```

**优点**：简洁、高效（时间复杂度接近 O (n)），能处理 NaN 重复；

**缺点**：无法去重引用类型（如 [{a:1}, {a:1}] 会被视为不同元素，因为引用地址不同）。

### 2. 使用 Array.prototype.filter() + indexOf()方法

**原理**：利用数组的indexOf方法，判断元素在数组中的第一个索引是否等于当前索引，来判断是否为重复元素。

**代码**：

```js
const arr = [1, 2, 2, 3, 4, 4, 5]
arr.map((item, index) => {
  console.log('indexOf:', arr.indexOf(item), 'index:', index, 'item:', item)
})
const uniqueItems = arr.filter((item, index) => arr.indexOf(item) === index)
console.log('去重后的数组:', uniqueItems)
//输出：
//indexOf: 0 index: 0 item: 1
//indexOf: 1 index: 1 item: 2
//indexOf: 1 index: 2 item: 2
//indexOf: 2 index: 3 item: 3
//indexOf: 3 index: 4 item: 4
//indexOf: 3 index: 5 item: 4
//indexOf: 6 index: 6 item: 5
//去重后的数组: [1, 2, 3, 4, 5]
```

**局限性**：

- 只能去重简单类型的数组，如数字、字符串等。
- 不能去重复杂类型的数组，如对象、数组等。因为 indexOf 比较的是值的引用地址，而非内容（例如 [{a:1}, {a:1}] 无法去重）。
- 无法处理 NaN：因为 indexOf(NaN) 始终返回 -1（indexOf 不识别 NaN），会导致 NaN 被过滤。

### 3. 使用 Array.prototype.reduce() + includes()方法

**原理**：通过 reduce 遍历数组，用累加器（一个临时数组）存储已出现的元素。对每个元素，判断累加器中是否已存在，不存在则加入。

**代码**：

```js
const arr = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const uniqueReduce = arr.reduce((acc, cur) => {
  if (!acc.includes(cur)) {
    acc.push(cur)
  }
  return acc
}, [])
console.log('去重后的数组:', uniqueReduce)
//输出：[1, 2, 3, 4, 5, NaN]
```

**知识点**：

- includes() 能识别 NaN
  `Array.prototype.includes()` 使用的是 **SameValueZero** 算法 来判断元素是否存在，这种算法的规则是：
  - 对于普通值，和 === 行为一致（如 1 === 1 为 true）；
  - 特殊的是，NaN 会被视为与自身相等（即 NaN === NaN 在 SameValueZero 中为 true）。

  因此，[NaN].includes(NaN) 的结果是 true，而 [NaN].indexOf(NaN) 的结果是 -1（因为 indexOf 用 === 判断，而 NaN === NaN 本身为 false）。

  ```js
  console.log([NaN].includes(NaN)) // true
  console.log([NaN].indexOf(NaN)) // -1
  console.log(NaN === NaN) // false
  ```

**优点**：灵活（可自定义去重逻辑）；

**缺点**：includes 内部也是遍历查找，时间复杂度 O (n²)，性能略差；

**局限性**：

- 只能去重简单类型的数组，如数字、字符串等。
- 不能去重复杂类型的数组，如对象、数组等。因为 includes 比较的是值的引用地址，而非内容（例如 [{a:1}, {a:1}] 无法去重）。

### 4. 双重 `for` 循环（最基础的原生方法）

**原理**：通过两个循环遍历数组，比较每个元素是否相等。如果相等，就将当前元素从数组中删除。

**注意点**：<font color="red" size="4">**不要再内层循环中使用 `break` 跳出循环**</font>，否则会导致漏删重复元素。

**代码**：

```js
const arr = [1, 2, 2, 3, 4, 4, 5, 2, 2, 3]
for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[i] === arr[j]) {
      arr.splice(j, 1)
      j-- // 删除元素后，索引 j 会减 1，需要重新比较当前元素与新的下一个元素
      // 不可以跳出内层循环，容易遗漏后面重复元素
      // break ❌
    }
  }
}
console.log('去重后的数组:', arr)
//输出：[1, 2, 3, 4, 5]
```

**优点**：简单、易理解；兼容性极好（支持所有浏览器）。

**缺点**：时间复杂度 O (n²)，性能较差；且会<font color="red">**修改原数组**</font>（需注意）。

### 5. 利用对象属性唯一性

**原理**：对象的属性名具有唯一性（不会重复）。遍历数组时，将元素作为对象的属性名存储，若属性已存在则说明元素重复。

**代码**：

```js
const arr = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const uniqueObj = arr => {
  const obj = {}
  for (const item of arr) {
    obj[item] = item // 存储属性
  }
  return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj(arr))
//输出：[1, 2, 3, 4, 5, NaN]
```

或者使用 `reduce` 方法

```js
const arr = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const uniqueObj = arr => {
  // 用reduce遍历，初始值为{}
  const obj = arr.reduce((acc, item) => {
    acc[item] = item // 给累积器添加属性
    return acc // 返回更新后的累积器
  }, {})
  return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj(arr))
```

或者使用 `forEach` 方法以及最基础的 `for` 循环遍历，任选其一即可。

```js
const arr = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const uniqueObj = arr => {
  const obj = {}
  arr.forEach(item => {
    obj[item] = item
  })
  // 基础for循环遍历
  //   for (let i = 0; i < arr.length; i++) {
  //     const item = arr[i]
  //     obj[item] = item // 存储属性
  //   }
  return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj(arr))
//输出：[1, 2, 3, 4, 5, NaN]
```

**优点**：简单、高效（时间复杂度 O (n)）；能处理 NaN 重复，但 `NaN` 作为对象属性名时会被转为统一的字符串。

**缺点**：

- 无法去重引用类型（如 [{a:1}, {a:1}] 会被视为不同元素，因为引用地址不同）。
- 会混淆数字和字符串（如 1 和 '1' 被视为相同）,布尔值 true 和字符串 'true' 也会被混淆。因为对象的属性名**无论原始类型是什么，最终都会被转为字符串**，这会混淆不同类型但字符串化后相同的值。

### 6. 处理复杂类型（如对象）的去重

以上方法均无法处理**引用类型**（如对象、数组）的去重，因为它们比较的是 “引用地址” 而非 “内容”。若需对 [{a:1}, {a:1}] 这类数组去重，需自定义比较逻辑（如比较属性值）。

**代码**（基于 JSON 序列化的简单对象去重）：

```js
const arr = [{ a: 1 }, { a: 1 }, { a: 2 }]
const uniqueObj = arr => {
  const obj = {}
  for (const item of arr) {
    obj[JSON.stringify(item)] = item // 存储属性
  }
  return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj(arr))
//输出：[{a:1}, {a:2}]
```

## 3. 三元运算符简化条件判断

```js
const age = 18
const isAdult = age >= 18 ? '是' : '否'
console.log(isAdult) // 输出：是
```

## 4. 逻辑运算符简化条件判断/利用逻辑运算符的短路效应

```js
const age = 18
const isAdult = (age >= 18 && '是') || '否'
console.log(isAdult) // 输出：是
```

## 5. 可选链运算符

```js
// 1. 传统写法
const user = { name: '张三' }
const name =
  user.name !== null && user.name !== undefined ? user.name : 'default'
// 2. 可选链运算符写法
const name1 = user.name ?? 'default'
console.log(name, name1)
// 输出：张三 张三
```

## 6. 空值合并运算符

```js
//1 传统写法
const user = { name: '张三' }
const name =
  user.name !== null && user.name !== undefined ? user.name : 'default'
//2 空值合并运算符写法
const name = user.name ?? 'default'
console.log(name, name1)
// 输出：张三 张三
```

**注意**：

- 空值合并运算符（`??`）仅在左侧操作数为 `null` 或 `undefined` 时才返回右侧操作数，否则返回左侧操作数
- 而逻辑或运算符（`||`）在左侧操作数为 `false` 时也会返回右侧操作数。

## 7. 快速取整（`~~`）

```js
console.log(Math.floor(4.9)) // 输出：4
console.log(~~4.9) // 输出：4
console.log(Math.floor(-4.9)) // 输出：-5
console.log(~~-4.9) // 输出：-4
```

在 JavaScript 中，双波浪号 `~~` 是一种快速取整的技巧，它本质上是利用了**按位非运算**的特性来实现取整效果。

### 原理说明：

`~` 是按位非运算符，作用是将数值转换为 32 位有符号整数后再取反（二进制位上的 0 变 1，1 变 0）。  
而 `~~` 是连续两次按位非运算，第一次取反后，第二次取反会还原为原始的 32 位整数形式，相当于**截断小数部分**，实现取整效果。

### 特点与用法：

1. **对正数**：效果等同于 `Math.floor()`（向下取整）  
   例：`~~3.9` → `3`，`~~5.1` → `5`

2. **对负数**：与 `Math.floor()` 不同，`~~` 会直接截断小数部分（向零取整）  
   例：`~~-2.3` → `-2`（而 `Math.floor(-2.3)` 是 `-3`）

3. **对非数字**：会先转换为数字再取整（与 `Number()` 转换规则一致）  
   例：`~~"6.7"` → `6`，`~~true` → `1`，`~~null` → `0`

4. **限制**：仅能处理 32 位有符号整数范围内的值（-2³¹ 到 2³¹-1），超出范围会被截断。

### 示例代码：

```javascript
console.log(~~3.14) // 3（正数取整）
console.log(~~-3.14) // -3（负数取整，向零靠拢）
console.log(~~'10.99') // 10（字符串转数字后取整）
console.log(~~true) // 1（布尔值 true 转 1）
console.log(~~null) // 0（null 转 0）
console.log(~~Infinity) // 0（超出32位范围，特殊处理）
console.log(~~-Infinity) // 0（超出32位范围，特殊处理）
```

### 与其他取整方法的对比：

- `Math.floor(x)`：向下取整（对负数更“严格”）
- `Math.ceil(x)`：向上取整
- `Math.round(x)`：四舍五入
- `parseInt(x)`：解析字符串为整数（行为类似 `~~`，但对非字符串处理不同）

`~~` 的优势是**代码更简洁**，且在多数 JS 引擎中**性能略优**（位运算效率较高），适合对整数范围无特殊要求的快速取整场景。

## 8. 合并对象

```js
const obj1 = { a: 1, b: 2 }
const obj2 = { b: 3, c: 4 }
// 1. ES6 特性，但更早被广泛支持（且 polyfill 更成熟）
const merged = Object.assign({}, obj1, obj2)
// 2.  ES2018 引入的特性
const merged1 = { ...obj1, ...obj2 }
console.log(merged, merged1)
// 输出：{ a: 1, b: 3, c: 4 }
// {a: 1, b: 3, c: 4}
```

在 JavaScript 中，`Object.assign()` 和展开运算符（`...`）是两种常用的对象合并方法，它们核心功能相似（均为**浅拷贝合并**），但在细节和适用场景上有显著差异。以下从「优势」「劣势」和「适用场景」三个维度对比分析：

### 一、`Object.assign(target, ...sources)`

#### 优势：

1. **支持修改目标对象**  
   可以指定一个已存在的对象作为目标（`target`），合并后直接修改该对象，无需创建新对象，适合需要「在原有对象基础上扩展属性」的场景。  
   例：

   ```javascript
   const obj = { a: 1 }
   Object.assign(obj, { b: 2 }) // 直接修改 obj，结果为 {a:1, b:2}
   ```

2. **明确的返回值**  
   始终返回合并后的目标对象（`target`），便于链式操作或直接赋值。

3. **支持多源合并**  
   可以一次性合并多个源对象（`...sources`），语法清晰：
   ```javascript
   Object.assign({}, obj1, obj2, obj3) // 合并 obj1、obj2、obj3 到新对象
   ```

#### 劣势：

1. **可能意外修改原对象**  
   如果目标对象（`target`）是已存在的引用类型，合并后会直接修改它，容易引发副作用（尤其是在多人协作或复杂状态管理中）。

2. **语法相对繁琐**  
   合并到新对象时必须显式指定空对象作为目标（`Object.assign({}, obj1, obj2)`），不如展开运算符简洁。

3. **对原始值目标的特殊处理**  
   如果 `target` 是原始值（如数字、字符串），会被自动转换为对应的包装对象（如 `Number`、`String`），可能产生不符合预期的结果：
   ```javascript
   Object.assign(123, { a: 1 }) // 结果为 Number {123, a: 1}（不常用且容易混淆）
   ```

### 二、展开运算符 `{...obj1, ...obj2, ...}`

#### 优势：

1. **天然创建新对象**  
   始终返回一个全新的合并对象，不会修改任何源对象，完美契合「不可变数据」理念（如 React 状态更新、Redux 状态管理等场景）。  
   例：

   ```javascript
   const obj1 = { a: 1 }
   const obj2 = { b: 2 }
   const merged = { ...obj1, ...obj2 } // merged 是新对象，obj1、obj2 不受影响
   ```

2. **语法简洁直观**  
   合并逻辑一目了然，尤其适合在对象字面量中快速扩展属性，代码可读性更高：

   ```javascript
   const newObj = { id: 1, ...baseInfo, ...extraInfo } // 清晰表达「基础属性 + 扩展属性」
   ```

3. **支持局部覆盖与新增**  
   可以在合并时直接添加或覆盖属性，无需额外操作：
   ```javascript
   const merged = { ...obj1, a: 100, c: 3 } // 用 100 覆盖 obj1 的 a 属性，新增 c 属性
   ```

#### 劣势：

1. **不支持修改现有对象**  
   只能创建新对象，若需要在原有对象上扩展属性（而非创建新对象），则不如 `Object.assign()` 直接。

2. **多源合并时性能略低（理论上）**  
   在合并大量对象或大型对象时，展开运算符的底层实现可能比 `Object.assign()` 多一次临时对象创建（视 JS 引擎优化而定，多数场景可忽略）。

3. **早期环境兼容性较差**  
   作为 ES2018 引入的特性，在非常旧的浏览器（如 IE 全版本）中不支持，需要 Babel 转译；而 `Object.assign()` 虽然也是 ES6 特性，但更早被广泛支持（且 polyfill 更成熟）。

### 三、共同限制：均为浅拷贝

两种方法对「嵌套对象」的处理一致：只会复制嵌套对象的引用，而非深拷贝。修改合并后对象中的嵌套属性，会同步影响原对象：

```javascript
const obj1 = { nested: { x: 1 } }
const merged1 = Object.assign({}, obj1)
const merged2 = { ...obj1 }

merged1.nested.x = 100
console.log(obj1.nested.x) // 100（原对象被修改）
merged2.nested.x = 200
console.log(obj1.nested.x) // 200（原对象被修改）
```

### 四、选择建议

- 若需**创建新对象且保持原对象不变**（如 React 状态更新、不可变数据处理）：优先用展开运算符，语法更简洁，符合不可变理念。
- 若需**在现有对象上扩展属性**（如动态给实例添加方法）：优先用 `Object.assign()`，避免创建不必要的新对象。
- 若需**深拷贝合并**（处理嵌套对象）：两种方法都不适用，需使用 `JSON.parse(JSON.stringify())`（有限制）或 Lodash 的 `_.merge()` 等工具。

## 9. 默认参数值

```js
function greet(name = 'default') {
  console.log(`Hello, ${name}!`)
}

greet() // 输出：Hello, default!
greet('Alice') // 输出：Hello, Alice!
```

## 10. 字符串转数字

```js
// 传统写法
const num = parseInt('123')
console.log(num) // 123（数字类型）
// 简洁写法
const num1 = +'123'
console.log('+:' + num1) // 123（数字类型）
const num2 = '123' - 0
console.log('-0:' + num2) // 123（数字类型）
const num3 = '123' * 1
console.log('*1:' + num3) // 123（数字类型）
const num4 = '123' / 1
console.log('/1:' + num4) // 123（数字类型）
const num5 = ~~'123'
console.log('~~:' + num5) // 123（数字类型）
const num6 = '123' << 0
console.log('<<0:' + num6) // 123（数字类型）
const num7 = '123' >> 0
console.log('>>0:' + num7) // 123（数字类型）
const num7_1 = '123' >>> 0
console.log('>>>0:' + num7_1) // 123（数字类型）
const num8 = '123' | 0
console.log('|0:' + num8) // 123（数字类型）
const num9 = '123' ^ 0
console.log('^0:' + num9) // 123（数字类型）
❌ const num10 = '123' & 0
console.log('&0:' + num10) // 0
❌ const num10_1 = '123' & 1
console.log('&1:' + num10_1) // 1（数字类型）
const num10_2 = '123' & 0b11111111 // 0b11111111（二进制）0b 是二进制前缀，0b11111111 表示 8 位全为 1 的二进制数，转换为十进制是 255，所以只能转化小于255的数字
console.log('&0b11111111:' + num10_2) // 123（数字类型）
❌const num10_3 = '256' & 0b11111111 // 0b11111111（二进制）0b 是二进制前缀，0b11111111 表示 8 位全为 1 的二进制数，转换为十进制是 255
console.log('&0b11111111:' + num10_3) // 0（256 转换为二进制是 100000000，与 0b11111111 按位与结果为 0）
const num11 = Number('123')
console.log('Number():' + num11) // 123（数字类型）
```

在 JavaScript 中，除了 `+` 运算符，还有几种简洁的方式可以将字符串（或其他类型）转换为数字，它们本质上都是利用**隐式类型转换**或**简洁的显式转换**，但在细节上有差异：

### 1. `- 0`（减 0 运算）

通过减法运算触发类型转换，效果与 `+` 类似，会完整保留数值（包括小数）：

```javascript
const num1 = '123' - 0 // 123（数字）
const num2 = '45.67' - 0 // 45.67（保留小数）
const num3 = '123a' - 0 // NaN（无法转换时返回 NaN）
```

### 2. `* 1` 或 `/ 1`（乘 1 或除 1 运算）

通过乘法/除法运算触发转换，与 `+` 和 `-0` 行为一致，保留完整数值：

```javascript
const num1 = '123' * 1 // 123
const num2 = '45.67' / 1 // 45.67
const num3 = '0' * 1 // 0
```

### 3. `~~`（双波浪号，按位非运算）

通过两次按位非运算触发转换，**会自动取整**（向零取整），适合整数场景：

```javascript
const num1 = ~~'123' // 123（整数正常转换）
const num2 = ~~'45.67' // 45（自动截断小数）
const num3 = ~~'-78.9' // -78（负数也向零取整）
```

⚠️ 注意：`~~` 本质是处理 32 位有符号整数，超出范围（-2³¹ 到 2³¹-1）会失真。

### 4. `Number()`（显式转换函数）

虽然是函数形式，但写法简洁，功能与 `+` 完全一致（保留完整数值，无法转换时返回 NaN）：

```javascript
const num1 = Number('123') // 123
const num2 = Number('45.67') // 45.67
const num3 = Number('') // 0（空字符串特殊处理为 0）
```

### 与 `parseInt()` 的核心区别

这些简写方式和 `parseInt()` 最大的差异在于：

- **`parseInt()`**：会从左到右解析字符串，遇到非数字字符就停止（如 `parseInt('123a')` 结果为 `123`），且默认只处理整数（需要第二个参数指定进制）。
- **上述简写方式**：必须整个字符串能被完整转换为数字，否则返回 `NaN`（如 `+'123a'` 结果为 `NaN`）。

### 适用场景总结

- 若需**完整保留数值（包括小数）**：优先用 `+`、`-0`、`*1`、`/1` 或 `Number()`。
- 若需**转换为整数（自动截断小数）**：用 `~~`（适合整数场景，注意范围限制）。
- 若需**解析含非数字字符的字符串（如 `'123px'`）**：必须用 `parseInt()`。

上面（`<< 0`、`>> 0`、`>>> 0`、`| 0`、`^ 0`、`& 0`）本质上是利用**位运算符的特性**实现字符串到数字的转换。它们的核心原理是：**位运算符只能作用于数字类型**，当操作数是字符串时，JavaScript 会先自动将其转换为数字，再执行位运算。而由于运算本身（如与0运算、移位0位）对数值的“副作用”为零，最终结果就等同于“将字符串转换为数字”。

### 具体原理与特点分析

#### 1. 左移0位（`<< 0`）与右移0位（`>> 0`）

- **原理**：移位0位时，运算本身不改变数值大小，但会强制将操作数转换为**32位有符号整数**（范围：-2³¹ ~ 2³¹-1）。
- **转换逻辑**：
  - 先将字符串转换为数字（若无法转换则为`NaN`，参与位运算后结果为`0`）；
  - 再将数字截断为32位有符号整数（小数部分直接丢弃，超出范围则按32位循环处理）。

```javascript
console.log('123' << 0) // 123（正常转换为整数）
console.log('123.9' << 0) // 123（截断小数）
console.log('-456' >> 0) // -456（负数保留符号）
console.log('123a' << 0) // 0（无法转换为有效数字，结果为0）
```

#### 2. 无符号右移0位（`>>> 0`）

- **原理**：与`>> 0`类似，但会将结果转换为**32位无符号整数**（范围：0 ~ 2³²-1）。
- **特殊点**：对负数处理与有符号移位不同，会将负数的32位二进制补码视为无符号数（结果为正数）。

```javascript
console.log('123' >>> 0) // 123（正数与>>0结果一致）
console.log('-123' >>> 0) // 4294967173（负数转为无符号数，结果为大正数）
```

#### 3. 按位或0（`| 0`）

- **原理**：`x | 0` 表示“x与0进行按位或运算”，由于0的二进制全为0，结果等价于x本身，但会强制转换为**32位有符号整数**（与`<< 0`效果完全一致）。
- **特点**：语法更简洁，是常见的“快速取整+类型转换”技巧。

```javascript
console.log('123' | 0) // 123
console.log('123.9' | 0) // 123（截断小数）
console.log('2147483648' | 0) // -2147483648（超出32位有符号范围，溢出处理）
```

#### 4. 按位异或0（`^ 0`）

- **原理**：`x ^ 0` 表示“x与0进行按位异或运算”，异或0的结果等价于x本身，但同样会强制转换为**32位有符号整数**（效果同`| 0`、`<< 0`）。

```javascript
console.log('123' ^ 0) // 123
console.log('45.6' ^ 0) // 45（截断小数）
```

#### 5. 按位与0（`& 0`） ❌ 完全放弃这种方式，想都不要想的那种

- **原理**：`x & 0` 表示“x与0进行按位与运算”，由于0的二进制全为0，结果**恒为0**（与x的值无关）。
- **❌**：`'123' & 0` 的实际结果应该是`0`，示例：

```javascript
console.log('123' & 0) // 0（无论x是多少，与0按位与结果都是0）
console.log('456' & 0) // 0
```

### 这些方法的共同特点与局限

#### 共同点：

1. **强制类型转换**：均会先将字符串（或其他类型）转换为数字，转换规则与`Number()`一致（无法转换则为`NaN`，参与位运算后结果为`0`）。
2. **整数截断**：都会自动丢弃小数部分，只保留整数（本质是32位整数处理）。
3. **32位范围限制**：结果被限制在32位整数范围内（有符号或无符号，取决于运算符），超出范围会产生“溢出”（如`2147483648 | 0` 结果为 `-2147483648`）。

#### 局限性：

1. **不适合浮点数**：会强制截断小数，若需要保留小数（如`'123.45'`转`123.45`），不能用这些方法。
2. **大整数失真**：超过32位范围的整数会被截断（如`'10000000000' | 0` 结果为 `1410065408`，因溢出导致失真）。
3. **负数处理差异**：`>>> 0` 会将负数转为无符号大整数，可能不符合预期。

### 与其他转换方式的对比

| 转换方式             | 特点                                 | 适合场景                   |
| -------------------- | ------------------------------------ | -------------------------- |
| `+x` / `Number(x)`   | 保留完整数值（包括小数），无范围限制 | 需保留小数或大整数的场景   |
| `~~x`                | 32位有符号整数，截断小数             | 明确需要整数且范围较小时   |
| `x \| 0` 或 `x << 0` | 同`~~x`，语法略有差异                | 习惯位运算写法的场景       |
| `x >>> 0`            | 32位无符号整数，负数转大正数         | 需处理无符号整数的特殊场景 |

### 总结

这些位运算简写本质是利用“位运算符强制转换为32位整数”的特性，实现“字符串→数字+取整”的双重效果。适合场景：

- 需要快速将字符串转换为整数（且数值在32位范围内）；
- 代码追求极致简洁（如压缩代码时）。

但需注意它们的整数截断和范围限制，处理浮点数或大整数时，更推荐用`+x`或`Number(x)`。

## 11. 多重条件判断

```js
// 传统写法
if (value !== null && value !== undefined && value !== '') {
  // ...
}

// 简写方式
if (![null, undefined, ''].includes(value)) {
  // ...
}
```

这两种写法的**核心功能完全一致**：都是判断变量 `value` 是否**既不是 `null`、也不是 `undefined`、也不是空字符串 `''`**。但它们在语法形式、可读性和适用场景上有细微差异，具体分析如下：

### 一、传统写法：`if (value !== null && value !== undefined && value !== '')`

#### 原理：

通过**逻辑与（`&&`）** 连接三个独立的判断条件，只有当所有条件都为 `true` 时，整个表达式才为 `true`：

- `value !== null`：排除 `null`
- `value !== undefined`：排除 `undefined`
- `value !== ''`：排除空字符串

#### 优势：

1. **直观易懂**：每个判断条件都清晰列出，即使是对 JavaScript 语法不熟悉的开发者也能快速理解逻辑（“value 不等于 null，并且不等于 undefined，并且不等于空字符串”）。
2. **兼容性极佳**：`!==` 和 `&&` 是 JavaScript 最基础的语法，支持所有浏览器（包括 IE 等旧环境），无需担心兼容性问题。
3. **性能略优（理论上）**：直接进行三次比较运算，无需额外创建数组或调用方法，在极端高频次执行的场景（如百万次循环）中，性能损耗会略低于简写方式。

#### 劣势：

1. **代码冗余**：重复书写 `value !==`，当需要判断的“排除值”增多时（比如再加上 `0`、`false` 等），代码会变得更长。  
   例：如果还要排除 `0`，则需写成 `value !== null && value !== undefined && value !== '' && value !== 0`，显得繁琐。

### 二、简写方式：`if (![null, undefined, ''].includes(value))`

#### 原理：

1. 先创建一个包含“需要排除的值”的数组 `[null, undefined, '']`；
2. 调用数组的 `includes()` 方法，判断 `value` 是否在这个数组中（即 `value` 是否是需要排除的值）；
3. 用 `!`（逻辑非）取反，最终结果为 `true` 时，表示 `value` 不在排除列表中（即符合我们需要的条件）。

#### 优势：

1. **代码简洁**：用数组集中管理“排除值”，避免重复书写 `value !==`，尤其当排除值较多时，优势更明显。  
   例：排除 `null`、`undefined`、`''`、`0` 时，简写为 `![null, undefined, '', 0].includes(value)`，比传统写法紧凑很多。
2. **扩展性好**：需要新增或删除排除值时，只需修改数组中的元素，无需调整逻辑运算符，维护更方便。

#### 劣势：

1. **可读性依赖经验**：对不熟悉 `includes()` 方法的开发者来说，可能需要反应一下逻辑（“先判断是否在数组中，再取反”），不如传统写法直观。
2. **兼容性限制**：`Array.prototype.includes()` 是 ES2016（ES7）引入的方法，在 IE 浏览器中完全不支持，在其他旧环境中也可能需要 polyfill（兼容处理）。
3. **轻微性能开销**：每次执行都会创建一个新数组，并且 `includes()` 方法需要遍历数组查找元素（虽然对短数组来说影响极小），理论上比传统写法多一点性能消耗（多数场景可忽略）。

### 三、核心共同点：判断逻辑完全等价

两种写法的判断逻辑是**严格一致**的，因为：

- `includes()` 方法内部使用**严格相等（`===`）** 进行比较，与传统写法的 `!==` 逻辑对应；
- 最终都是筛选出“既不是 `null`、也不是 `undefined`、也不是空字符串”的值。

### 四、选择建议

- 若团队中有较多新手，或需要兼容 IE 等旧环境：优先用传统写法，保证可读性和兼容性。
- 若项目只需要支持现代浏览器（如 Chrome、Firefox、Edge 等），且追求代码简洁性：推荐用简写方式，尤其当排除值较多时，维护成本更低。

## 12. 交换变量值

```js
let a = 1,
  b = 2
// 传统写法
let temp = a
a = b
b = temp
// 简写方式
;[a, b] = [b, a]
console.log(a, b) // 2 1
```

`[a, b] = [b, a]` 这种交换变量值的写法，**本质是利用了 ES6 引入的数组解构赋值（Array Destructuring Assignment）特性**，其原理可以拆解为以下两步：

### 1. 右侧先创建一个“临时数组”

执行 `[b, a]` 时，JavaScript 会先创建一个新数组，数组的第一个元素是变量 `b` 的**当前值**，第二个元素是变量 `a` 的**当前值**。  
这里的关键是：**这个数组保存的是变量交换前的原始值**，不会受后续赋值操作的影响。

### 2. 左侧通过解构赋值“提取并交换”

`[a, b] = ...` 是数组解构赋值的语法：左侧的数组模式（`[a, b]`）会从右侧的数组中依次提取元素，并赋值给对应的变量。  
具体来说：

- 右侧数组的第一个元素（`b` 的原始值）会被赋值给左侧的 `a`；
- 右侧数组的第二个元素（`a` 的原始值）会被赋值给左侧的 `b`。

### 为什么能实现交换？

核心原因是**右侧数组先保存了原始值**，避免了传统交换中“临时变量”的需求。  
对比传统的“临时变量法”更易理解：

```javascript
// 传统写法：需要临时变量保存原始值
let temp = a // 保存a的原始值
a = b // 用b的原始值覆盖a
b = temp // 用a的原始值（存在temp中）覆盖b
```

而 `[a, b] = [b, a]` 中，右侧的 `[b, a]` 本质上就扮演了“临时存储容器”的角色，先保存 `b` 和 `a` 的原始值，再通过解构赋值完成交换，逻辑与传统写法一致，但语法更简洁。

### 与解构赋值的关系

**完全相关**。这种写法是数组解构赋值的典型应用场景。  
解构赋值的核心功能就是“从数组或对象中提取值，并按对应位置赋值给变量”，而变量交换正是利用了这一特性：通过数组结构“按位置提取原始值”并“按位置重新赋值”。

### 注意事项

1. **变量必须可修改**：被交换的变量不能是 `const` 声明的（因为 `const` 变量不可重新赋值），需用 `let` 声明。  
   例：`let a = 1, b = 2; [a, b] = [b, a];`（正确）  
   例：`const a = 1, b = 2; [a, b] = [b, a];`（报错，const 不可修改）

2. **支持多变量交换**：解构赋值支持同时交换多个变量，语法同样简洁：
   ```javascript
   let x = 1,
     y = 2,
     z = 3
   ;[x, y, z] = [z, x, y] // 交换后：x=3, y=1, z=2
   ```

### 总结

`[a, b] = [b, a]` 是数组解构赋值的典型应用，其原理是：

1. 右侧先创建包含 `b` 和 `a` 原始值的临时数组；
2. 左侧通过解构赋值，将临时数组中的值按位置分别赋给 `a` 和 `b`，从而实现交换。

这种写法比传统的“临时变量法”更简洁，是 ES6 后推荐的变量交换方式。

## 13. 字符串只保留数字

```js
let str = '123a456b789'
// 正则表达式
str = str.replace(/[^\d]/g, '') // \d：表示一个十进制的数字 [0-9]
console.log(str) // 123456789
// 或者
str = str.replace(/\D/g, '') // \D：表示非数字字符
console.log(str) // 123456789
```

或者先将字符串转换为数组，再利用 `filter()` 方法过滤出数字字符，最后用 `join()` 方法拼接起来。

```js
const str = '123a456b789'
const result = str
  .split('')
  .filter(ch => !isNaN(ch))
  .join('')
console.log(result) // 123456789
```

## 14. 去掉空格

```js
let str = ' 123 a456 b789 '
// 正则表达式
str = str.replace(/\s+/g, '') // \s：表示空白字符（包括空格、制表符、换行符等）
console.log(str) // 123a456b789
```

**/\s+/g和/\s/g的区别**:

- `/\s+/g`：表示匹配**一个或多个**连续的空白字符（包括空格、制表符、换行符等）。
- `/\s/g`：表示匹配**任意一个**空白字符（包括空格、制表符、换行符等）。

```js
let str = 'we   are  friends'
let result = str.replace(/\s+/g, '*')
console.log(result) // we*are*friends
let result2 = str.replace(/\s/g, '*')
console.log(result2) // we***are**friends
```

或者

```js
const str = ' 123 a456 b789 '
const result = str
  .split('')
  .filter(ch => ch !== ' ')
  .join('')
console.log(result) // 123a456b789
```

## 15. 去掉指定字符

```js
const str = ' 123 a456 b789 '
const result = str.replace(/[ab]/g, '') // []:表示匹配方括号中的任意一个字符
console.log(result) //  123 456 789
console.log(str.replace(/[a b]/g, '')) // 123456789
```

或者

```js
const str = ' 123 a456 b789 '
const result = str
  .split('')
  .filter(ch => !['a', 'b'].includes(ch))
  .join('')
console.log(result) // 123 456 789
```

# 参考

[16 个 JavaScript 简写神技，提效 60%！](https://mp.weixin.qq.com/s/OfnTUDWr-sOmAl9CxeM2tg)
[前端必看：js字符串过滤的最优方式！](https://mp.weixin.qq.com/s/3mXz5f0_aysI0n0ZRbHb5g)
