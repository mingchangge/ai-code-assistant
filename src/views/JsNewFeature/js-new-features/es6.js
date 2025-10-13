console.log('es6新增============================================================================')
/**
 * Symbol 是一种新的原始数据类型，用于创建唯一的标识符。
 */
const s1 = Symbol()
console.log(typeof s1) // symbol（注意：小写，区分于Object等）

// 可以传入一个字符串作为"描述"（仅用于调试，不影响Symbol的唯一性）
const s2 = Symbol('description')
console.log(s2.toString()) // Symbol(description)

const s3 = Symbol('foo')
const s4 = Symbol('foo')
console.log(s3 === s4)

const obj = {
    [s3]: 'value', // 用Symbol作为属性键（需用方括号）
    name: '张三'
}

// 遍历对象属性
for (const key in obj) {
    console.log(key) // 仅输出 name（Symbol键不会被遍历到）
}

console.log(JSON.stringify(obj)) // {"name":"张三"}（Symbol键被忽略）
console.log(Object.keys(obj)) // ['name']（同样不包含Symbol键）
console.log(Object.getOwnPropertyNames(obj)) // ['name']（同样不包含Symbol键）

console.log(Object.getOwnPropertySymbols(obj)) // [Symbol(foo)]（返回所有Symbol键）
console.log(Reflect.ownKeys(obj)) // ['name', Symbol(foo)]（包含所有键，包括Symbol）
const s5 = Symbol('id')
const user = {
    [s5]: 1001, // 必须用方括号，否则会被当作字符串"[s5]"
    name: '李四'
}
console.log(user)
const user2 = {
    s5: 1002, // 必须用方括号，否则会被当作字符串"[s5]"
    name: '王五'
}
console.log(user2)
const s6 = Symbol('num')
// console.log(s6 + 1); // 报错：Cannot convert a Symbol value to a number
// console.log('symbol: ' + s6); // 报错：Cannot convert a Symbol value to a string
console.log('symbol: ' + s6.toString())
console.log(Boolean(Symbol())) // true
if (Symbol()) {
    console.log('执行') // 会执行
}
const s7 = Symbol.for('globalSymbol')
console.log(s7) // Symbol(globalSymbol)

// 获取全局Symbol的描述（如果不存在则返回undefined）
console.log(Symbol.keyFor(s7)) // globalSymbol
const iterableObj = {
    data: [1, 2, 3],
    // 定义迭代器
    [Symbol.iterator]() {
        let index = 0
        return {
            next: () => {
                if (index < this.data.length) {
                    return { value: this.data[index++], done: false }
                } else {
                    return { done: true }
                }
            }
        }
    }
}

// 现在可以用for...of遍历
for (const item of iterableObj) {
    console.log(item) // 1、2、3
}
const myObj = {
    [Symbol.toStringTag]: 'MyCustomObject'
}
console.log(myObj.toString()) // [object MyCustomObject]

const map = new Map([
    ['name', '张三', '李四'],
    ['age', 20, 30]
])

// 1. 遍历键
for (const key of map.keys()) {
    console.log(key) // 'name'、'age'
}

// 2. 遍历值
for (const val of map.values()) {
    console.log(val) // '张三'、20
}

// 3. 遍历键值对（默认）
for (const [key, val] of map) {
    console.log(key, val) // 'name' '张三'、'age' 20
}

// 4. forEach
map.forEach((val, key) => {
    console.log(key, val)
})