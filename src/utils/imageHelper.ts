export const getImageUrl = (path: string | undefined | null, defaultImage: string = '/default-avatar.png'): string => {
    if (!path) return defaultImage

    if (path.startsWith('http') || path.startsWith('https') || path.startsWith('data:')) {
        return path
    }

    // Remove duplicate slashes if any when combining
    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:7860').replace(/\/$/, '')
    const cleanPath = path.startsWith('/') ? path : `/${path}`

    return `${baseUrl}${cleanPath}`
}
