//对象新增方法
const map = new Map([
    ['a', 1],
    ['b', 2]
])
console.log(Object.fromEntries(map)) // { a: 1, b: 2 }

const array = [
    ['a', 1],
    ['b', 2]
]
console.log(Object.fromEntries(array)) // { a: 1, b: 2 }
//数组新增方法
const arr = [1, [2, 3], [4, [5, 6]]]
console.log(arr.flat(2)) // [1, 2, 3, 4, 5, 6]
const arr1 = [1, [2, 3], [4, [5, 6]]]
console.log(arr1.flatMap(item => item)) // [1, 2, 3, 4, [5, 6]]
const arr2 = [1, 2, 3]
console.log(arr2.flatMap(item => item * 2)) // [2, 4, 6]
// 等价于
console.log(arr2.map(item => item * 2)) // [2, 4, 6]
//字符串新增方法
const str = '  hello world  '
console.log(str.trimStart()) // 'hello world  '
console.log(str.trimLeft()) // 'hello world  '
console.log(str.trimEnd()) // '  hello world'
console.log(str.trimRight()) // '  hello world'

//Symbol 新增属性
const sym = Symbol('description')
console.log(sym.description) // 'description'

//可选的 catch 绑定
try {
    // ...
    console.log('No error occurred1')
} catch (error) {
    console.log('An error occurred')
}
try {
    // ...
    console.log('No error occurred2')
} catch {
    console.log('An error occurred')
}
// 其他改进
// Function.prototype.toString() 改进
function foo(a = 1) {
    // 这是一个注释
    console.log(a)
}
console.log(foo.toString())
// 输出：
// function foo(a = 1) {
//     // 这是一个注释
//     console.log(a)
// }
const arr3 = [
    { name: 'Alice', age: 20 },
    { name: 'Bob', age: 20 },
    { name: 'Charlie', age: 25 }
]
arr3.sort((a, b) => a.age - b.age)
console.log(arr3)

const obj = {
    "name": "Alice",
    "age": 20,
    "address": "123 Main St.\u2028New York, NY 10001"
}
console.log(JSON.parse(JSON.stringify(obj)))
const arr4 = [1, 2, NaN, 4, 5]
console.log(arr4.includes(NaN)) // true（ES2019修复后）
console.log(arr4.indexOf(NaN)) // -1（indexOf仍无法识别）
