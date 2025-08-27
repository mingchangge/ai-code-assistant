# 安装依赖

- npm create vite@latest ai-code-assistant --template react-ts
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

# 安装@stackblitz/sdk

- 错误安装了@webcontainer/api插件（`npm install @webcontainer/api --save-dev`），发现后已卸载`npm uninstall @webcontainer/api`。

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

### 选型小结

| 方案                | 集成成本          | 功能              | 网络要求 | 适用场景             |
| ------------------- | ----------------- | ----------------- | -------- | -------------------- |
| react-online-editor | 最低（npm 即用）  | 中                | 国内直连 | DEMO、教学、轻量项目 |
| react-playground    | 中（npm）         | 高（支持 npm 包） | 国内 CDN | 需要第三方依赖的示例 |
| CodeSandbox Embed   | 高（需一次 POST） | 最高（完整 IDE）  | 国内加速 | 复杂项目、团队协作   |

如无特殊需求，**直接选【react-online-editor】**即可：一行 `<OnlineEditor defaultFiles={files} />`，完全摆脱 StackBlitz 网络问题。

- 代码编辑和预览总结：
  - CodeSandbox Embed，操作简单，首次加载很慢

  ```
    import { useEffect, useState } from 'react'
    interface PreviewProps {
      files: Record<string, string>
    }

    export default function Preview({ files }: PreviewProps) {
      // ① 初始 null
      const [embedUrl, setEmbedUrl] = useState<string | null>(null)

      useEffect(() => {
        const payload = {
          files: Object.fromEntries(
            Object.entries(files).map(([path, content]) => [
              path,
              { content, isBinary: false }
            ])
          )
        }

        fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json())
          .then(data => {
            setEmbedUrl(
              `https://codesandbox.io/embed/${data.sandbox_id}?fontsize=14&hidenavigation=1&theme=dark`
            )
          })
          .catch(console.error)
      }, [files])

      // ② 没拿到地址时不渲染 iframe
      if (!embedUrl) return null

      return (
        <iframe
          src={embedUrl}
          title="codesandbox-preview"
          style={{ width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      )
    }
  ```
