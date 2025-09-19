# JavaScript 模块化方案

## JavaScript 模块化方案对比表

| 维度/方案       | AMD                    | CommonJS                     | CMD                       | UMD                              | ES6 Modules                            |
| --------------- | ---------------------- | ---------------------------- | ------------------------- | -------------------------------- | -------------------------------------- |
| **制定方/年代** | 社区/RequireJS·2011    | Node团队·2009                | Sea.js·2011               | 社区包裹套路·2012                | ECMA-262·2015                          |
| **适用环境**    | 浏览器+RequireJS       | Node原生；浏览器需打包       | 浏览器+Sea.js             | 浏览器、Node、AMD 通吃           | 浏览器`<script type=module>`、Node ESM |
| **核心语法**    | `define(['dep'],fn)`   | `require()`/`module.exports` | `define(fn){ require() }` | 自执行函数检测全局/define/module | `import`/`export`                      |
| **加载方式**    | 异步、前置依赖数组     | 同步、运行时                 | 懒加载、就近require       | 内部走CJS/AMD/全局               | 静态解析、可异步                       |
| **静态解析**    | ❌                     | ❌                           | ❌                        | ❌                               | ✅                                     |
| **一句话特点**  | 浏览器异步鼻祖，回调深 | 服务端同步，无静态结构       | 写法像Node，用时再拉文件  | 兼容壳，库发布用                 | 官方标准，tree-shaking活绑定           |
| **当前地位**    | 已边缘                 | 老代码主流                   | 几乎消失                  | dist存在，业务不写               | 现在及未来默认                         |

---

## 详细解释

### 1. AMD（Asynchronous Module Definition）

- **谁定的**：社区草案，RequireJS 推动，最终由 CommonJS 小组归档。
- **年代**：2011 前后，浏览器“异步加载”需求爆发。
- **语法**：
  ```javascript
  // 定义
  define(['dep1', 'dep2'], function (d1, d2) {
    return { foo: 123 };
  });
  // 使用
  require(['myMod'], function (m) { ... });
  ```
- **运行环境**：浏览器原生（`<script data-main="main">` 引 RequireJS 即可）。
- **特点**  
  – 异步，不堵塞页面渲染；  
  – 依赖前置，必须提前在数组里写死；  
  – 回调风格，代码层级容易向右漂移；  
  – 模块号默认就是文件路径，也可手动配置路径 / shim。

---

### 2. CommonJS（CJS）

- **谁定的**：Node.js 团队，基于 Mozilla 工程师的 ServerJS 草案。
- **年代**：2009 随 Node 0.x 发布。
- **语法**：
  ```javascript
  const path = require('path') // 同步加载
  exports.name = 'cjs' // 导出对象
  module.exports = anyValue // 整包替换
  ```
- **运行环境**：Node 原生；浏览器必须经 Webpack/Rollup/Browserify 打包转换。
- **特点**  
  – 运行时同步加载，IO 在本地磁盘所以延迟可忽略；  
  – 可以动态 require（写到 if/for 里）；  
  – 输出的是“值拷贝”，循环依赖时拿到的是已执行部分的快照；  
  – 无静态结构，tree-shaking 效果差。

---

### 3. CMD（Common Module Definition）

- **谁定的**：阿里玉伯，为 Sea.js 设计的浏览器模块规范。
- **年代**：2011 ～ 2013 国内最火，后随 Sea.js 停更而式微。
- **语法**：
  ```javascript
  define(function (require, exports, module) {
    var a = require('./a') // 就近 require，用时才加载
    exports.b = 2
  })
  ```
- **运行环境**：浏览器 + Sea.js 加载器。
- **特点**  
  – 借鉴 CommonJS 写法，保留“就近 require”习惯；  
  – 懒执行，真正用到时才拉文件；  
  – 与 AMD 最大区别：依赖数组可选，支持运行时解析；  
  – 因为社区生态小、加载器性能一般，后来被 Webpack + ES6 取代。

---

### 4. UMD（Universal Module Definition）

- **谁定的**：社区惯用套路，无官方编号，Roach/AddyOsmani 等人总结。
- **年代**：2012 起，伴随“库作者希望一份代码跑遍所有环境”的需求。
- **语法**：没有新 API，是一段**自执行包裹**：
  ```javascript
  (function (root, factory) {
    if (typeof define === 'function' && define.amd) {          // AMD
      define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) { // CommonJS
      module.exports = factory(require('jquery'));
    } else {                                                   // 全局变量
      root.myLib = factory(root.jQuery);
    }
  }(this, function ($) { /* 真正源码 */ return { … }; }));
  ```
- **运行环境**：浏览器 script 标签、Node require、AMD loader 都能用。
- **特点**  
  – 不是“新规范”，只是**兼容壳**；  
  – 让 jQuery、Lodash 等库发布时“一把梭”支持三方；  
  – 打包体积略大，tree-shaking 不友好，业务代码基本不写。

---

### 5. ES6 Modules（ESM，官方 ECMAScript Module）

- **谁定的**：TC39 → ECMA-262 第 6 版，2015 发布，2017 浏览器陆续原生，2019 Node 13 实验，2020 正式。
- **语法**：
  ```javascript
  import React, { useState } from 'react' // 静态导入
  export default App // 默认导出
  export const foo = 1 // 命名导出
  // 动态导入也支持： const mod = await import('./mod.js');
  ```
- **运行环境**：  
  – 浏览器：`<script type="module">` 原生解析；  
  – Node：`.mjs` 或 package.json `"type": "module"`；  
  – 打包工具：Webpack/Rollup/Vite 默认模式。
- **特点**  
  – 静态语法，编译阶段就能确定依赖图 → 支持循环依赖、tree-shaking、scope hoisting；  
  – 输出的是“活绑定”（live binding），内部变量变化外部同步感知；  
  – 默认异步加载，适合浏览器网络场景；  
  – 已成为“官方普通话”，新框架/库默认采用。

---

### 一张时间轴帮你串起来

```
2009  CommonJS（Node 出生）
2011  AMD → RequireJS 流行
2012  CMD → Sea.js 国内热
2012  UMD → 库作者“通吃”方案
2015  ES6 Modules 规范定稿
2017+ 浏览器原生 ESM
2020+ Node 官方 ESM 支持
```

### 总结一句话

- **AMD/CMD** 是浏览器时代的“异步加载”临时方案；
- **CommonJS** 是 Node 端的同步标准；
- **UMD** 只是兼容壳，让库同时适配前三种；
- **ES6 Modules** 是语言级终极标准，现已通吃浏览器与服务器。
