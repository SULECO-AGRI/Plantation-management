import { IMAGERY_BASE_LAYER_OPTIONS } from '../../data/layers'
import type { ImageryBaseLayerId } from '../../types/gis'

type Props = {
  activeBaseLayer: ImageryBaseLayerId
  onSelectBaseLayer: (id: ImageryBaseLayerId) => void
}

export function BaseMapSwitcher({ activeBaseLayer, onSelectBaseLayer }: Props) {
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
              <span className="basemap-pill-card__label">{option.shortLabel}</span>
              <span className={`basemap-pill-dot ${isSelected ? 'basemap-pill-dot--selected' : ''}`} />
            </button>
          )
        })}
      </div>
    </aside>
  )
}
