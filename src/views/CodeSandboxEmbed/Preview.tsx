import { useEffect, useState } from 'react'
interface PreviewProps {
  files: Record<string, string>
}

export default function Preview({ files }: PreviewProps) {
  // ① 初始 null
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    const payload = {
      files: Object.fromEntries(
        Object.entries(files).map(([path, content]) => [
          path,
          { content, isBinary: false }
        ])
      )
    }

    fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        setEmbedUrl(
          `https://codesandbox.io/embed/${data.sandbox_id}?fontsize=14&hidenavigation=1&theme=dark`
        )
      })
      .catch(console.error)
  }, [files])

  // ② 没拿到地址时不渲染 iframe
  if (!embedUrl) return null

  return (
    <iframe
      src={embedUrl}
      title="codesandbox-preview"
      style={{ width: '100%', height: '100%', border: 0 }}
      allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
      sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
    />
  )
}
