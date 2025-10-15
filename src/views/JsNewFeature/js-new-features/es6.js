console.log('es6新增============================================================================')
// # 2.箭头函数-------------------------------------------------------------------------------------
const add = (a, b) => a + b
console.log(add(1, 2)) // 3
// # 3.对象字面量增强-------------------------------------------------------------------------------------
const name_3 = 'lily'
const age_3 = 25
const obj = { name_3, age_3 }
console.log(obj)
const obj_1 = {
    name: 'lily',
    age: 25,
    sayName() {
        console.log(this.name)
    }
}
obj_1.sayName()
const name_1 = 'name'
const age_1 = 'age'
const obj_2 = { [name_1]: 'lily', [age_1]: 25 }
console.log(obj_2)
class Animal {
    constructor(name) {
        this.name = name
    }
    sayName() {
        console.log(this.name)
    }
}
class Cat extends Animal {
    constructor(name) {
        super(name)
    }
    sayName() {
        super.sayName()
    }
}
const cat = new Cat('kitty')
cat.sayName()

const user_1 = {
    name: 'lily',
    greet() {
        return `hello ${this.name}!`
    }
}
const admin = {
    __proto__: user_1, //  直接在这里设置原型！
    name: '管理员',
    role: 'admin'
}
console.log(admin.greet()) // hello 管理员!
console.log(admin.role) // admin
console.log(Object.getPrototypeOf(admin) === user_1) // true
const admin_1 = {
    __proto__: user_1, //  直接在这里设置原型！
    name: '管理员',
    role: 'admin',
    greet() {
        const parentGreeting = super.greet()
        return `${parentGreeting} I have special permissions.`
    }
}
console.log(admin_1.greet()) // hello 管理员! I have special permissions.
//# 4.for...of 循环-------------------------------------------------------------------------------------
const arr = [1, 2, 3]
for (const item of arr) {
    console.log(item)
}
//# 5.新增内置对象API-------------------------------------------------------------------------------------------------
const target = { a: 1, b: 2 }
const source = { b: 4, c: 5 }
Object.assign(target, source)
console.log(target) // { a: 1, b: 4, c: 5 }
console.log(Object.is(NaN, NaN)) // true
console.log(Object.is(-0, 0)) // false
const obj_5 = { a: 1, b: 2, c: 3 }
console.log(Object.keys(obj_5)) // ['a', 'b', 'c']
console.log(Object.values(obj_5)) // [1, 2, 3]
console.log(Object.entries(obj_5)) // [['a', 1], ['b', 2], ['c', 3]]
const obj_5_1 = { a: 1, b: 2 }
console.log(Object.getOwnPropertyDescriptors(obj_5_1))
// {
//   a: { value: 1, writable: true, enumerable: true, configurable: true },
//   b: { value: 2, writable: true, enumerable: true, configurable: true }
// }
const obj_5_2 = { a: 1, b: 2 }
const sym = Symbol('sym')
obj_5_2[sym] = 3
console.log(Object.getOwnPropertySymbols(obj_5_2)) // [Symbol(sym)]
const obj_5_3 = { a: 1, b: 2 }
const proto = { c: 3 }
Object.setPrototypeOf(obj_5_3, proto)
console.log(obj_5_3.__proto__) // { c: 3 }
console.log(Object.getPrototypeOf(obj_5_3)) // { c: 3 }
const str = 'hello'
const arr_5_1 = Array.from(str)
console.log(arr_5_1) // ['h', 'e', 'l', 'l', 'o']
const arr_5_2 = Array.of(1, 2, 3)
console.log(arr_5_2) // [1, 2, 3]
const arr_5_3 = [1, 2, 3]
console.log(arr_5_3.includes(2)) // true
console.log(arr_5_3.includes(4)) // false
const arr_5_4 = [1, 2, 3, 4, 5]
console.log(arr_5_4.find(item => item > 3)) // 4
console.log(arr_5_4.findIndex(item => item > 3)) // 3
const arr_5_5 = [1, 2, 3, 4, 5]
arr_5_5.fill(0)
console.log(arr_5_5) // [0, 0, 0, 0, 0]
const arr_5_6 = [1, 2, 3, 4, 5]
arr_5_6.copyWithin(0, 2, 4)
console.log(arr_5_6) // [3, 4, 3, 4, 5]
const arr_5_7 = [1, 2, 3]
const iterator = arr_5_7.entries()
console.log(iterator.next().value) // [0, 1]
console.log(iterator.next().value) // [1, 2]
console.log(iterator.next().value) // [2, 3]
const arr_5_8 = [1, 2, 3]
const iterator_1 = arr_5_8.keys()
console.log(iterator_1.next().value) // 0
console.log(iterator_1.next().value) // 1
console.log(iterator_1.next().value) // 2
const arr_5_9 = [1, 2, 3]
const iterator_2 = arr_5_9.values()
console.log(iterator_2.next().value) // 1
console.log(iterator_2.next().value) // 2
console.log(iterator_2.next().value) // 3
const str_5_10 = 'hello'
console.log(str_5_10.includes('ll')) // true
console.log(str_5_10.includes('world')) // false
const str_5_11 = 'hello'
console.log(str_5_11.startsWith('he')) // true
console.log(str_5_11.startsWith('ll')) // false
const str_5_12 = 'hello'
console.log(str_5_12.endsWith('lo')) // true
console.log(str_5_12.endsWith('hello')) // true
const str_5_13 = 'hello'
console.log(str_5_13.repeat(3)) // 'hellohellohello'
console.log(Number.isNaN(NaN)) // true
console.log(Number.isNaN(123)) // false
console.log(Number.isFinite(123)) // true
console.log(Number.isFinite(Infinity)) // false
console.log(Number.isInteger(123)) // true
console.log(Number.isInteger(123.456)) // false
console.log(Number.isSafeInteger(123)) // true
console.log(Number.isSafeInteger(12345678901234567890)) // false
console.log(Number.EPSILON) // 2.220446049250313e-16
console.log(Math.trunc(123.456)) // 123
console.log(Math.trunc(-123.456)) // -123
console.log(Math.sign(123)) // 1
console.log(Math.sign(-123)) // -1
console.log(Math.sign(0)) // 0
console.log(Math.sign(NaN)) // NaN
console.log(Math.imul(2, 3)) // 6
console.log(Math.imul(-2, 3)) // -6
console.log(Math.hypot(3, 4)) // 5
console.log(Math.hypot(3, 4, 5)) // 7.0710678118654755
console.log(Math.cbrt(8)) // 2
console.log(Math.cbrt(27)) // 3
console.log(Math.log2(8)) // 3
console.log(Math.log2(16)) // 4
console.log(Math.log10(100)) // 2
console.log(Math.log10(1000)) // 3
console.log(Math.log1p(1)) // 0.6931471805599453
console.log(Math.log1p(2)) // 1.0986122886681096
console.log(Math.expm1(1)) // 1.718281828459045
console.log(Math.expm1(2)) // 6.38905609893065
console.log(Math.sinh(1)) // 1.1752011936438014
console.log(Math.sinh(2)) // 3.626860407847019
console.log(Math.cosh(1)) // 1.5430806348152437
console.log(Math.cosh(2)) // 3.7621956910836314
console.log(Math.tanh(1)) // 0.7615941559557649
console.log(Math.tanh(2)) // 0.9640275800758169
console.log(Math.asinh(1)) // 0.881373587019543
console.log(Math.asinh(2)) // 1.4436354751788103
console.log(Math.acosh(1)) // 0.0
console.log(Math.acosh(2)) // 1.3169578969248166
console.log(Math.atanh(0.5)) // 0.5493061443340548
console.log(Math.atanh(0.9)) // 1.4722194895832204
console.log(Math.clz32(123)) // 25
console.log(Math.clz32(0b10000000000000000000000000000000)) // 0
console.log(Math.fround(123.456)) // 123.45600128173828
console.log(Math.fround(-123.456)) // -123.45600128173828
// # 6. 模板字符串（Template Literals）：-------------------------------------------------------------------------------------------------
const name_6 = 'lily'
const age_6 = 25
const info = `My name is ${name_6}, and I am ${age_6} years old.`
console.log(info) // My name is lily, and I am 25 years old.
// #7. 解构赋值（Destructuring Assignment）：-------------------------------------------------------------------------------------------------
const arr_7_1 = [1, 2, 3]
const [a, b, c] = arr_7_1
console.log(a, b, c) // 1 2 3

