import React from 'react'

interface SkeletonProps {
    className?: string
}

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
    </div>
)

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4 space-x-reverse">
                <div className="rounded-full bg-gray-300 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
)

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
    rows = 5,
    cols = 4
}) => (
    <div className="animate-pulse space-y-3">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 rounded"></div>
            ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: cols }).map((_, j) => (
                    <div key={j} className="h-3 bg-gray-200 rounded"></div>
                ))}
            </div>
        ))}
    </div>
)

export const SkeletonImage: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-300 rounded ${className}`}></div>
)
