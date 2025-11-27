import { useEffect, useRef } from 'react'
import ImageCacheManager from '@/utils/ImageCacheManager'

const imageCache = new ImageCacheManager()

export const useImageCache = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  documentId: string,
  shouldProcessImages: boolean
) => {
  const previousDocumentIdRef = useRef<string>('')

  useEffect(() => {
    // 切换文档时清理旧缓存
    if (
      previousDocumentIdRef.current &&
      previousDocumentIdRef.current !== documentId &&
      imageCache.getDocumentImages(previousDocumentIdRef.current).size > 0
    ) {
      imageCache.delayedClearDocumentImages(previousDocumentIdRef.current, 1000)
    }

    previousDocumentIdRef.current = documentId

    return () => {
      // 组件卸载时清理缓存
      if (
        previousDocumentIdRef.current === documentId &&
        imageCache.getDocumentImages(documentId).size > 0
      ) {
        imageCache.delayedClearDocumentImages(documentId, 2000)
      }
    }
  }, [documentId])

  // 处理容器中的图片
  useEffect(() => {
    if (!containerRef.current || !shouldProcessImages) return

    const images =
      containerRef.current.querySelectorAll<HTMLImageElement>('img')
    imageCache.handleImageCollection(images, documentId)
  }, [containerRef, documentId, shouldProcessImages])

  // 返回一些额外的缓存信息或方法
  return {
    documentImageCount: imageCache.getDocumentImages(documentId).size,
    clearDocumentCache: () => {
      imageCache.clearDocumentImages(documentId)
    }
  }
}
