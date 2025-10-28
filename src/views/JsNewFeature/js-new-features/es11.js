// 顶层await
await new Promise(resolve => setTimeout(() => {
    console.log('1秒后执行')
    resolve(1)
}, 1000))
// BigInt 类型
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


const promises = [
    Promise.resolve('成功1'),
    Promise.reject('失败1'),
    Promise.resolve('成功2')
];
Promise.allSettled(promises)
    .then(results => {
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`Promise ${index + 1} 成功，值为: ${result.value}`);
            } else {
                console.log(`Promise ${index + 1} 失败，原因是: ${result.reason}`);
            }
        });
    });

Promise.all(promises)
    .then(results => {
        console.log('所有 Promise 都成功，结果为:', results);
    })
    .catch(error => {
        console.log('有一个或多个 Promise 失败，错误为:', error);
    });

const promise1 = Promise.resolve(3);
const promise2 = new Promise((resolve, reject) => setTimeout(reject, 100, 'foo'));
const promise3 = Promise.resolve(42);

Promise.allSettled([promise1, promise2, promise3])
    .then((results) => {
        console.log(results);
    });

// 输出：
// [
//   { status: 'fulfilled', value: 3 },
//   { status: 'rejected', reason: 'foo' },
//   { status: 'fulfilled', value: 42 }
// ]



const str = '2023-10, 2024-11';
const reg = /(\d{4})-(\d{2})/g;

// 用match()只能拿到整体匹配，丢失捕获组
console.log(str.match(reg)); // ["2023-10", "2024-11"]

// 用matchAll()拿到所有匹配+捕获组
const matches = str.matchAll(reg);
for (const match of matches) {
    console.log(match);
}
// 输出：
// 第一次：["2023-10", "2023", "10", ...]
// 第二次：["2024-11", "2024", "11", ...]


console.log(import.meta)
