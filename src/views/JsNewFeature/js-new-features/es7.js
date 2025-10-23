const arr = [1, 2, 3, 4, 5]
console.log(arr.includes(3)) // true
console.log(arr.includes(6)) // false

console.log(arr.includes(3, 2)) // true
console.log(arr.includes(3, 3)) // false

const sparseArr = [1, 2, , 4, 5]
console.log(sparseArr.includes(undefined)) // true
console.log(sparseArr.includes(3)) // false 空位不等于 3
console.log(sparseArr.includes(null)) // false 空位不等于 null
console.log(sparseArr.includes(0)) // false 空位不等于 0
console.log(sparseArr.includes(false)) // false 空位不等于 false
const explicitArr = [1, 2, undefined, 4, 5]
console.log(sparseArr.includes(undefined)) // true
console.log(explicitArr.includes(undefined)) // true
sparseArr.forEach((value, index) => {
    console.log(index, value)
    // 输出:
    // 0 1
    // 1 2
    // 3 4
    // 4 5
})
console.log(sparseArr.includes(undefined)) // true
// 指数运算符（**）
console.log(2 ** 3) // 8
console.log(Math.pow(2, 3)) // 8
console.log(5 ** 0) // 1
let x = 2
console.log(x **= 3) // 8，相当于 x = x ** 3
console.log((-3) ** 2) // 9
//console.log(-3 ** 2) // 报错，等同于 -(3 ** 2)。Uncaught SyntaxError: Unary operator used immediately before exponentiation expression. Parenthesis must be used to disambiguate operator precedence
console.log(2 * 3 ** 2) // 18，等同于 2 * (3 ** 2)
console.log(5 + 2 ** 3) // 13，等同于 5 + (2 ** 3)
console.log(10 - 3 ** 2) // 1，等同于 10 - (3 ** 2)
console.log(2 ** 3 ** 2) // 512，等同于 2 ** (3 ** 2)==> 2 ** 9
console.log((2 ** 3) ** 2) // 64