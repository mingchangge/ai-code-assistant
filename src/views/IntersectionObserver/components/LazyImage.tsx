import { useEffect, useState } from 'react'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import styled from 'styled-components'

const ImageContainer = styled.div`
  position: relative;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
  transition: transform 0.3s ease;
  &:hover {
    transform: scale(1.05);
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.5s ease;
    &.loaded {
      opacity: 1;
    }
  }
  .placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;
    font-size: 14px;
  }
  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    @keyframes spin {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
  }
`

function LazyImage({
  src,
  alt,
  placeholder
}: {
  src: string
  alt: string
  placeholder?: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [ref, isIntersecting] = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: '10px',
    triggerOnce: true
  })

  useEffect(() => {
    if (isIntersecting && !isLoaded && !isLoading) {
      setIsLoading(true)
      const img = new Image()
      img.src = src
      img.onload = () => {
        setIsLoaded(true)
        setIsLoading(false)
      }
      img.onerror = () => {
        setIsLoading(false)
      }
    }
  }, [isIntersecting, src, isLoaded, isLoading])
  return (
    <ImageContainer ref={ref}>
      {!isLoaded && !isLoading && (
        <div className="placeholder">{placeholder}</div>
      )}
      {isLoading && <div className="loading">loading</div>}
      {isLoaded && <img src={src} alt={alt} className={'loaded'} />}
    </ImageContainer>
  )
}

export default LazyImage
