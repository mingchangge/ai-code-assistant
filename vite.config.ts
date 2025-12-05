import { defineConfig, loadEnv, type PluginOption } from 'vite'
import type { Plugin, UserConfig, ConfigEnv } from 'vite' // 导入更多类型以增强类型安全
import { createRequire } from 'module'
import { resolve } from 'path' // 显式导入 'resolve'
import serveDocsImages from './src/utils/vite-plugin-docs-and-images.ts'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import mkcert from 'vite-plugin-mkcert'

// 让 Node 在 ESM 中也能同步 require CJS 模块
const require = createRequire(import.meta.url)

// 1. 先断言整个模块
const _monacoEditorPluginMod = require('vite-plugin-monaco-editor') as {
  default: (opts?: MonacoPluginOptions) => Plugin
}

// 2.取出真正的插件函数并再断言一次
interface MonacoPluginOptions {
  languageWorkers?: string[]
  customWorkers?: { label: string; entry: string }[]
  publicPath?: string
}

// 3. 再断言真正的函数
const monacoEditorPlugin = _monacoEditorPluginMod.default as (
  opts?: MonacoPluginOptions
) => Plugin

function pathResolve(dir: string): string {
  return resolve(process.cwd(), '.', dir)
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
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
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      },
      proxy: {
        '/api-spark': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api-spark/, ''),
          secure: false
        }
      }
    },
    // 预览服务器也需要配置
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
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
          'css' // 'html' 重复了，移除一个
        ]
      }),
      // 自定义插件：支持 /docs/xxx.md 访问
      serveDocsImages(),
      mkcert(),
      viteStaticCopy({
        targets: [
          {
            // 从 node_modules 复制 onnxruntime-web 的 dist 目录下的所有文件
            src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
            // 将它们放到指定的模型文件夹URL下
            dest: 'models/ocr_model'
          }
        ]
      })
    ] as PluginOption[], // 显式断言插件数组类型
    // 关键一行：让 Vite 把 .md 当 URL 处理
    assetsInclude: ['**/*.md']
  }
})
