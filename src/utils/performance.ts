/**
 * Performance monitoring and optimization utilities
 */

// Extend PerformanceEntry for First Input Delay
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number
  startTime: number
}

export interface PerformanceMetrics {
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timeToInteractive?: number
  totalBlockingTime?: number
}

/**
 * Measure Core Web Vitals
 */
export const measureCoreWebVitals = (): PerformanceMetrics => {
  const metrics: PerformanceMetrics = {}

  // First Contentful Paint (FCP)
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime
            console.log('FCP:', entry.startTime)
          }
        }
      }).observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('FCP measurement failed:', e)
    }
  }

  // Largest Contentful Paint (LCP)
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          metrics.largestContentfulPaint = entry.startTime
          console.log('LCP:', entry.startTime)
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      console.warn('LCP measurement failed:', e)
    }
  }

  // First Input Delay (FID)
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const firstInputEntry = entry as PerformanceEventTiming
          if (firstInputEntry.processingStart && firstInputEntry.startTime) {
            metrics.firstInputDelay = firstInputEntry.processingStart - firstInputEntry.startTime
            console.log('FID:', metrics.firstInputDelay)
          }
        }
      }).observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('FID measurement failed:', e)
    }
  }

  // Cumulative Layout Shift (CLS)
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        metrics.cumulativeLayoutShift = clsValue
        console.log('CLS:', clsValue)
      }).observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('CLS measurement failed:', e)
    }
  }

  return metrics
}

/**
 * Measure page load performance
 */
export const measurePageLoadPerformance = (): PerformanceMetrics => {
  const metrics: PerformanceMetrics = {}

  if ('performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
        const connectTime = perfData.responseEnd - perfData.requestStart
        const renderTime = perfData.domComplete - perfData.domLoading

        console.log('Page Load Time:', pageLoadTime)
        console.log('Connect Time:', connectTime)
        console.log('Render Time:', renderTime)

        // Time to Interactive (TTI) - simplified calculation
        metrics.timeToInteractive = pageLoadTime
      }, 0)
    })
  }

  return metrics
}

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  } as T
}

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean

  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  } as T
}

/**
 * Optimize re-renders with requestAnimationFrame
 */
export const optimizeRaf = (callback: () => void): number => {
  return requestAnimationFrame(() => {
    callback()
  })
}

/**
 * Cancel optimized render
 */
export const cancelOptimizeRaf = (id: number): void => {
  cancelAnimationFrame(id)
}

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): any => {
  if ('memory' in performance) {
    return (performance as any).memory
  }
  return null
}

/**
 * Report performance metrics to analytics
 */
export const reportPerformanceMetrics = (metrics: PerformanceMetrics): void => {
  // Send to your analytics service
  if (window.gtag) {
    window.gtag('event', 'page_timing', {
      fcp: metrics.firstContentfulPaint,
      lcp: metrics.largestContentfulPaint,
      fid: metrics.firstInputDelay,
      cls: metrics.cumulativeLayoutShift,
      tti: metrics.timeToInteractive,
    })
  }

  // Log to console for development
  if (process.env.NODE_ENV === 'development') {
    console.table(metrics)
  }
}

/**
 * Initialize performance monitoring
 */
export const initializePerformanceMonitoring = (): void => {
  if (typeof window !== 'undefined') {
    const metrics = {
      ...measureCoreWebVitals(),
      ...measurePageLoadPerformance()
    }

    // Report metrics after a delay to ensure all data is collected
    setTimeout(() => {
      reportPerformanceMetrics(metrics)
    }, 3000)
  }
}

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}