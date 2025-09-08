import { useState } from 'react'
import PromptBox from './components/PromptBox'
import CodePreview from './components/CodeEditPreview'
import styled from 'styled-components'

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: 40px auto;
  grid-template-columns: 1fr 1fr;
  .full-width {
    grid-column: 1 / 3;
  }
  .grid-item {
    height: 100%;
    grid-row: 2 / 3;
    &.code-preview {
      padding: 10px;
    }
    &:first-child {
      grid-column: 1 / 2;
    }
    &:last-child {
      grid-column: 2 / 3;
    }
    .code-editor {
      height: 100%;
    }
  }
`

// 默认代码
const defaultCode = `export default function Hello() {
  const [count, setCount] = React.useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击了 {count} 次
    </button>
  );
}`

export default function MiniCodePreview() {
  const [code, setCode] = useState(defaultCode)
  return (
    <Container>
      <div className="full-width">
        <PromptBox setCode={setCode} />
      </div>
      <CodePreview code={code} onChange={setCode} />
    </Container>
  )
}
