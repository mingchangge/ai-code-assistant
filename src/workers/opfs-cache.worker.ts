self.onmessage = async (e: MessageEvent<string>) => {
  const base = e.data // http://localhost:5173

  const root = await navigator.storage.getDirectory()
  const modelDir = await root.getDirectoryHandle('models', { create: true })
  const phi3Dir = await modelDir.getDirectoryHandle('phi3', { create: true })

  /* 小文件 */
  const small = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'special_tokens_map.json'
  ]
  for (const name of small) {
    const blob = await fetch(`${base}/models/phi3/${name}`).then(r => r.blob())
    const file = await phi3Dir.getFileHandle(name, { create: true })
    const ws = await file.createWritable()
    await ws.write(blob)
    await ws.close()
  }
  /* 1. 已存在块列表 */
  const existing = new Set<string>()
  for await (const [name] of phi3Dir.entries()) existing.add(name)

  /* 2. 只下缺失块 */
  const index: { name: string; size: number }[] = await fetch(
    `${base}/models/phi3/index.json`
  ).then(r => r.json() as Promise<{ name: string; size: number }[]>)
  const missing = index.filter(it => !existing.has(it.name))

  const total = missing.reduce((a, b) => a + b.size, 0)
  let written = 0

  for (const chunk of missing) {
    const res = await fetch(`${base}/chunks/phi3/${chunk.name}`)
    const buf = await res.arrayBuffer()
    const file = await phi3Dir.getFileHandle(chunk.name, { create: true })
    const ws = await file.createWritable()
    await ws.write(buf)
    await ws.close()
    written += chunk.size
    self.postMessage({
      type: 'progress',
      percent: Math.round((written / total) * 100)
    })
  }
  self.postMessage({ type: 'done' })
}
