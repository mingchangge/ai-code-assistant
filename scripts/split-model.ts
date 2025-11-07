import { mkdir, writeFile, open } from 'node:fs/promises'
import { createWriteStream } from 'node:fs' // ← 写出流
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const CHUNK_SIZE = 64 * 1024 * 64 // 64 MB
const MODEL_FILE = 'public/models/phi3/Phi-3-mini-4k-instruct-q4.gguf'
const CHUNK_DIR = 'public/chunks/phi3'
const INDEX_PATH = 'public/models/phi3/index.json'

await mkdir(CHUNK_DIR, { recursive: true })

const fd = await open(MODEL_FILE, 'r')
const stat = await fd.stat()
const total = stat.size
const chunks = Math.ceil(total / CHUNK_SIZE)
const index: Array<{ name: string; size: number }> = []

for (let i = 0; i < chunks; i++) {
  const start = i * CHUNK_SIZE
  const end = Math.min(start + CHUNK_SIZE, total)
  const length = end - start

  const chunkName = `gguf.${String(i).padStart(4, '0')}.bin`
  const outPath = join(CHUNK_DIR, chunkName)

  // 1. 用 fd.createReadStream 读区间
  // 2. 用 fs.createWriteStream 写出
  await new Promise<void>((resolve, reject) => {
    const hash = createHash('sha256')
    const rs = fd.createReadStream({ start, end: end - 1, autoClose: false })
    const ws = createWriteStream(outPath)

    rs.on('data', d => hash.update(d))
      .on('error', reject)
      .on('end', () => resolve())

    ws.on('error', reject)
    rs.pipe(ws)
  })

  index.push({ name: chunkName, size: length })
}

await fd.close()
await writeFile(INDEX_PATH, JSON.stringify(index, null, 2))
console.log(`✅ 切片完成：${index.length} 块，清单 → ${INDEX_PATH}`)
