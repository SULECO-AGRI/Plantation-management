import { Eye, EyeOff, Image, Layers3, RotateCcw } from 'lucide-react'
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

      <button className="layer-row" type="button" onClick={onToggleImagery}>
        <span className="layer-swatch layer-swatch--imagery"><Image size={14} /></span>
        <span className="layer-copy">
          <strong>VisiGeo imagery</strong>
          <small className={`source-status source-status--${imageryStatus}`}>
            {imageryStatus === 'loading' ? 'Checking tiles' : imageryStatus === 'ready' ? 'Weddamulle source' : 'Source unavailable'}
          </small>
        </span>
        {imageryVisible ? <Eye size={17} /> : <EyeOff size={17} />}
      </button>

      <div className="layer-divider" />

      {fieldLayers.map((layer) => (
        <button
          className="layer-row"
          type="button"
          key={layer.key}
          onClick={() => onToggleLayer(layer.key)}
        >
          <span
            className="layer-swatch"
            style={{ borderColor: layer.color, background: layer.fillColor }}
          />
          <span className="layer-copy">
            <strong>{layer.shortLabel}</strong>
            <small>Field polygons · clickable</small>
          </span>
          {visibility[layer.key] ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
      ))}

      <div className="layer-divider" />

      {divisionLayers.map((layer) => (
        <button
          className="layer-row"
          type="button"
          key={layer.key}
          onClick={() => onToggleLayer(layer.key)}
        >
          <span
            className="layer-swatch"
            style={{ borderColor: layer.color, background: layer.fillColor }}
          />
          <span className="layer-copy">
            <strong>{layer.shortLabel}</strong>
            <small>{visibility[layer.key] ? 'Division boundaries · inspectable' : 'Division layer hidden'}</small>
          </span>
          {visibility[layer.key] ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
      ))}
    </section>
  )
}
