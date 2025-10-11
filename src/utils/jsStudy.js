// js使用技巧笔记代码
console.log('js使用技巧笔记代码============================================================================')
//1. 从对象中提取属性
const user = {
    profile: { name: '张三', age: 30 },
    address: { city: '北京' }
}
const {
    profile: { name: userName, age: userAge },
    address: { city: userCity }
} = user
console.log(userName, userAge, userCity)
//2. 数组去重
const arr = [1, 2, 2, 3, 4, 4, 5]
arr.map((item, index) => {
    console.log('indexOf:', arr.indexOf(item), 'index:', index, 'item:', item)
})
const uniqueItems = arr.filter((item, index) => arr.indexOf(item) === index)
console.log('去重后的数组:', uniqueItems)
const arr2 = [1, 2, 2, 3, 4, 4, 5, NaN, NaN]
const unique = arr => [...new Set(arr)]
console.log('去重后的数组:', unique(arr2))
const unique2 = arr => Array.from(new Set(arr))
console.log('去重后的数组:', unique2(arr2))
const uniqueReduce = arr2.reduce((acc, cur) => {
    if (!acc.includes(cur)) {
        acc.push(cur)
    }
    return acc
}, [])
console.log('去重后的数组:', uniqueReduce)
//输出：[1, 2, 3, 4, 5]

const arr3 = [1, 2, 2, 3, 4, 4, 5, 2, 2, 3]
for (let i = 0; i < arr3.length; i++) {
    for (let j = i + 1; j < arr3.length; j++) {
        if (arr3[i] === arr3[j]) {
            arr3.splice(j, 1)
            j-- // 删除元素后，索引 j 会减 1，需要重新比较当前元素与新的下一个元素
        }
    }
}
console.log('去重后的数组for:', arr3)

const uniqueObj = arr => {
    // 用reduce遍历，初始值为{}
    const obj = arr.reduce((acc, item) => {
        acc[item] = item // 给累积器添加属性
        return acc // 返回更新后的累积器
    }, {})
    return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj(arr2))
const arr4 = [{ a: 1 }, { a: 1 }, { a: 2 }]
const uniqueObj2 = arr => {
    const obj = {}
    for (const item of arr) {
        const key = JSON.stringify(item)
        obj[key] = item // 存储属性
    }
    return Object.values(obj)
}
console.log('去重后的数组:', uniqueObj2(arr4))
//输出：[{a:1}, {a:2}]
const age = 17
const isAdult = (age >= 18 && '是') || '否'
console.log(isAdult) // 输出：是
const user1 = { name: null }
const name =
    user1.name !== null && user1.name !== undefined ? user1.name : 'default'
//2 空值合并运算符写法
const name1 = user1.name ?? 'default'
console.log(name, name1)
const obj1 = { a: 1, b: 2 }
const obj2 = { b: 3, c: 4 }
const merged = Object.assign({}, obj1, obj2)
const merged1 = { ...obj1, ...obj2 }
console.log(merged, merged1)
// 字符串转换为数字
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
const num10 = '123' & 0
console.log('&0:' + num10) // 0
const num10_1 = '123' & 1
console.log('&1:' + num10_1) // 1（数字类型）
const num10_2 = '123' & 0b11111111 // 0b11111111（二进制）0b 是二进制前缀，0b11111111 表示 8 位全为 1 的二进制数，转换为十进制是 255，所以只能转化小于255的数字
console.log('&0b11111111:' + num10_2) // 123（数字类型）
const num10_3 = '256' & 0b11111111 // 0b11111111（二进制）0b 是二进制前缀，0b11111111 表示 8 位全为 1 的二进制数，转换为十进制是 255
console.log('&0b11111111:' + num10_3) // 0（256 转换为二进制是 100000000，与 0b11111111 按位与结果为 0）
const num11 = Number('123')
console.log('Number():' + num11)
// 从字符串中提取数字
const str = '123a456b789'
const result = str
    .split('')
    .filter(ch => !isNaN(ch))
    .join('')
console.log(result) // 123456789
let str2 = ' 123 a456 b789 '
// 正则表达式
str2 = str2.replace(/\s+/g, '') // \s：表示空白字符（包括空格、制表符、换行符等）
console.log(str2) // 123a456b789

const str3 = ' 123 a456 b789 '
const result2 = str3
    .split('')
    .filter(ch => !['a', 'b'].includes(ch))
    .join('')
console.log(result2) // 123 456 789
console.log(str3.replace(/[a b]/g, ''))
const str4 = 'we   are  friends'
const result4 = str4.replace(/\s+/g, '*')
console.log(result4) // we*are*friends
const result5 = str4.replace(/\s/g, '*')
console.log(result5) // we***are**friends
console.log('js使用技巧笔记代码============================================================================结束')