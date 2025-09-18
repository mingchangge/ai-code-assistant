import '@/styles/font.css'
import styled from 'styled-components'

const info = {
  name: '亲爱的朋友',
  border: '1px solid transparent'
}

const CardCodeStyle = `
  .card {
    position: relative;
    z-index: 0;
    min-width: 280px;
    height: 300px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: visible;
  }

  .card::before {
    content: '';
    padding: 4px;
    position: absolute;
    /* 
    * inset 是 CSS 中用于同时设置元素 top、right、bottom、left 四个方向偏移量的简写属性。
    *  inset: -4px; 等价于：
    *  top: -4px;
    *  right: -4px;
    *  bottom: -4px;
    *  left: -4px;
    *  这里使用 inset: -4px 是为了让伪元素 ::before 比父元素 .card 大出 8px（上下各大4px，左右各大4px），
    *  从而实现伪元素 ::before 与父元素 .card 之间的 8px 间距。
    */
    inset: -4px;
    border-radius: inherit;
    /* 1. 给渐变添加角度变量（--angle），用于动画控制 */
    background: conic-gradient(
      from var(--angle, 0deg),
      /* 起始角度由变量控制，默认0deg */ #00ffff 0deg,
      #ff00ff 90deg,
      #ffff00 180deg,
      #00ff00 270deg,
      #00ffff 360deg
    );
    z-index: -1;
    /* 
    * 标准语法的遮罩设置
    * 这是通过 两层遮罩叠加并使用 “排除” 逻辑 实现的效果，类似 “减法” 运算：
    * 第一层遮罩（linear-gradient(#000 0 0) content-box）：
    * 生成一个纯黑色矩形，范围被限制在 content-box（内容区域，受 padding 影响）。
    * 第二层遮罩（linear-gradient(#000 0 0)）：
    * 生成一个纯黑色矩形，范围是整个元素（包括边框区域）。
    * 遮罩合成规则（xor / exclude）：
    * 只显示 “两层遮罩不重叠的区域”—— 也就是中间内容区域被挖空，只保留外层边框部分。
    * 简单来说：可以想象成两张黑色的纸：
    * 第一张纸（第一层遮罩）中间有一个与卡片内容大小相同的黑洞（content-box 限制）；
    * 第二张纸（第二层遮罩）是完整的黑纸；
    * 叠加后，只有 “黑洞边缘” 的区域会显示背景渐变（即我们看到的彩色边框）。
    */
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    /* WebKit 内核浏览器（Chrome、Safari 等）的遮罩设置 */
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    animation: clockwiseFlow 3s linear infinite;
  }
  /* 奇数框：顺时针旋转 */
  .card:nth-child(odd)::before {
    animation-name: clockwiseFlow;
  }

  /* 偶数框：逆时针旋转 */
  .card:nth-child(even)::before {
    animation-name: counterClockwiseFlow;
  }
  /* 3. 定义动画：让角度从0deg递增到360deg */
  @keyframes clockwiseFlow {
    to {
      --angle: 360deg;
    }
  }

  @keyframes counterClockwiseFlow {
    to {
      --angle: -360deg;
    }
  }

  /* 4. 兼容声明：部分浏览器需要前缀才能识别--angle变量控制渐变角度 */
  @property --angle {
    syntax: '<angle>'; /* 变量类型：角度 */
    inherits: false; /* 不继承父元素值 */
    initial-value: 0deg; /* 初始值 */
  }
`
const H2Style = styled.h2`
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
  text-decoration: underline; /* 装饰线样式 */
  text-decoration-style: dotted; /* 装饰线样式 */
  text-decoration-color: #4a90e2; /* 装饰线颜色 */
  text-underline-offset: 10px;
  text-decoration-thickness: 2px;
`
const FontBox = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
  .grid-item {
    width: 100%;
    overflow-x: hidden;
    padding: 4px;
    .code-block-wrapper {
      width: 100%;
      height: 100%;
      border-radius: 15px;
      overflow: hidden; /* 父级不处理纵向滚动 */
      h2 {
        font-size: 24px;
        margin: 0;
        padding-left: 12px;
      }
      .language-box {
        width: 100%;
        height: calc(100% - 39px);
        font-size: 12px;
        line-height: 1.4;
        background: #f5f5f5;
        -webkit-text-fill-color: #000000;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        white-space: pre-wrap; /* 保持换行 */
        word-break: break-all; /* 长单词换行 */
        overflow: auto; /* 只保留纵向滚动 */
        pre {
          margin: 0;
          overflow: visible;
          code {
            font-size: 14px;
          }
        }
      }
      .article-box {
        height: 100%;
        overflow: auto;
      }
      .article {
        background: #fff;
        -webkit-text-fill-color: #000000;
        font-size: 14px;
        line-height: 1.6;
        padding: 10px 12px;
        &-code {
          background: #f5f5f5;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        }
      }
    }
  }
  ${CardCodeStyle}
`

function MyComponent() {
  return (
    <>
      <H2Style className="title">
        Hello {info.name}， 欢迎来到React的世界！
      </H2Style>
      <FontBox>
        <div className="grid-item">
          <div className="normal card" style={{ border: info.border }}>
            <div className="code-block-wrapper">
              <h2>css边框渐变动画</h2>
              <div className="language-box">
                <pre>
                  <code>{CardCodeStyle}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
        <div className="grid-item">
          <div className="normal2 card">
            <div className="code-block-wrapper">
              <div className="article-box">
                <h2>text-decoration-thickness 装饰线粗细</h2>
                <div className="article">
                  <p>
                    <span className="article-code">
                      text-decoration-thickness: 2px;
                    </span>
                    用于设置元素中文本所使用的装饰线（如 line-through、underline
                    或
                    overline）的笔触厚度。以前只能通过before/after伪元素或边框实现，现在可以直接设置。渐变色实现还是得通过老方法实现
                  </p>
                </div>
                <h2>text-underline-offset 装饰线偏移</h2>
                <div className="article">
                  <p>
                    <span className="article-code">
                      text-underline-offset: 10px;
                    </span>
                    用于设置文本装饰线（如下划线、上划线等）相对于文本基线的垂直偏移量。正值会将装饰线向下移动，负值会将装饰线向上移动。可以更灵活地控制装饰线的位置，使其与文本的视觉效果更协调。
                    <span className="article-code">text-underline-offset</span>
                    不是 <span className="article-code">
                      text-decoration
                    </span>{' '}
                    简写的一部分。虽然元素可以有多条
                    <span className="article-code">
                      text-decoration
                    </span> 线，但{' '}
                    <span className="article-code">text-underline-offset</span>
                    只影响下划线，而不影响其他可能的线装饰选项，例如{' '}
                    <span className="article-code">
                      text-decoration: overline;
                    </span>{' '}
                    或
                    <span className="article-code">
                      text-decoration: line-through;
                    </span>
                    。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FontBox>
    </>
  )
}
export default MyComponent
