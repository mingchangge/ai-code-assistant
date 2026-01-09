import { useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import styled, { keyframes } from 'styled-components'
import { Card, Spin } from 'antd'
import { RobotOutlined, LoadingOutlined } from '@ant-design/icons'

// --- 1. 工具类初始化 ---
const mdParser = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true
})

// --- 2. 组件定义 ---
interface AiReportViewProps {
  content?: string
  loading?: boolean
  loadingTip?: string
}

export const AiReportView = ({
  content,
  loading,
  loadingTip = '🤔 AI 正在思考中...' // 默认文案简化
}: AiReportViewProps) => {
  // 缓存 HTML 生成
  const htmlContent = useMemo(() => {
    return content ? mdParser.render(content) : ''
  }, [content])

  return (
    <StyledCard
      title={
        <Header>
          <RobotOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
          <span>AI 私人顾问解读</span>
        </Header>
      }
    >
      {/* A. Loading 状态 (思考中) */}
      {loading && !content && (
        <LoadingContainer>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
          <StatusText>{loadingTip}</StatusText>
          {/* 这里只显示 "正在深度阅读数据..." 或 "AI 正在思考..." */}
        </LoadingContainer>
      )}

      {/* B. 内容展示区 */}
      {content && (
        <MarkdownContainer>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          {loading && <BlinkingCursor />}
        </MarkdownContainer>
      )}

      {/* C. 空状态 (理论上在外层控制了不显示，这里保留作为兜底) */}
      {!loading && !content && <EmptyState>暂无 AI 分析报告</EmptyState>}
    </StyledCard>
  )
}

// --- 3. Styled Components (保持不变) ---
const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`

const StyledCard = styled(Card)`
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e6f7ff;
  background: linear-gradient(to bottom, #ffffff, #f9fdff);
  transition: all 0.3s ease;

  .ant-card-head {
    border-bottom: 1px solid #f0f0f0;
    min-height: 48px;
  }

  .ant-card-body {
    padding: 20px;
    min-height: 200px;
  }
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #003a8c;
  font-weight: 600;
  font-size: 16px;
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  animation: ${fadeIn} 0.5s ease-out;
`

const StatusText = styled.div`
  margin-top: 16px;
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
  animation: ${blink} 2s infinite;
`

const EmptyState = styled.div`
  color: #ccc;
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
`

const BlinkingCursor = styled.span`
  display: inline-block;
  width: 6px;
  height: 16px;
  background-color: #1890ff;
  margin-left: 4px;
  vertical-align: middle;
  animation: ${blink} 0.8s infinite;
`

const MarkdownContainer = styled.div`
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial;
  font-size: 14px;
  line-height: 1.8;
  color: #333;

  > div {
    display: inline;
  }
  p {
    margin-bottom: 1em;
  }

  h1,
  h2,
  h3,
  h4 {
    color: #1f2937;
    font-weight: 600;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    line-height: 1.3;
  }
  h3 {
    font-size: 1.1em;
  }
  h4 {
    font-size: 1em;
  }

  ul,
  ol {
    padding-left: 20px;
    margin-bottom: 1em;
  }
  li {
    margin-bottom: 0.5em;
  }

  strong {
    color: #1890ff;
    font-weight: 600;
  }

  blockquote {
    border-left: 4px solid #d9d9d9;
    padding-left: 12px;
    margin-left: 0;
    margin-right: 0;
    color: #666;
    font-style: italic;
    background: #f5f5f5;
    padding: 8px 12px;
    border-radius: 4px;
  }

  a {
    color: #1890ff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  hr {
    border: 0;
    border-top: 1px solid #eee;
    margin: 20px 0;
  }
`
