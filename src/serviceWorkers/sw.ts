/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

// 匹配 Hugging Face Hub URL 的正则表达式
const HUB_URL_RE = /https:\/\/huggingface\.co\/(.*)\/resolve\/main\/(.*)/

// 强制新的 Service Worker 立即激活
self.addEventListener('install', () => void self.skipWaiting())
// 立即接管所有客户端
self.addEventListener('activate', () => void self.clients.claim())

// 拦截 **全站** 请求（虽然 scope 是子目录）
self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url)
  const match = url.match(HUB_URL_RE)

  if (match) {
    // 如果是请求 Hugging Face Hub 的模型文件
    const modelId = match[1]
    const fileName = match[2]

    console.log(`[SW] Intercepted request for: ${modelId}/${fileName}`)

    // 使用 respondWith 来劫持响应
    event.respondWith(serveFileFromOPFS(modelId, fileName))
  }
})
/**
 * 从 OPFS 中查找并返回文件
 * @param {string} modelId
 * @param {string} fileName
 * @returns {Promise<Response>}
 */
async function serveFileFromOPFS(modelId, fileName) {
  try {
    const root = await navigator.storage.getDirectory()
    // 在 OPFS 中定位到模型文件
    const modelDir = await root.getDirectoryHandle(modelId)
    const fileHandle = await modelDir.getFileHandle(fileName)
    const file = await fileHandle.getFile()

    console.log(`[SW] Serving from OPFS: ${modelId}/${fileName}`)

    // 创建一个包含文件内容的响应
    const response = new Response(file, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': file.size
      }
    })

    return response
  } catch (error) {
    console.error(`[SW] Error serving from OPFS: ${modelId}/${fileName}`, error)
    // 如果在 OPFS 中找不到文件，返回 404 错误
    // 或者，你也可以选择让请求继续访问网络：return fetch(event.request);
    return new Response('File not found in OPFS', { status: 404 })
  }
}
