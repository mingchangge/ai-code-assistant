import { useState, useCallback } from 'react'
import { Button, Flex, Input } from 'antd'

interface Messages {
  role: 'user' | 'assistant' | 'system'
  content: string
}
interface ChoicesType {
  message: Messages
  index: number
}
interface ResultType {
  code: string
  messages: string
  sid: string
  choices?: ChoicesType[]
}
interface CodeType {
  setCode: (code: string) => void
}

/* ---------- 工具 ---------- */
const getLastLines = (code: string, n = 20) =>
  code.split('\n').slice(-n).join('\n')

const continuePrompt = (lastCode: string) =>
  `直接接着下面代码末尾续写，**不要重复**任何已生成内容，不要解释，不要加注释：\n\n\`\`\`jsx\n${lastCode}\n`
/** 若新段与末尾 n 行重复，整段删掉 */
const dedupTail = (oldStr: string, newStr: string, lines = 10) => {
  const tail = oldStr.split('\n').slice(-lines).join('\n')
  return newStr.includes(tail) ? '' : newStr
}
/* ---------- 完整性判断 ---------- */
const isComplete = (txt: string) => {
  const cleaned = txt.replace(/`{3}[\s\S]*?`{3}/g, '')
  const fences = (cleaned.match(/```/g) ?? []).length
  if (fences % 2 !== 0) return false
  const open = (txt.match(/{/g) ?? []).length
  const close = (txt.match(/}/g) ?? []).length
  if (open !== close) return false
  const divOpen = (txt.match(/<div[^>]*>/g) ?? []).length
  const divClose = (txt.match(/<\/div>/g) ?? []).length
  return divOpen === divClose
}

/* ---------- ND-JSON 解析 ---------- */
const parseNdjson = (text: string) =>
  text
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l) as ResultType)

const MAX_CONTINUE = 3
const systemPrompt = (userDesc: string) =>
  `
    你是纯代码生成器，必须遵守以下动态白名单规则：
    1. 只生成**一个**React组件，且必须**默认导出**；
    2. 组件名、功能、属性**必须严格对应**用户描述："${userDesc}";
    3. 不允许出现**任何未被使用的**子组件、函数、常量；
    4. 不允许出现**解释文字**、“配套的CSS”“文件内容如下”等描述；
    5. 样式只能用<style jsx>{'...'}</style>**一次性写完**，不允许额外CSS文件块；
    6. 生成完毕**立即结束**，不要示例、不要注释、不要多余文字；
  `.trim()
/** 去掉 AI 可能残留的 ```jsx / ```css / 结尾 ``` 等围栏 */
const cleanCode = (raw: string) =>
  raw
    // 去掉开头 ```jsx 或 ```css 或单独 ```
    .replace(/^```(jsx|css)?\n?/gm, '')
    // 去掉结尾 ```
    .replace(/\n?```$/gm, '')
    .trim()
/* ---------- 组件 ---------- */
export default function PromptBox({ setCode }: CodeType) {
  const [prompt, setPrompt] = useState('')
  const messagesRef = useState<Messages[]>([])[0]
  const setMessages = useState<Messages[]>([])[1]
  const [loading, setLoading] = useState(false)

  /** 请求 Spark：skipHistory = true 时只带 system + 当前消息 */
  const completeReply = async (userMsg: string, skipHistory = false) => {
    setLoading(true)
    const msgs: Messages[] = skipHistory
      ? [
          { role: 'system', content: systemPrompt(prompt) },
          { role: 'user', content: userMsg }
        ]
      : [
          { role: 'system', content: systemPrompt(prompt) },
          ...messagesRef.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMsg }
        ]

    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_API_PASSWORD as string}`,
      'Content-Type': 'application/json'
    }
    const body = {
      model: 'x1',
      temperature: 0.3,
      max_tokens: 1024,
      messages: msgs
    }

    try {
      const res = await fetch('/api-spark/v2/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(await res.text())

      const ndText = await res.text()
      const arr = parseNdjson(ndText)
      const fullRaw = arr
        .map(c => c.choices?.[0]?.message?.content ?? '')
        .join('')
      return fullRaw
    } catch (e) {
      console.error(e)
      alert('生成失败：' + (e as Error).message)
      return ''
    } finally {
      setLoading(false)
    }
  }

  /** 发送主流程 */
  const sendPrompt = useCallback(
    async (text: string) => {
      setLoading(true)
      try {
        /* 1. 第一轮：拿“脏”数据，先洗一次给页面渲染 */
        let dirtyReply = await completeReply(text, false)
        if (!dirtyReply) return
        setCode(cleanCode(dirtyReply)) // 立刻显示干净代码

        /* 2. 继续轮次：用“脏”副本拼，再整体洗 */
        let count = 0
        while (!isComplete(dirtyReply) && count < MAX_CONTINUE) {
          const lastCode = getLastLines(dirtyReply, 20)
          const nextDirty = await completeReply(continuePrompt(lastCode), true)
          if (!nextDirty) break
          const deduped = dedupTail(dirtyReply, nextDirty)
          if (!deduped) {
            // 整段重复，直接视为已结束
            console.log('检测到重复，提前终止')
            break
          }
          dirtyReply += '\n' + deduped
          count++
        }

        /* 3. 全部拼完后，一次性清洗并刷新页面 */
        const finalClean = cleanCode(dirtyReply)
        setCode(finalClean)

        /* 4. 历史只记最终干净代码 */
        setMessages(prev => [
          ...prev,
          { role: 'user', content: text },
          { role: 'assistant', content: finalClean }
        ])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [setCode, messagesRef, setMessages]
  )

  return (
    <Flex gap="small" wrap="nowrap">
      <Input
        type="text"
        placeholder="描述你要的 React 组件或功能..."
        value={prompt}
        onChange={e => {
          setPrompt(e.target.value)
        }}
      />
      <Button
        type="primary"
        onClick={() => void sendPrompt(prompt)}
        disabled={loading}
      >
        {loading ? '生成中…' : '星火生成'}
      </Button>
    </Flex>
  )
}
