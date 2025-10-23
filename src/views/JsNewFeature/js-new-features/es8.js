async function fetchData() {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve("数据获取成功！");
        }, 2000);
    });
}
async function getData() {
    try {
        const data = await fetchData(); // 代码会在这里暂停，直到 Promise 解决
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

getData(); // 调用 async 函数

const obj = { a: 1, b: 2, c: 3 }
console.log(Object.keys(obj)) // ['a', 'b', 'c']
console.log(Object.values(obj)) // [1, 2, 3]
console.log(Object.entries(obj)) // [['a', 1], ['b', 2], ['c', 3]]

const obj_1 = { a: 1, b: 2 }
console.log(Object.getOwnPropertyDescriptors(obj_1))
// {
//     a: { value: 1, writable: true, enumerable: true, configurable: true },
//     b: { value: 2, writable: true, enumerable: true, configurable: true }
// }

const source = {
    value: 1,
    get doubled() {
        return this.value * 2;
    }
};
const copy1 = Object.assign({}, source);
console.log(copy1); // { value: 1, doubled: 2 }
const descriptors = Object.getOwnPropertyDescriptors(source);
console.log(descriptors);
// {
//     value: { value: 1, writable: true, enumerable: true, configurable: true },
//     doubled: { get: [Function: get doubled], set: undefined, enumerable: true, configurable: true }
// }
const copy2 = Object.defineProperties({}, descriptors);
console.log(copy2);
console.log(copy2.doubled); // 2

copy2.value = 3;
console.log(copy2.doubled); // 6

const str = 'Hello'
console.log(str.padStart(6, '*')) // '*Hello'
console.log(str.padEnd(7, '!')) // 'Hello!!'

function myFunction(param1, param2, param3,) {
    console.log(param1, param2, param3)
}
myFunction('a', 'b', 'c',) // 'a b c'
