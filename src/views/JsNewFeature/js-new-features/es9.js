async function* asyncGenerator() {
    let i = 0
    while (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        yield i++
    }
}
; (async () => {
    for await (const num of asyncGenerator()) {
        console.log(num)
    }
})()

const obj = { a: 1, b: 2, c: 3 }
const obj2 = { e: 4, f: 5 }
const newObj = { ...obj, ...obj2, d: 4 }
console.log(newObj) // { a: 1, b: 2, c: 3, d: 4, e: 4, f: 5 }
// 浅拷贝
const objCopy = { ...obj }
console.log(objCopy) // { a: 1, b: 2, c: 3 }
// 更新属性值
const updatedObj = { ...obj, b: 5 }
console.log(updatedObj) // { a: 1, b: 5, c: 3 }

const obj3 = { a: 1, b: 2, c: 3, d: 4 }
const { a, b, ...rest } = obj3
console.log(a) // 1
console.log(b) // 2
console.log(rest) // { c: 3, d: 4 }

function myTag(strings) {
    console.log("strings (cooked):", strings);
    console.log("strings.raw (raw):", strings.raw);

    // 在这里可以自由地处理原始字符串，
    // 即使其中包含非法的转义序列
    console.log("非法转义序列的原始字符串:", strings.raw[0]);
}

// 在现代环境中，这行代码将正常执行，不会抛出错误
myTag`\unicode`;
myTag`\xG1`;
myTag`\88`;


function checkPromiseStatus(promise) {
    return new Promise((resolve, reject) => {
        Math.random() > 0.5 ? resolve('success') : reject('error')
    })
}
checkPromiseStatus(Promise)
    .then(result => {
        console.log('Resolved with:', result)
    })
    .catch(error => {
        console.log('Rejected with:', error)
    })
    .finally(() => {
        console.log('Promise has settled (either resolved or rejected)')
    })

// 正则
const regex = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/
const str = '2025-10-24'
const match = regex.exec(str)
console.log(match)
console.log(match.groups.year) // '2025'
console.log(match.groups.month) // '10'
console.log(match.groups.day) // '24'

const regex1 = /(?<=\$)\d+/
const str1 = 'Price: $100'
const match1 = regex1.exec(str1)
console.log(match1, match1[0]) // '100'

const regex2 = /(?<!\$)\d+/
const str2 = 'Price: 100 and $200'
const match2 = regex2.exec(str2)
console.log(match2, match2[0]) // '100'

const text = 'hello\nworld'
console.log(text.match(/hello.world/)) // null
console.log(text.match(/hello.world/s)) // ['hello\nworld']

const text1 = 'hello 你好 123 😊'
console.log(text1.match(/\p{Number}/gu)) // ['1', '2', '3']
console.log(text1.match(/\p{Emoji}/gu)) //  ['1', '2', '3', '😊']
