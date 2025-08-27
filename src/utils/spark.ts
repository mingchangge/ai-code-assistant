const host = 'spark-api.xf-yun.com'
const path = '/v1/x1'
const gptUrl = `wss://${host}${path}`

// 官方 demo 的精简版
async function createUrl() {
  const now = new Date()
  const date = now.toUTCString()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(import.meta.env.VITE_API_SECRET ?? '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signatureOrigin)
  )
  const signature64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
  const authorizationOrigin = `api_key="${String(import.meta.env.VITE_API_KEY)}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature64}"`
  const authorization = btoa(authorizationOrigin)
  return `${gptUrl}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`
}

export async function askSpark(prompt: string): Promise<string> {
  const url = await createUrl()
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    let answer = ''
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          header: { app_id: String(import.meta.env.VITE_APP_ID), uid: 'user' },
          parameter: {
            chat: { domain: 'x1', temperature: 0.2, max_tokens: 2048 }
          },
          payload: { message: { text: [{ role: 'user', content: prompt }] } }
        })
      )
    }

    ws.onmessage = e => {
      const data = JSON.parse(e.data as string) as {
        header: { code: number; status: number }
        payload?: { choices?: { text?: { content?: string }[] } }
      }
      const { code, status } = data.header
      if (code !== 0) reject(new Error(JSON.stringify(data.header)))
      const content = data.payload?.choices?.text?.[0]?.content ?? ''
      answer += content
      if (status === 2) {
        ws.close()
        resolve(answer)
      }
    }

    ws.onerror = reject
  })
}

//  解析 AI 返回的分段 JSON 字符串 ----------------------------------
export type ResourceKind = 'html' | 'css' | 'js'

interface FullCode {
  html: string
  css: string
  js: string
}

interface SingleChunk {
  type: 'single'
  lang: ResourceKind
  code: FullCode
  code_length: number
  js_sha256?: string
}

interface MultiChunk {
  type: 'multi'
  lang: ResourceKind
  code_part: number
  code_total_parts: number
  chunk: string
  js_sha256?: string // 仅最后一段
}

type AiChunk = SingleChunk | MultiChunk

/* ---------- 工具：SHA-256 ---------- */
async function sha256(str: string): Promise<string> {
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/* ---------- 解析 AI 回复 ---------- */
function parse(raw: string): AiChunk[] {
  console.log('AI 原始回复:', raw)
  const trimmed = raw.trim()
  /* 允许一条或多条 JSON 行 */
  return (
    trimmed
      .split('\n')
      .map(l => l.trim())
      .map(l => {
        try {
          const codeBlockRemoved = l
            .replace(/^`+(json)?\s*/, '')
            .replace(/\s*`+$/, '')
            .trim()
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
          const fixedLine = codeBlockRemoved.replace(
            /(^|[{,])\s*'([^']+)'\s*:/g,
            '$1 "$2":'
          )
          return JSON.parse(fixedLine) as AiChunk
        } catch {
          return null
        }
      })
      // 关键：使用类型谓词把 null 过滤掉，并让编译器知道结果一定是 AiChunk[]
      .filter((c): c is AiChunk => c !== null)
  )
}

/* ---------- 主入口：传入 AI 原始字符串，返回 Promise<Record<ResourceKind, string>> ---------- */
export async function assemble(
  raw: string
): Promise<Record<ResourceKind, string>> {
  const chunks = parse(raw)

  /* 统一缓存 */
  const full: Record<ResourceKind, string> = { html: '', css: '', js: '' }

  /* 缓存分段 */
  const buffer: Record<ResourceKind, string[]> = { html: [], css: [], js: [] }

  /* 1. 填充缓存 */
  chunks.forEach(c => {
    if (c.type === 'single') {
      console.log('单段代码块:', c)
      // 单段一次性给出
      full.html = c.code.html
      full.css = c.code.css
      full.js = c.code.js
    } else {
      // 分段
      buffer[c.lang][c.code_part - 1] = c.chunk
    }
  })

  /* 2. 合并分段 */
  await Promise.all(
    (['html', 'css', 'js'] as const).map(async lang => {
      const arr = buffer[lang]
      if (arr.length === 0) return // 单段已处理

      const total = chunks.find(
        (c): c is MultiChunk => c.type === 'multi' && c.lang === lang
      )?.code_total_parts
      if (!total) return

      if (arr.filter(Boolean).length === total) {
        const merged = arr.join('')
        full[lang] = merged

        // JS 哈希校验
        if (lang === 'js') {
          const lastChunk = chunks.find(
            (c): c is MultiChunk =>
              c.type === 'multi' && c.lang === 'js' && c.code_part === total
          )
          const expect = lastChunk?.js_sha256
          if (expect && (await sha256(merged)) !== expect) {
            throw new Error('JS SHA-256 校验失败')
          }
        }
      }
    })
  )
  console.log('最终合并结果:', full)
  return full
}
