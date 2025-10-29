const arr = [1, 2, 3, 4, 5]
const newArr = arr.with(2, 6)
console.log(newArr) // [1, 2, 6, 4, 5]
console.log(arr) // [1, 2, 3, 4, 5]
arr[3] = 7
console.log(arr) // [1, 2, 3, 7, 5]

const newArr1 = arr.toSpliced(2, 2, 6, 8)
console.log(newArr1) // [1, 2, 6, 8, 5]
console.log(arr) // [1, 2, 3, 7, 5]

const newArr2 = arr.toSorted((a, b) => a - b)
console.log(newArr2) // [1, 2, 3, 5, 7]
console.log(arr) //   [1, 2, 3, 7, 5]

const newArr3 = arr.toReversed()
console.log(newArr3) //  [5, 7, 3, 2, 1]
console.log(arr) //  [1, 2, 3, 7, 5]

const weakMap = new WeakMap()
const symbolKey = Symbol('key')

class MyClass {
    constructor() {
        weakMap.set(this, { count: 0, symbolKey })
    }
    increment() {
        const data = weakMap.get(this)
        data.count++
    }
    getSymbolKey() {
        return weakMap.get(this).symbolKey
    }
}
const myObj = new MyClass()
console.log(myObj.getSymbolKey()) // Symbol(key)

// 匹配所有拉丁字母
const latinReg = /\p{Script=Latin}/v;
console.log(latinReg.test('a')); // true（拉丁字母）
console.log(latinReg.test('α')); // false（希腊字母，非拉丁）

// 匹配所有非拉丁字母
const nonLatinRegex = /\P{Script=Latin}/v
console.log(nonLatinRegex.test('a')) // false
console.log(nonLatinRegex.test('α')) // true（希腊字母，非拉丁）

const turkishI = /\p{Uppercase_Letter}/v;
console.log(turkishI.test('İ')); // true（土耳其语大写I，u标志可能误判）

// 忽略大小写匹配
// const caseInsensitiveRegex = /hello/i
// console.log(caseInsensitiveRegex.test('Hello')) // true
// console.log(caseInsensitiveRegex.test('hello')) // true
// console.log(caseInsensitiveRegex.test('HELLO')) // true


const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const grouped = arr1.groupBy(x => (x % 2 === 0 ? 'even' : 'odd'))
console.log(grouped) // { even: [2, 4, 6, 8, 10], odd: [1, 3, 5, 7, 9] }
const groupedMap = arr1.groupByToMap(x => (x % 2 === 0 ? 'even' : 'odd'))
console.log(groupedMap) // Map(2) { 'even' => [2, 4, 6, 8, 10], 'odd' => [1, 3, 5, 7, 9] }

// function withMetadata(metadata) {
//     return (target) => {
//         // 使用Symbol.metadataKey存储元数据
//         if (!target[Symbol.metadataKey]) {
//             target[Symbol.metadataKey] = {};
//         }
//         Object.assign(target[Symbol.metadataKey], metadata);
//         return target;
//     };
// }
// @withMetadata({
//     name: 'MyExample',
//     version: '1.0.0'
// })
// class MyExample { }
// console.log(MyExample[Symbol.metadataKey]) // { name: 'MyExample', version: '1.0.0' }