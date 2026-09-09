import { Image, Layers3, RotateCcw } from 'lucide-react'
import { ESTATE_LAYERS } from '../../../data/layers'
import type { LayerKey } from '../../../types/gis'

type Props = {
  visibility: Record<LayerKey, boolean>
  imageryVisible: boolean
  imageryStatus: 'loading' | 'ready' | 'error'
  onToggleLayer: (key: LayerKey) => void
  onToggleImagery: () => void
  onResetView: () => void
}

export function LayerController({
  visibility,
  imageryVisible,
  imageryStatus,
  onToggleLayer,
  onToggleImagery,
  onResetView,
}: Props) {
  const fieldLayers = ESTATE_LAYERS.filter((layer) => layer.kind === 'field')
  const divisionLayers = ESTATE_LAYERS.filter((layer) => layer.kind === 'division')

  return (
    <section className="map-card layer-controller" aria-label="Map layers">
      <div className="map-card__header">
        <div>
          <span className="eyebrow">Map controls</span>
          <h2><Layers3 size={18} /> Layers</h2>
        </div>
        <button className="icon-btn" type="button" title="Reset map view" onClick={onResetView}>
          <RotateCcw size={16} />
        </button>
      </div>

      <button className="layer-row" type="button" onClick={onToggleImagery} aria-label="Toggle VisiGeo imagery">
        <span className="layer-swatch layer-swatch--imagery"><Image size={14} /></span>
        <span className="layer-copy">
          <strong>VisiGeo imagery</strong>
          <small className={`source-status source-status--${imageryStatus}`}>
            {imageryStatus === 'loading' ? 'Checking tiles' : imageryStatus === 'ready' ? 'Weddamulle source' : 'Source unavailable'}
          </small>
        </span>
        <span
          className={`layer-toggle-switch ${imageryVisible ? 'layer-toggle-switch--active' : ''}`}
          aria-hidden="true"
        >
          <span className="layer-toggle-switch__thumb" />
        </span>
      </button>

      {divisionLayers.map((layer) => (
        <button
          className="layer-row"
          type="button"
          key={layer.key}
          onClick={() => onToggleLayer(layer.key)}
          aria-label={`Toggle ${layer.shortLabel}`}
        >
          <span
            className="layer-swatch"
            style={{ borderColor: layer.color, background: layer.fillColor }}
          />
          <span className="layer-copy">
            <strong>{layer.shortLabel}</strong>
            <small>{visibility[layer.key] ? 'Division boundaries · inspectable' : 'Division layer hidden'}</small>
          </span>
          <span
            className={`layer-toggle-switch ${visibility[layer.key] ? 'layer-toggle-switch--active' : ''}`}
            aria-hidden="true"
          >
            <span className="layer-toggle-switch__thumb" />
          </span>
        </button>
      ))}

      <div className="layer-divider" />

      {fieldLayers.map((layer) => (
        <button
          className="layer-row"
          type="button"
          key={layer.key}
          onClick={() => onToggleLayer(layer.key)}
          aria-label={`Toggle ${layer.shortLabel}`}
        >
          <span
            className="layer-swatch"
            style={{ borderColor: layer.color, background: layer.fillColor }}
          />
          <span className="layer-copy">
            <strong>{layer.shortLabel}</strong>
            <small>Field polygons · clickable</small>
          </span>
          <span
            className={`layer-toggle-switch ${visibility[layer.key] ? 'layer-toggle-switch--active' : ''}`}
            aria-hidden="true"
          >
            <span className="layer-toggle-switch__thumb" />
          </span>
        </button>
      ))}
    </section>
  )
}
