import { Globe, Layers } from 'lucide-react'
import { IMAGERY_BASE_LAYER_OPTIONS } from '../../data/layers'
import type { ImageryBaseLayerId } from '../../types/gis'

type Props = {
  activeBaseLayer: ImageryBaseLayerId
  onSelectBaseLayer: (id: ImageryBaseLayerId) => void
}

export function BaseMapSwitcher({ activeBaseLayer, onSelectBaseLayer }: Props) {
  const getIcon = (type: 'satellite' | 'rgb') => {
    switch (type) {
      case 'satellite':
        return <Globe size={14} />
      case 'rgb':
        return <Layers size={14} />
    }
  }

  return (
    <aside
      className="basemap-floating-switcher"
      aria-label="Base Imagery and Map Selector"
    >
      <div className="basemap-floating-switcher__cards" role="radiogroup" aria-label="Base map selection">
        {IMAGERY_BASE_LAYER_OPTIONS.map((option) => {
          const isSelected = activeBaseLayer === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`basemap-pill-card ${isSelected ? 'basemap-pill-card--active' : ''}`}
              onClick={() => onSelectBaseLayer(option.id)}
              title={option.label}
            >
              <span className={`basemap-pill-card__thumb basemap-pill-card__thumb--${option.thumbnailType}`}>
                {getIcon(option.thumbnailType)}
              </span>
              <div className="basemap-pill-card__info">
                <strong>{option.shortLabel}</strong>
                <small>{option.subtitle}</small>
              </div>
              <div className={`basemap-pill-dot ${isSelected ? 'basemap-pill-dot--selected' : ''}`} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
