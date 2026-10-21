import React from 'react'
import { useTranslation } from '../../context/LanguageContext'

interface CropLensBrandProps {
  title?: string
  subtitle?: string
  theme?: 'dark' | 'light' // 'dark' = dark teal text (for white headers), 'light' = white text (for dark headers/footers)
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showSubtitle?: boolean
}

export const CropLensLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  const gradId = React.useId().replace(/:/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`croplens-badge-svg ${className}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#12836b" />
          <stop offset="45%" stopColor="#0b6855" />
          <stop offset="100%" stopColor="#06483a" />
        </linearGradient>
      </defs>

      {/* Rounded Badge Base */}
      <rect x="2" y="2" width="96" height="96" rx="22" ry="22" fill={`url(#${gradId})`} />
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="22"
        ry="22"
        fill="none"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="1.5"
      />

      {/* Circular Emblem Outline */}
      <circle cx="50" cy="50" r="39" fill="none" stroke="#ffffff" strokeWidth="4" />

      {/* Folded Map Panels */}
      {/* Left panel */}
      <path
        d="M 26 44 L 38 39 L 38 25 L 26 29 Z"
        fill="rgba(255, 255, 255, 0.16)"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Center panel */}
      <path
        d="M 38 39 L 62 39 L 62 25 L 38 25 Z"
        fill="rgba(255, 255, 255, 0.26)"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Right panel */}
      <path
        d="M 62 39 L 74 44 L 74 29 L 62 25 Z"
        fill="rgba(255, 255, 255, 0.16)"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Map Internal Grid lines */}
      <line x1="26" y1="36.5" x2="38" y2="32" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <line x1="38" y1="32" x2="62" y2="32" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <line x1="62" y1="32" x2="74" y2="36.5" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <line x1="32" y1="27" x2="32" y2="41.5" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <line x1="50" y1="25" x2="50" y2="39" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />
      <line x1="68" y1="27" x2="68" y2="41.5" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.75" />

      {/* Map Marker Pin */}
      <path
        d="M 50 17 C 44.2 17 39.5 21.7 39.5 27.5 C 39.5 35 50 44 50 44 C 50 44 60.5 35 60.5 27.5 C 60.5 21.7 55.8 17 50 17 Z"
        fill="#ffffff"
      />
      <circle cx="50" cy="27" r="4.2" fill="#0b6855" />

      {/* Horizontal Divider / Field Edge */}
      <path
        d="M 14 51 Q 50 48 86 51"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Curved Agricultural Plantation Field Furrows */}
      <path
        d="M 17 61 C 30 55, 60 55, 83 61"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M 21 71 C 33 65, 59 65, 79 71"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M 27 80 C 37 75, 55 75, 73 80"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Perspective furrow ridges / rows */}
      <path
        d="M 37 51 C 34 62, 28 72, 22 81"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 50 50 C 49.5 61, 48.5 71, 47 84"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M 63 51 C 65 62, 70 72, 76 81"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export const CropLensBrand: React.FC<CropLensBrandProps> = ({
  title = 'Spatio Agri',
  subtitle,
  theme = 'dark',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const { t } = useTranslation()
  const displaySubtitle = subtitle || t('brand.subtitle')
  const words = title.split(' ')
  const firstWord = words[0] || 'Spatio'
  const secondWord = words.slice(1).join(' ') || 'Agri'

  return (
    <div className={`croplens-brand croplens-brand--${size} croplens-brand--${theme} ${className}`}>
      <div className="croplens-brand__text">
        <span className="croplens-brand__title">
          <span className="croplens-brand__word-primary">{firstWord}</span>
          {secondWord && <span className="croplens-brand__word-accent">{secondWord}</span>}
        </span>
        {showSubtitle && displaySubtitle && (
          <span className="croplens-brand__subtitle">{displaySubtitle}</span>
        )}
      </div>
    </div>
  )
}

export const SpatioAgriBrand = CropLensBrand
export default CropLensBrand

