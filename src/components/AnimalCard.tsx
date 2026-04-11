import React from 'react'
import { Link } from 'react-router-dom'
import { SafeImage } from './SafeImage'
import type { LanguageCode } from '../stores/languageStore'

interface AnimalCardProps {
  href: string
  imgSrc?: string
  imgAlt?: string
  title: string
  subtitle?: string
  tip?: string
}

const AnimalCard: React.FC<AnimalCardProps> = ({ href, imgSrc, imgAlt, title, subtitle, tip }) => {
  return (
    <article className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-2xl">
      <div className="h-36 w-full bg-neutral-50 flex items-center justify-center overflow-hidden">
        {imgSrc ? (
          <SafeImage src={imgSrc} alt={imgAlt || title} className="object-cover h-full w-full" />
        ) : (
          <div className="flex items-center justify-center h-full w-full text-6xl">🐾</div>
        )}
      </div>
      <div className="px-4 py-4">
        <h3 className="font-semibold text-lg text-neutral-800 truncate">{title}</h3>
        {subtitle ? <p className="text-sm text-neutral-600 mt-1">{subtitle}</p> : null}
        {tip ? <p className="text-xs mt-3 text-neutral-500">{tip}</p> : null}
        <div className="mt-4 flex items-center gap-2">
          <Link to={href} className="text-sm bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-2 rounded-lg">Explore</Link>
          <Link to={href} className="text-sm text-neutral-600 px-3 py-2 rounded-lg hover:bg-neutral-50">Details</Link>
        </div>
      </div>
    </article>
  )
}

export default AnimalCard
