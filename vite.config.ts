import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { createRequire } from 'module'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'

// 让 Node 在 ESM 中也能同步 require CJS 模块
const require = createRequire(import.meta.url)
// 1. 先断言整个模块
const _monacoEditorPluginMod = require('vite-plugin-monaco-editor') as {
  default: (opts?: PluginOptions) => Plugin
}
// 2.取出真正的插件函数并再断言一次
type PluginOptions = {
  languageWorkers?: string[]
  customWorkers?: Array<{ label: string; entry: string }>
  publicPath?: string
}
// 3. 再断言真正的函数
const monacoEditorPlugin = _monacoEditorPluginMod.default as (
  opts?: PluginOptions
) => Plugin

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': pathResolve('./src')
    },
    extensions: ['.js', '.json', '.ts', '.tsx']
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
    })
  ]
})

function pathResolve(dir: string): string {
  return resolve(process.cwd(), '.', dir)
}
