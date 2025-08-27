import { useEffect, useState } from 'react'
import * as esbuild from 'esbuild-wasm'

interface CodePreviewProps {
  files: Record<string, string>
}

export default function CodePreview({ files }: CodePreviewProps) {
  const [srcDoc, setSrcDoc] = useState('')

  useEffect(() => {
    const buildHtml = async () => {
      const html = files['index.html'] ?? ''
      const css = files['style.css'] ?? ''
      const js = files['index.js'] ?? ''

      // 用 esbuild 把 JS 转 iife
      const result = await esbuild
        .build({
          stdin: {
            contents: js,
            loader: 'js'
          },
          bundle: true,
          write: false,
          format: 'iife',
          globalName: 'App'
        })
        .catch(() => null)

      const compiledJs = result?.outputFiles[0].text ?? js

      // 组合成单页
      const final = html
        .replace('</head>', `<style>${css}</style></head>`)
        .replace(
          '</body>',
          `<script type="module">${compiledJs}</script></body>`
        )

      setSrcDoc(final)
    }

    void buildHtml()
  }, [files])

  return (
    <iframe
      srcDoc={srcDoc}
      title="preview"
      style={{ width: '100%', height: '100%', border: 0 }}
    />
  )
}