const obj_7_2 = { name: 'lily', age: 25 }
const { name, age } = obj_7_2
console.log(name, age) // lily 25
// # 8. 扩展运算符（Spread Operator）：-------------------------------------------------------------------------------------------------
const arr_8_1 = [1, 2, 3]
const arr_8_2 = [...arr_8_1, 4, 5, 6]
console.log(arr_8_2) // [1, 2, 3, 4, 5, 6]
const obj_8_2 = { name: 'lily', age: 25 }
const obj_8_2_2 = { ...obj_8_2, sex: 'male' }
console.log(obj_8_2_2) // { name: 'lily', age: 25, sex: 'male' }
// # 9. 函数参数扩展-------------------------------------------------------------------------------------------------------------------
const add_9_1 = (a = 0, b = 0) => a + b
console.log(add_9_1(1, 2)) // 3
console.log(add_9_1(1)) // 1
console.log(add_9_1()) // 0
const add_9_2 = (...args) => args.reduce((a, b) => a + b, 0)
console.log(add_9_2(1, 2, 3)) // 6
console.log(add_9_2(1, 2, 3, 4)) // 10
function foo(x, y, z) {
    return x + y + z
}
console.log(foo(...[1, 2, 3])) // 6
// # 15.Symbol-------------------------------------------------------------------------------------------------
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

