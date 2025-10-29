const arr = [10, 20, 30, 40, 50]

// 从索引2开始正向查找大于25的元素
console.log(arr.findFrom(x => x > 25, undefined, 2)) // 30

// 从索引3开始反向查找小于35的元素
console.log(arr.findLastFrom(x => x < 35, undefined, 3)) // 30

// // 匹配所有表情符号（排除文字符号）
// const emojiRegex = /\p{Emoji}--\p{Emoji_Presentation=Text}/v;
// console.log(emojiRegex.test('😊')); // true（纯表情）
// console.log(emojiRegex.test('#'));  // false（文字符号）

// // 匹配所有大写字母或数字（交集）
// const alphaNumRegex = /[\p{Letter}&&\p{Uppercase}|\p{Number}]/v;
// console.log(alphaNumRegex.test('A')); // true
// console.log(alphaNumRegex.test('3')); // true
// console.log(alphaNumRegex.test('b')); // false

// 集合操作
// 交集（&&）：匹配同时属于两个集合的元素。
// const consonantRegex = /[a-z&&[aeiou]]/v
// console.log(consonantRegex.test('a')) // true（小写辅音字母）
// console.log(consonantRegex.test('A')) // false（大写辅音字母，非小写）
// 并集（||）：匹配属于至少一个集合的元素。
// const vowelRegex = /[a-z||[AEIOU]]/v
// console.log(vowelRegex.test('a')) // true（小写元音字母）
// console.log(vowelRegex.test('A')) // true（大写元音字母）
// console.log(vowelRegex.test('1')) // false（非字母）
// 补集（^）：匹配不属于集合的元素。
// const nonVowelRegex = /[a-z&&[^aeiou]]/v
// console.log(nonVowelRegex.test('a')) // false（小写元音字母）
// console.log(nonVowelRegex.test('A')) // false（大写元音字母，非小写）
// console.log(nonVowelRegex.test('1')) // true（非字母）


const asyncIterable = (async function* () {
    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000 * i))
        yield i
    }
})()

Array.fromAsync(asyncIterable).then(console.log) // [0, 1, 2, 3, 4]
Array.fromAsync(
    new Map([
        [1, 2],
        [3, 4]
    ])
).then(array => console.log(array))
// [[1, 2], [3, 4]]
Array.fromAsync(
    new Set([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
).then(array => console.log(array))
// [1, 2, 3]
Array.fromAsync({
    length: 3,
    0: Promise.resolve(1),
    1: Promise.resolve(2),
    2: Promise.resolve(3),
}).then((array) => console.log(array));
// [1, 2, 3]
function delayedValue(v) {
    return new Promise((resolve) => setTimeout(() => resolve(v), 100));
}
Array.fromAsync(
    [delayedValue(1), delayedValue(2), delayedValue(3)],
    (element) => delayedValue(element * 2),
).then((array) => console.log(array));
// [2, 4, 6]
Array.fromAsync(
    (async function* () {
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 100))
            yield i
        }
    })(),
    element => delayedValue(element * 2)
).then(array => console.log(array))
// [0, 2, 4]
// 这是一个常见的演示函数，它创建并返回一个异步可迭代对象
async function* createAsyncIter() {
    yield Promise.resolve(1); // 第一次迭代产生 Promise 1
    yield Promise.resolve(2); // 第二次迭代产生 Promise 2
    // yield Promise.reject(2); // 第四次迭代产生 Promise 4
    yield Promise.resolve(3); // 第三次迭代产生 Promise 3

}

// 示例用法：
async function processAsync() {
    // 使用 Array.fromAsync() 将异步源转换为数组
    // Array.fromAsync(createAsyncIter(), (element) => element * 2).then((array) => console.log(array)); // [2, 4, 6]
    // Array.fromAsync(createAsyncIter(), element => element).then((array) => console.log(array));// [1, 2, 3]
    Array.fromAsync(createAsyncIter()).then((array) => console.log(array)); // [1, 2, 3]
    Array.fromAsync(createAsyncIter()).then(console.log);
    // Array.fromAsync(createAsyncIter(), async (element) => (await element) * 2).then((array) => console.log(array)); //[2, 4, 6]
}

processAsync();