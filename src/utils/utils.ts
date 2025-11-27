import MarkdownIt from 'markdown-it'

// 创建Markdown实例
export const createMarkdownInstance = () => {
  return new MarkdownIt({ html: true, linkify: true, typographer: true })
}

// 节流函数
export const throttle = <T extends unknown[]>(
  func: (...args: T) => void,
  limit: number
): ((...args: T) => void) => {
  let inThrottle = false
  return (...args: T) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 解析标题列表
export const parseHeadings = (html: string) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))

  return hs.map((h, i) => ({
    level: parseInt(h.tagName[1]),
    text: h.textContent ?? `标题 ${(i + 1).toString()}`,
    index: i
  }))
}