const obj1 = {
    [s3]: 'value', // 用Symbol作为属性键（需用方括号）
    name: '张三'
}

// 遍历对象属性
for (const key in obj1) {
    console.log(key) // 仅输出 name（Symbol键不会被遍历到）
}

console.log(JSON.stringify(obj1)) // {"name":"张三"}（Symbol键被忽略）
console.log(Object.keys(obj1)) // ['name']（同样不包含Symbol键）
console.log(Object.getOwnPropertyNames(obj1)) // ['name']（同样不包含Symbol键）

console.log(Object.getOwnPropertySymbols(obj1)) // [Symbol(foo)]（返回所有Symbol键）
console.log(Reflect.ownKeys(obj1)) // ['name', Symbol(foo)]（包含所有键，包括Symbol）
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
// // # 16.Map-------------------------------------------------------------------------------------------------
// const map = new Map([
//     ['name', '张三', '李四'],
//     ['age', 20, 30]
// ])

// // 1. 遍历键
// for (const key of map.keys()) {
//     console.log(key) // 'name'、'age'
// }

// // 2. 遍历值
// for (const val of map.values()) {
//     console.log(val) // '张三'、20
// }

// // 3. 遍历键值对（默认）
// for (const [key, val] of map) {
//     console.log(key, val) // 'name' '张三'、'age' 20
// }

// // 4. forEach
// map.forEach((val, key) => {
//     console.log(key, val)
// })

// // # 17.unicode----------------------------------------------------------------------------------------------------
// /**
//  * 旧的Unicode 转义表示法
//  * \xXX:XX 必须是介于 00 与 FF 之间的两位十六进制数,所以它只能用于前 256 个 Unicode 字符。
//  * \uXX:XX 必须是介于 0000 与 FFFF 之间的四位十六进制数,所以它可以用于所有 Unicode 字符。
//  * */

// console.log("\xA9") // ©
// console.log("\u00A9") // ©
// // 新的Unicode 转义表示法
// console.log('\u{A9}') // ©
// console.log('\u{1F600}') // 😀
// console.log('\u{1F600}'.length) // 2
// console.log('\u{1F600}'.codePointAt(0)) // 128512

// const text = "你好𠮷";

// console.log(`字符串的 length 属性值: ${text.length}`);
// console.log('--- 使用传统的 for 循环 ---');

// for (let i = 0; i < text.length; i++) {
//     console.log(`索引 ${i}: ${text[i]}`);
// }
// console.log(`字符串的 length 属性值: ${text.length}`)
// console.log('--- 使用 ES6 的 for...of 循环 ---')

// for (const char of text) {
//     console.log(`字符: ${char}`)
// }