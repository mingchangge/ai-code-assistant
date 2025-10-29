const array = [1, 2, 3, 4, 5];
console.log(array.at(2)); // 3
console.log(array.at(-1)); // 5

const str = 'hello';
console.log(str.at(1)); // 'e'
console.log(str.at(-1)); // 'o'

const scores = [65, 80, 90, 70, 55]
const lastPassed = scores.findLast(v => v >= 60)
console.log(lastPassed) // 70
console.log(scores.findLastIndex(v => v < 60)) // 4

const obj = { a: 1, hasOwnProperty: 2 };
console.log(Object.hasOwn(obj, 'a')); // true
console.log(Object.hasOwn(obj, 'hasOwnProperty')); // true
console.log(Object.hasOwn(obj, 'toString')); // false

const obj1 = { a: 1, b: { c: 2 } }
const clonedObj = structuredClone(obj1)
console.log(clonedObj) // { a: 1, b: { c: 2 } }
console.log(clonedObj === obj1) // false（引用不同）
console.log(clonedObj.b === obj1.b) // false（引用不同）

const regex = /a(b+)c/d
const match = regex.exec('abc')
console.log(match)
// ['abc', 'b', index: 0, input: 'abc', indices: [[0, 3], [1, 2]] ...]

// 计数器类 - 私有字段和方法
class Counter {
    #count = 0 // 实例私有字段
    // 私有方法
    #inc() {
        this.#count++
    }
    // 公共方法：增加计数
    tick() {
        this.#inc()
    }
    // 公共方法：获取当前计数
    value() {
        return this.#count
    }
}
const counter = new Counter()
counter.tick()
console.log(counter.value()) // 1

// 计数器类 - 私有getter和setter
class Counter1 {
    #count = 0 // 实例私有字段
    // setter：增加计数
    set #inc(val) {
        this.#count = val
    }
    setValue(val) {
        this.#inc += val
    }
    // getter：获取当前计数
    get #inc() {
        return this.#count * 10
    }
    getValue() {
        return this.#inc
    }
}
const counter1 = new Counter1()
counter1.setValue(3)
console.log(counter1.getValue()) // 30

// 私有静态成员
class Counter2 {
    #count = 0 // 实例私有字段：每个实例独立的计数值
    static #zero = 0 // 静态私有字段：所有实例共享的初始值
    static #instanceCount = 0 // 静态私有字段：记录创建的实例数量
    static #totalTicks = 0 // 静态私有字段：记录所有实例的总操作次数

    constructor() {
        // 构造函数：创建实例时，增加实例计数
        Counter2.#instanceCount++
        console.log(`实例 ${Counter2.#instanceCount} 被创建`)
    }
    // 私有方法：增加实例计数
    #inc() {
        this.#count += 3
        // 增加总操作次数
        Counter2.#totalTicks++
    }
    // 公共方法：增加实例计数
    tick() {
        this.#inc()
        // 返回当前实例的计数值
        return this.#count
    }
    // 公共方法：获取当前实例的计数值
    value() {
        return this.#count
    }
    // 静态私有方法：重置静态计数器
    static #reset() {
        console.log(`重置前静态计数器：${this.#zero}`)
        this.#zero = 0
        console.log(`重置后静态计数器：${this.#zero}`)
    }
    // 公共方法：重置静态计数器
    static resetZero() {
        this.#reset()
        console.log('静态初始值计数器已重置')
    }
    // 公共方法：设置静态初始值
    // 设置静态初始值
    static setZero(val) {
        this.#zero = val
        console.log(`静态初始值已设置为：${this.#zero}`)
    }
    // 公共方法：获取当前静态初始值
    static getZero() {
        return this.#zero
    }
    // 公共方法：获取当前静态实例计数
    static getInstanceCount() {
        return this.#instanceCount
    }
    // 公共方法：获取当前静态总操作次数
    static getTotalTicks() {
        return this.#totalTicks
    }
}
const counterA = new Counter2()
counterA.tick()
counterA.tick()
console.log(counterA.value()) // 6
const counterB = new Counter2()
counterB.tick()
console.log(counterB.value()) // 3
// 访问静态方法
console.log(`当前静态初始值：${Counter2.getZero()}`)
console.log(`当前静态实例计数：${Counter2.getInstanceCount()}`)
console.log(`当前静态总操作次数：${Counter2.getTotalTicks()}`)
// 修改静态初始值
Counter2.setZero(100)
console.log(`当前静态初始值：${Counter2.getZero()}`)
// 重置静态计数器
Counter2.resetZero()
console.log(`重置后的静态零值: ${Counter2.getZero()}`)

// 私有字段的存在性检查
class Example {
    #count = 0
    static hasCountField(obj) {
        // 使用 'in' 运算符检查 obj 是否有 #count
        return #count in obj
    }
}
class SubExample extends Example { }
const myInstance = new Example();
const subInstance = new SubExample();
console.log(Example.hasCountField(myInstance)); // 输出：true
console.log(Example.hasCountField(subInstance)); // 输出：true
console.log(Example.hasCountField({})); // 输出：false

// 类静态初始化块
class Database {
    // 静态字段（待初始化）
    static host;
    static port;
    static #config; // 静态私有字段

    // 第一个静态初始化块：加载配置
    static {
        try {
            this.#config = JSON.parse(localStorage.getItem('dbConfig') ?? { host: 'localhost', port: 3306 });
        } catch (err) {
            // 配置加载失败时使用默认值
            this.#config = { host: 'localhost', port: 3306 };
        }
    }

    // 第二个静态初始化块：初始化host和port
    static {
        this.host = this.#config.host;
        this.port = this.#config.port;
    }
}

console.log(Database.host); // "localhost"
console.log(Database.port); // 3306

// 模拟数据库连接函数
function connectToDatabase() {
    try {
        // 模拟一个数据库连接失败
        throw new Error('Connection refused by database server');
    } catch (dbError) {
        // 捕获数据库错误，并抛出一个更高级别的错误
        throw new Error('Failed to initialize application due to database error', { cause: dbError });
    }
}

try {
    connectToDatabase();
} catch (appError) {
    console.error(appError.message); // Failed to initialize application due to database error
    console.error(appError.cause);   // Error: Connection refused by database server
    console.error(appError.cause.message); // Connection refused by database server
}