// src/utils/spark.ts
const host = 'spark-api.xf-yun.com'
const path = '/v1/x1'
const gptUrl = `wss://${host}${path}`

/* ---------- 1. 鉴权 ---------- */
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

/* ---------- 2. 单轮 WebSocket ---------- */
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
    const timer = setTimeout(() => {
      ws.close()
      reject(new Error('websocket 30s 未结束'))
    }, 30000)
    ws.onmessage = e => {
      clearTimeout(timer)
      const data = JSON.parse(e.data as string) as {
        header: { code: number; status: number }
        payload?: { choices?: { text?: { content?: string }[] } }
      }
      const { code, status } = data.header
      if (code !== 0) reject(new Error(JSON.stringify(data.header)))
      answer += data.payload?.choices?.text?.[0]?.content ?? ''
      if (status === 2) {
        clearTimeout(timer)
        ws.close()
        resolve(answer)
      }
    }
    ws.onerror = e => reject(new Error('ws error: ' + JSON.stringify(e)))
  })
}

/* ---------- 3. 流式协议类型 ---------- */
export interface Slice {
  total: number
  index: number
  html: string
  css: string
  js: string
  nextOffset: number
}

/* ---------- 4. 方案 B：流式截断修复 ---------- */
export async function assembleStream(userPrompt: string): Promise<{
  html: string
  css: string
  js: string
}> {
  let html = '',
    css = '',
    js = '',
    buf = '',
    offset = 0

  while (true) {
    const chunk = await askSpark(
      offset
        ? `${userPrompt}\n（从上轮字符偏移 ${offset} 继续，保持同样 JSON 格式），必须在一次 WebSocket 连接内输出完整内容，**最后帧务必把 header.status 置为 2**，否则视为异常。`
        : userPrompt +
            '\n 必须在一次 WebSocket 连接内输出完整内容，**最后帧务必把 header.status 置为 2**，否则视为异常。'
    )
    buf += chunk

    /* 尝试解析 */
    try {
      const cleaned = buf
        .replace(/^```json/i, '')
        .replace(/```$/g, '')
        .trim()
      const {
        total,
        index: _,
        html: h,
        css: c,
        js: j,
        nextOffset
      } = JSON.parse(cleaned) as Slice
      html += h
      css += c
      js += j
      if (nextOffset >= total) return { html, css, js }
      buf = '' // 本段完整，清空缓冲区
      offset = nextOffset
    } catch {
      /* 不完整，继续拼 */
    }
  }
}
