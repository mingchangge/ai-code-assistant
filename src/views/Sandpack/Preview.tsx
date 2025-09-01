import { Sandpack } from '@codesandbox/sandpack-react'
import useTheme from '@/hooks/useTheme'

export default function Preview({ files }: { files: Record<string, string> }) {
  const { theme } = useTheme()
  return (
    <Sandpack
      template="vite-react" // 模板已内置，无需联网
      files={files}
      theme={theme}
      options={{ showLineNumbers: true }}
    />
  )
}
