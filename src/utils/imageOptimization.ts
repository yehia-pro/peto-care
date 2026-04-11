/**
 * Image optimization utilities for better performance
 */

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  loading?: 'lazy' | 'eager'
}

/**
 * Generate optimized image URL with parameters
 */
export const getOptimizedImageUrl = (
  imageUrl: string,
  options: ImageOptimizationOptions = {}
): string => {
  const { width, height, quality = 80, format = 'webp' } = options
  
  // If using external image service, add optimization parameters
  if (imageUrl.includes('unsplash.com') || imageUrl.includes('placeholder')) {
    const url = new URL(imageUrl)
    
    if (width) url.searchParams.set('w', width.toString())
    if (height) url.searchParams.set('h', height.toString())
    if (quality) url.searchParams.set('q', quality.toString())
    if (format) url.searchParams.set('fm', format)
    
    return url.toString()
  }
  
  return imageUrl
}

/**
 * Preload critical images
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export const preloadImages = async (imageUrls: string[]): Promise<void> => {
  const promises = imageUrls.map(url => preloadImage(url))
  await Promise.allSettled(promises)
}

/**
 * Generate responsive image srcset
 */
export const generateSrcSet = (
  baseUrl: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string => {
  return widths
    .map(width => `${getOptimizedImageUrl(baseUrl, { width })} ${width}w`)
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export const generateSizes = (breakpoints: Record<string, string> = {
  '(max-width: 640px)': '100vw',
  '(max-width: 768px)': '90vw',
  '(max-width: 1024px)': '80vw',
  '(max-width: 1280px)': '70vw',
  'default': '60vw'
}): string => {
  return Object.entries(breakpoints)
    .map(([media, size]) => media === 'default' ? size : `${media} ${size}`)
    .join(', ')
}

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImages = (): void => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without Intersection Observer
    const images = document.querySelectorAll('img[data-src]')
    images.forEach(img => {
      const imgElement = img as HTMLImageElement
      imgElement.src = imgElement.dataset.src || ''
      delete imgElement.dataset.src
    })
    return
  }

  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          img.src = img.dataset.src || ''
          img.classList.add('loaded')
          delete img.dataset.src
          observer.unobserve(img)
        }
      })
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  )

  const images = document.querySelectorAll('img[data-src]')
  images.forEach(img => imageObserver.observe(img))
}

/**
 * Generate blur data URL for placeholder
 */
export const generateBlurDataUrl = (width: number = 32, height: number = 32): string => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    ctx.fillStyle = '#e5e7eb' // gray-200
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

/**
 * Image loading error handler
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>): void => {
  const img = event.currentTarget
  img.src = '/placeholder-pet.jpg' // fallback image
  img.alt = 'Image not available'
}