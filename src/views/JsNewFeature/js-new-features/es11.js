const bigInt1 = 123456789012345678901234567890n

// 使用 BigInt() 构造函数创建 BigInt
const bigInt2 = BigInt('987654321098765432109876543210')

console.log(bigInt1) // 123456789012345678901234567890n
console.log(bigInt2) // 987654321098765432109876543210n

console.log(globalThis) // [object Window]


const obj = {
    a: {
        b: {
            c: 42
        }
    }
}

console.log(obj?.a?.b?.c) // 42
console.log(obj?.a?.b?.d) // undefined
console.log(obj?.a?.b?.d?.e) // undefined


const foo = null ?? 'default string'
console.log(foo) // 'default string'
const feature = undefined ?? 'ES2020'
console.log(feature) // 'ES2020'
const bar = 0 ?? 42
console.log(bar) // 0
const baz = '' ?? 'fallback'
console.log(baz) // ''
