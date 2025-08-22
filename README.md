# 安装依赖

- npm create vite@latest ai-code-assistant --template react-ts
- npm i @monaco-editor/react @codesandbox/sandpack-react
- npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev

# 将 .prettierrc.js 重命名为 .prettierrc.cjs

```
mv .prettierrc.js .prettierrc.cjs
```

**解释：**

- .prettierrc.cjs 是 Prettier 的配置文件，用于定义代码格式化的规则。
- 重命名为 .prettierrc.cjs 是为了符合 CommonJS 模块的规范，因为 Prettier 是一个 Node.js 模块，所以需要使用 CommonJS 模块的语法。
- `.prettierrc.js`与**package.json**中的`"type": "module"` 冲突，所以需要重命名为 `.prettierrc.cjs`
- `"type": "module"`意味着所有 .js 文件都会被当作 ES模块（ECMAScript模块）处理。

# React + TypeScript + Vite

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
