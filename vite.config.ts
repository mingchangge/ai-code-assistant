import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import { createRequire } from 'module'
import { resolve } from 'path'
import { readFileSync, statSync, createReadStream } from 'fs'
import react from '@vitejs/plugin-react'

// 让 Node 在 ESM 中也能同步 require CJS 模块
const require = createRequire(import.meta.url)
// 1. 先断言整个模块
const _monacoEditorPluginMod = require('vite-plugin-monaco-editor') as {
  default: (opts?: PluginOptions) => Plugin
}
// 2.取出真正的插件函数并再断言一次
interface PluginOptions {
  languageWorkers?: string[]
  customWorkers?: { label: string; entry: string }[]
  publicPath?: string
}
// 3. 再断言真正的函数
const monacoEditorPlugin = _monacoEditorPluginMod.default as (
  opts?: PluginOptions
) => Plugin

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  console.log('command', command)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    resolve: {
      alias: {
        '@': pathResolve('./src')
      },
      extensions: ['.js', '.json', '.ts', '.tsx']
    },
    server: {
      proxy: {
        '/api-spark': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api-spark/, ''),
          secure: false
        }
      }
    },
    plugins: [
      react(),
      monacoEditorPlugin({
        languageWorkers: [
          'editorWorkerService',
          'typescript',
          'json',
          'html',
          'css',
          'html'
        ]
      }),
      {
        name: 'serve-docs-images',
        apply: 'serve', // 只在 dev server 生效
        configureServer(server) {
          // 1️⃣ Markdown 文件
          server.middlewares.use('/docs', (req, res, next) => {
            if (!req.url) {
              next()
              return
            }
            // 去掉首字母 /，拼成文件系统路径
            const file = resolve('src/assets/docs', req.url.slice(1))
            try {
              const content = readFileSync(file, 'utf-8')
              res.setHeader('Content-Type', 'text/markdown')
              res.end(content)
            } catch {
              next() // 交给下一条规则（图片）
            }
          })

          // 2️⃣ 图片资源
          server.middlewares.use('/images', (req, res, next) => {
            if (!req.url) {
              next()
              return
            }
            // 去掉首字母 /，拼成文件系统路径
            const file = resolve('src/assets/docs/images', req.url.slice(1))
            try {
              const stat = statSync(file)
              if (!stat.isFile()) {
                next()
                return
              }
              // 让浏览器按二进制流下载
              const stream = createReadStream(file)
              stream.pipe(res)
            } catch {
              res.statusCode = 404
              res.end('Not found')
            }
          })
        }
      }
    ],
    // 关键一行：让 Vite 把 .md 当 URL 处理
    assetsInclude: ['**/*.md']
  }
})

function pathResolve(dir: string): string {
  return resolve(process.cwd(), '.', dir)
}
