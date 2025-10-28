var a = 0
a ||= 10 // a = 10
console.log(a) // 10


let b = 10
b &&= 20 // b = 20
console.log(b) // 20


let c = null
c ??= 30 // c = 30
console.log(c) // 30

let d = 1_000_000 // d = 1000000
console.log(d) // 1000000


const str = 'a-b-c'
console.log(str.replace(/-/g, '')) // newStr = 'abc'
console.log(str.replaceAll('-', '')) // newStr = 'abc'


Promise.any([
    Promise.reject('error1'),
    Promise.reject('error2'),
    Promise.resolve('success')
])
    .then(result => {
        console.log(result) // 'success'
    })
    .catch(errors => {
        console.log(errors) // AggregateError: All promises were rejected
    })



// 1. 创建终结器注册表：当缓存值被回收时，删除对应的缓存键
const cacheCleaner = new FinalizationRegistry(key => {
    console.log(`缓存值被回收，清理键: ${key}`)
    cache.delete(key) // 从缓存中删除键
})

// 2. 缓存本体（用Map存储键→弱引用值）
const cache = new Map()

// 3. 往缓存中添加数据
function addToCache(key, value) {
    // 用WeakRef弱引用value（不阻止GC回收value）
    const weakRef = new WeakRef(value)
    cache.set(key, weakRef)

    // 注册终结器：当value被回收时，触发cacheCleaner的回调（传入key用于清理）
    cacheCleaner.register(value, key)
}

// 4. 从缓存中获取数据
function getFromCache(key) {
    const weakRef = cache.get(key)
    if (weakRef) {
        return weakRef.deref() // 若value未被回收，返回它；否则返回undefined
    }
    return undefined
}

// 测试
let obj = { data: '需要缓存的数据' }
addToCache('obj1', obj)

console.log(getFromCache('obj1')) // { data: "需要缓存的数据" }（未被回收）

// 解除对obj的强引用（此时只有缓存中的弱引用）
obj = null

// 手动触发GC（实际环境中不可控，这里仅为演示）
// 浏览器中可在DevTools的Memory面板手动触发，Node.js中可用--expose-gc并调用global.gc()
// 触发后，obj会被回收，cacheCleaner的回调执行，cache中"obj1"被删除
console.log(getFromCache('obj1')) // undefined（已被清理）