import { Crosshair, Layers, Search, Sprout, X } from 'lucide-react'
import type { SearchHit } from '../../types/gis'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onClearQuery: () => void
  searchHits: SearchHit[]
  onSelectHit: (hit: SearchHit) => void
  onResetView: () => void
  mode: 'division' | 'field'
  onModeChange: (mode: 'division' | 'field') => void
}

export function MapTopBar({
  query,
  onQueryChange,
  onClearQuery,
  searchHits,
  onSelectHit,
  onResetView,
  mode,
  onModeChange,
}: Props) {
  return (
    <div className="map-topbar">
      <div className="mode-switcher" role="radiogroup" aria-label="Inspection Mode">
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'field'}
          className={`mode-btn ${mode === 'field' ? 'mode-btn--active-field' : ''}`}
          onClick={() => onModeChange('field')}
          title="Inspect Individual Field Polygons"
        >
          <Sprout size={14} /> Field Mode
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'division'}
          className={`mode-btn ${mode === 'division' ? 'mode-btn--active-division' : ''}`}
          onClick={() => onModeChange('division')}
          title="Inspect Division Boundaries and Summary"
        >
          <Layers size={14} /> Division Mode
        </button>
      </div>

      <div className="map-search-wrap">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search division, field number or attribute"
          aria-label="Search estate features"
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={onClearQuery}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        {query && (
          <div className="search-results">
            {searchHits.length > 0 ? (
              searchHits.map((hit) => (
                <button key={hit.id} type="button" onClick={() => onSelectHit(hit)}>
                  <strong>{hit.label}</strong>
                  <span>{hit.subtitle}</span>
                </button>
              ))
            ) : (
              <p>No matching uploaded estate feature.</p>
            )}
          </div>
        )}
      </div>

      <button className="estate-chip" type="button" onClick={onResetView}>
        <Crosshair size={15} /> Weddamulle Estate
      </button>
    </div>
  )
}

