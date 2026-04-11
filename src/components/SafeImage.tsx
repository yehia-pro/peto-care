import React, { useState, ImgHTMLAttributes } from 'react'

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    fallbackSrc?: string
}

// Inline SVG placeholder — لا يحتاج ملف خارجي، يعمل دائماً
const FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Crect x='160' y='100' width='80' height='80' rx='8' fill='%23d1d5db'/%3E%3Ccircle cx='185' cy='120' r='10' fill='%239ca3af'/%3E%3Cpath d='M160 165 L185 135 L210 160 L225 145 L240 165 Z' fill='%239ca3af'/%3E%3Ctext x='200' y='220' text-anchor='middle' fill='%239ca3af' font-size='13' font-family='Arial'%3ENo Image%3C/text%3E%3C/svg%3E"

/**
 * SafeImage component that gracefully handles image loading errors
 * by displaying a placeholder image instead of a broken image icon
 */
export const SafeImage: React.FC<SafeImageProps> = ({
    src,
    alt,
    fallbackSrc = FALLBACK_SVG,
    onError,
    ...props
}) => {
    const getFullSrc = (url: string) => {
        if (!url) return fallbackSrc

        let processedUrl = url

        // Fix legacy or misconfigured paths that contain absolute local paths
        if (processedUrl.includes('/uploads/')) {
            processedUrl = processedUrl.substring(processedUrl.indexOf('/uploads/'))
        } else if (processedUrl.includes('\\uploads\\')) {
            processedUrl = processedUrl.substring(processedUrl.indexOf('\\uploads\\')).replace(/\\/g, '/')
        }

        // If it's already an absolute URL or data URI, keep it
        if (
            processedUrl.startsWith('http://') ||
            processedUrl.startsWith('https://') ||
            processedUrl.startsWith('data:')
        ) {
            return processedUrl
        }

        // Handle server-side relative paths like /uploads/...
        if (processedUrl.startsWith('/uploads')) {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/api'
            const baseUrl = apiUrl.replace(/\/api\/?$/, '')
            return `${baseUrl}${processedUrl}`
        }

        return processedUrl
    }

    const [imgSrc, setImgSrc] = useState(() => getFullSrc(src))
    const [hasError, setHasError] = useState(false)

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (!hasError) {
            setHasError(true)
            setImgSrc(fallbackSrc)
        }
        if (onError) onError(e)
    }

    React.useEffect(() => {
        setImgSrc(getFullSrc(src))
        setHasError(false)
    }, [src])

    return (
        <img
            {...props}
            src={imgSrc}
            alt={alt}
            onError={handleError}
        />
    )
}

export default SafeImage
