import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.tsx'
// 引入 esbuild 模块
import * as esbuild from 'esbuild-wasm'

// 全局初始化 esbuild
async function initEsbuild() {
  await esbuild.initialize({
    wasmURL: '/esbuild.wasm'
    // 如果你下载到本地，写 '/esbuild.wasm'
  })
}

// 调用初始化函数
void initEsbuild().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
