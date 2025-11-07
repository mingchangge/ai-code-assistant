export async function registerSW(): Promise<void> {
  if (!('serviceWorker' in navigator))
    throw new Error('浏览器不支持 ServiceWorker')

  const reg = await navigator.serviceWorker.register(
    new URL('../serviceWorkers/sw.ts', import.meta.url),
    { type: 'module', scope: '/src/serviceWorkers/' } // ← 合法子树
  )

  if (reg.installing || reg.waiting) {
    await new Promise<void>(resolve => {
      const check = () => {
        if (reg.active?.state === 'activated') {
          resolve()
          return
        }
        reg.addEventListener('statechange', check, { once: true })
      }
      check()
    })
  }
}
