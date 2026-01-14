# 1. 安装依赖

- npm create vite@latest ai-code-assistant --template react-ts
- npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev

# 2. 将 .prettierrc.js 重命名为 .prettierrc.cjs

```
mv .prettierrc.js .prettierrc.cjs
```

**解释：**

- .prettierrc.cjs 是 Prettier 的配置文件，用于定义代码格式化的规则。
- 重命名为 .prettierrc.cjs 是为了符合 CommonJS 模块的规范，因为 Prettier 是一个 Node.js 模块，所以需要使用 CommonJS 模块的语法。
- `.prettierrc.js`与**package.json**中的`"type": "module"` 冲突，所以需要重命名为 `.prettierrc.cjs`
- `"type": "module"`意味着所有 .js 文件都会被当作 ES模块（ECMAScript模块）处理。

# 3. 在（20260114）以后安装依赖需要 `--legacy-peer-deps`参数

`npm install xxx --legacy-peer-deps` 因为在使用AI模型的某些包时，会出现依赖冲突的问题，所以需要使用 `--legacy-peer-deps` 参数来安装依赖。报错如下：

```
npm install
npm error code ERESOLVE
npm error ERESOLVE could not resolve
npm error
npm error While resolving: @langchain/community@1.1.2
npm error Found: zod@4.3.5
npm error node_modules/zod
npm error   zod@"^4.3.5" from the root project
npm error   zod@"^3.25.76 || ^4" from @langchain/classic@1.0.8
npm error   node_modules/@langchain/classic
npm error     @langchain/classic@"1.0.8" from @langchain/community@1.1.2
npm error     node_modules/@langchain/community
npm error       @langchain/community@"^1.1.2" from the root project
npm error   6 more (@langchain/community, @langchain/core, ...)
npm error
npm error Could not resolve dependency:
npm error peer @browserbasehq/stagehand@"^1.0.0" from @langchain/community@1.1.2
npm error node_modules/@langchain/community
npm error   @langchain/community@"^1.1.2" from the root project
npm error
npm error Conflicting peer dependency: zod@3.25.76
npm error node_modules/zod
npm error   peer zod@"^3.23.8" from @browserbasehq/stagehand@1.14.0
npm error   node_modules/@browserbasehq/stagehand
npm error     peer @browserbasehq/stagehand@"^1.0.0" from @langchain/community@1.1.2
npm error     node_modules/@langchain/community
npm error       @langchain/community@"^1.1.2" from the root project
npm error
npm error Fix the upstream dependency conflict, or retry
npm error this command with --force or --legacy-peer-deps
...
```

# 4. React + TypeScript + Vite

该模板提供了最小设置，使 React 能够通过 HMR 和一些 ESLint 规则在 Vite 中工作。

目前有两个官方插件可用：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

您还可以安装 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 和 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 以获取特定于 React 的 lint 规则：

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname
      }
      // other options...
    }
  }
])
```
