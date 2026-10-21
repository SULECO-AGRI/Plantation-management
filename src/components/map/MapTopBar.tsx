import { Crosshair, Search, X } from 'lucide-react'
import type { SearchHit } from '../../types/gis'
import type { Worker } from '../../types/workforce'
import { useTranslation } from '../../context/LanguageContext'

type Props = {
  query: string
  onQueryChange: (q: string) => void
  onClearQuery: () => void
  searchHits: SearchHit[]
  onSelectHit: (hit: SearchHit) => void
  onResetView: () => void
  locatedWorker?: Worker | null
  onClearLocatedWorker?: () => void
  onFocusLocatedWorker?: () => void
  estateLabel?: string
  placeholder?: string
  style?: React.CSSProperties
}

export function MapTopBar({
  query,
  onQueryChange,
  onClearQuery,
  searchHits,
  onSelectHit,
  onResetView,
  locatedWorker,
  onClearLocatedWorker,
  onFocusLocatedWorker,
  estateLabel,
  placeholder,
  style,
}: Props) {
  const { t } = useTranslation()
  const displayPlaceholder = placeholder || t('map.searchPlaceholder')
  const displayEstateLabel = estateLabel || t('map.estateLabel')

  return (
    <div className="map-topbar" style={style}>
      <div className="map-search-wrap">
        <Search size={17} />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={displayPlaceholder}
          aria-label={t('map.searchAria')}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            onClick={onClearQuery}
            aria-label={t('map.clearSearch')}
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
              <p>{t('map.noFeatures')}</p>
            )}
          </div>
        )}
      </div>

      <button className="estate-chip" type="button" onClick={onResetView}>
        <Crosshair size={15} /> {displayEstateLabel}
      </button>

      {locatedWorker && (
        <div className="located-worker-chip">
          <span className="located-worker-chip__dot" />
          <span
            className="located-worker-chip__name"
            onClick={onFocusLocatedWorker}
            style={{ cursor: onFocusLocatedWorker ? 'pointer' : 'default' }}
            title={t('map.refocusPinpoint')}
          >
            {t('map.pin')}: {locatedWorker.name}
          </span>
          <button
            type="button"
            className="located-worker-chip__close"
            onClick={onClearLocatedWorker}
            title={t('map.clearPinpoint')}
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

