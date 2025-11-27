import styled from 'styled-components'

// 容器样式
export const Container = styled.div`
  display: flex;
  width: 100%;
`

// 滚动宿主样式
export const ScrollHost = styled.div.withConfig({
  shouldForwardProp: prop => !['isTocExpanded'].includes(prop)
})<{ isTocExpanded: boolean }>`
  flex: 1;
  overflow-y: auto;
  height: 100%;
  padding-right: ${p => (p.isTocExpanded ? '300px' : '24px')};
`

// 文章样式
export const StyledArticle = styled.article`
  width: 100%;
  height: 100%;

  /* H1短标题 - 红到蓝的强烈渐变 */
  h1 {
    background:
      radial-gradient(
        circle at 50% 0,
        rgba(255, 0, 0, 0.5),
        rgba(255, 0, 0, 0) 70.71%
      ),
      radial-gradient(
        circle at 6.7% 75%,
        rgba(0, 0, 255, 0.5),
        rgba(0, 0, 255, 0) 70.71%
      ),
      radial-gradient(
        circle at 93.3% 75%,
        rgba(0, 255, 0, 0.5),
        rgba(0, 255, 0, 0) 70.71%
      ),
      beige;
    background-size: 200% 200%;
    animation: flow 4s linear infinite;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 3.2rem;
    font-weight: 900;
    text-wrap: balance;
    scroll-margin-top: 100px;
  }

  h2 {
    background: linear-gradient(183deg, #0066ff 17%, #00cc99 72%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 2.4rem;
    font-weight: 800;
    background-size: 100% 200%;
    text-wrap: balance;
    scroll-margin-top: 100px;
  }

  h3 {
    background: linear-gradient(183deg, #ff6600 17%, #ffcc00 72%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 2rem;
    font-weight: 700;
    background-size: 100% 200%;
    text-wrap: balance;
    scroll-margin-top: 100px;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    position: relative;
    scroll-margin-top: 100px;

    &:hover::before {
      content: '#';
      position: absolute;
      left: -24px;
      color: #1890ff;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  img {
    width: 100%;
  }

  @keyframes flow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`
