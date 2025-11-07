self.onmessage = async event => {
  const base = event.data as string

  const root = await navigator.storage.getDirectory()
  const modelDir = await root.getDirectoryHandle('models', { create: true })
  const phi3Dir = await modelDir.getDirectoryHandle('phi3', { create: true })
  const smallFiles = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'special_tokens_map.json'
  ]
  for (const name of smallFiles) {
    const res = await fetch(`${base}/models/phi3/${name}`)
    const blob = await res.blob()
    const file = await phi3Dir.getFileHandle(name, { create: true })
    const ws = await file.createWritable()
    await ws.write(blob)
    await ws.close()
    self.postMessage({ type: 'progress', name, percent: 0 })
  }
  // 大文件流式处理
  const FILE_NAME = 'Phi-3-mini-4k-instruct-q4.gguf'
  const file = await phi3Dir.getFileHandle(FILE_NAME, { create: true })
  // 已存字节数
  let offset = 0
  try {
    const exiting = await file.getFile()
    offset = exiting.size
  } catch {
    offset = 0
  }
  // 总大小
  const headRes = await fetch(`${base}/models/phi3/${FILE_NAME}`, {
    method: 'HEAD'
  })
  const totalSize = parseInt(headRes.headers.get('Content-Length') ?? '0')
  // 已存完所有字节，不需要继续下载
  if (offset >= totalSize) {
    self.postMessage({ type: 'progress', percent: 100 })
    self.postMessage({ type: 'done' })
    return
  }
  // 断点续传，从已存字节数开始下载
  const rangeRes = await fetch(`${base}/models/phi3/${FILE_NAME}`, {
    headers: {
      Range: `bytes=${offset.toString()}-`
    }
  })
  const reader = rangeRes.body?.getReader()
  if (!reader) {
    self.postMessage({ type: 'done', status: 'error' })
    return
  }
  // 流式写入文件
  const ws = await file.createWritable({ keepExistingData: true })
  let downloaded = offset
  while (downloaded < totalSize) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    await ws.write(value)
    downloaded += value.byteLength
    // 计算已下载进度
    const percent = Math.min(100, Math.floor((downloaded / totalSize) * 100))
    self.postMessage({ type: 'progress', percent })
  }
  await ws.close()
  self.postMessage({ type: 'done', status: 'complete' })
}
