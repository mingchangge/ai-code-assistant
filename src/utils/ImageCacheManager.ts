// 创建图片缓存管理类
export default class ImageCacheManager {
  // 使用Map存储图片缓存，键为`${documentId}:${url}`的组合，值为图片相关信息
  private cache = new Map<string, { url: string; documentId: string }>()
  private order: string[] = [] // 用于LRU策略，存储组合键
  private maxSize = 100 // 最大缓存100张图片
  private usageMap = new Map<string, number>() // 记录使用次数
  private documentMap = new Map<string, Set<string>>() // 文档ID到图片组合键的映射

  // 生成唯一的缓存键
  private getCacheKey(url: string, documentId: string): string {
    return `${documentId}:${url}`
  }

  // 添加图片到缓存
  add(url: string, documentId: string): void {
    if (!documentId) {
      console.warn('缺少documentId，无法添加到缓存')
      return
    }

    const cacheKey = this.getCacheKey(url, documentId)

    // 更新使用次数
    const currentCount = this.usageMap.get(cacheKey) ?? 0
    this.usageMap.set(cacheKey, currentCount + 1)

    // 如果已存在，先移除旧位置
    if (this.cache.has(cacheKey)) {
      const index = this.order.indexOf(cacheKey)
      if (index > -1) {
        this.order.splice(index, 1)
      }
    } else if (this.cache.size >= this.maxSize) {
      // 缓存已满，移除最早添加的图片
      this.evictOldest()
    }

    // 添加到最新位置
    this.cache.set(cacheKey, { url, documentId })
    this.order.push(cacheKey)

    // 记录图片与文档的关联关系
    if (!this.documentMap.has(documentId)) {
      this.documentMap.set(documentId, new Set())
    }
    const keysForDoc = this.documentMap.get(documentId)
    keysForDoc?.add(cacheKey)
  }

  // 检查图片是否在缓存中
  has(url: string, documentId: string): boolean {
    if (!documentId) return false

    const cacheKey = this.getCacheKey(url, documentId)

    // 访问时更新使用次数
    if (this.cache.has(cacheKey)) {
      const currentCount = this.usageMap.get(cacheKey) ?? 0
      this.usageMap.set(cacheKey, currentCount + 1)
      return true
    }
    return false
  }

  // 移除最早添加的图片
  private evictOldest(): void {
    const oldestKey = this.order.shift()
    if (oldestKey) {
      const imageInfo = this.cache.get(oldestKey)
      if (imageInfo) {
        this.cache.delete(oldestKey)
        this.usageMap.delete(oldestKey)

        // 从documentMap中也移除对应的关联
        const documentId = imageInfo.documentId
        if (this.documentMap.has(documentId)) {
          const keys = this.documentMap.get(documentId)
          if (keys) {
            keys.delete(oldestKey)
            // 如果文档没有关联的图片了，删除该文档的条目
            if (keys.size === 0) {
              this.documentMap.delete(documentId)
            }
          }
        }
      }
    }
  }

  // 清理与特定文档相关的图片
  clearDocumentImages(documentId: string): void {
    if (this.documentMap.has(documentId)) {
      const keysToRemove = this.documentMap.get(documentId)
      if (keysToRemove) {
        keysToRemove.forEach(key => {
          this.cache.delete(key)
          const index = this.order.indexOf(key)
          if (index > -1) {
            this.order.splice(index, 1)
          }
          this.usageMap.delete(key)
        })

        // 移除该文档的条目
        this.documentMap.delete(documentId)
      }
    }
  }

  // 获取特定文档的图片URL集合
  getDocumentImages(documentId: string): Set<string> {
    const result = new Set<string>()
    if (this.documentMap.has(documentId)) {
      const keys = this.documentMap.get(documentId)
      if (keys) {
        keys.forEach(key => {
          const imageInfo = this.cache.get(key)
          if (imageInfo) {
            result.add(imageInfo.url)
          }
        })
      }
    }
    return result
  }

  // 清理整个缓存
  clear(): void {
    this.cache.clear()
    this.order = []
    this.usageMap.clear()
    this.documentMap.clear()
  }

  // 获取缓存大小
  get size(): number {
    return this.cache.size
  }

  // 处理HTMLImageElement并添加到缓存
  handleImageElement(img: HTMLImageElement, documentId: string): void {
    const src = img.src

    if (this.has(src, documentId)) {
      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')
      img.dataset.fromCache = 'true'
    } else {
      const preloadImg = new Image()
      preloadImg.src = src
      preloadImg.onload = () => {
        this.add(src, documentId)
        img.dataset.loaded = 'true'
      }

      preloadImg.onerror = () => {
        console.warn(`图片加载失败: ${src}`)
        img.dataset.loadingError = 'true'
      }
    }
  }

  // 处理图片集合
  handleImageCollection(
    images: NodeListOf<HTMLImageElement>,
    documentId: string
  ): boolean {
    const hasImages = images.length > 0

    if (hasImages) {
      images.forEach(img => {
        this.handleImageElement(img, documentId)
      })
    }

    return hasImages
  }

  // 延迟清理文档图片缓存
  delayedClearDocumentImages(documentId: string, delay = 1000): void {
    setTimeout(() => {
      this.clearDocumentImages(documentId)
    }, delay)
  }
}
