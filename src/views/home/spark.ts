const host = 'spark-api.xf-yun.com';
const path = '/v1/x1';
const gptUrl = `wss://${host}${path}`;

// 官方 demo 的精简版
 async function createUrl() {
  const now = new Date();
  const date = now.toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(import.meta.env.VITE_API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureOrigin));
  const signature64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const authorizationOrigin = `api_key="${import.meta.env.VITE_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature64}"`;
  const authorization = btoa(authorizationOrigin);
  return `${gptUrl}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${host}`;
}

export async function askSpark(prompt: string): Promise<string> {
  const url = await createUrl();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let answer = '';
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          header: { app_id: import.meta.env.VITE_APP_ID, uid: 'user' },
          parameter: {
            chat: { domain: 'x1', temperature: 0.2, max_tokens: 2048 },
          },
          payload: { message: { text: [{ role: 'user', content: prompt }] } },
        })
      );
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const { code, status } = data.header;
      if (code !== 0) reject(data.header);
      const content = data.payload?.choices?.text?.[0]?.content || '';
      answer += content;
      if (status === 2) {
        ws.close();
        resolve(answer);
      }
    };

    ws.onerror = reject;
  });
}