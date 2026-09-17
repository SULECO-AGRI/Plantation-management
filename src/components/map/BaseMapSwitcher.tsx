type Props = {
  isSatelliteActive: boolean
  onToggleSatellite: () => void
  isRgbActive: boolean
  onToggleRgb: () => void
}

export function BaseMapSwitcher({
  isSatelliteActive,
  onToggleSatellite,
  isRgbActive,
  onToggleRgb,
}: Props) {
  return (
    <aside
      className="basemap-floating-switcher"
      aria-label="Base map and imagery toggles"
    >
      <div className="basemap-floating-switcher__cards" role="toolbar" aria-label="Map imagery toggles">
        <button
          type="button"
          role="switch"
          aria-checked={isSatelliteActive}
          className={`basemap-pill-card ${isSatelliteActive ? 'basemap-pill-card--active' : ''}`}
          onClick={onToggleSatellite}
          title={isSatelliteActive ? 'Click to switch to Street Map' : 'Click to enable Google Satellite'}
        >
          <span className="basemap-pill-card__label">Satellite</span>
          <span className={`basemap-pill-dot ${isSatelliteActive ? 'basemap-pill-dot--selected' : ''}`} />
        </button>

        <button
          type="button"
          role="switch"
          aria-checked={isRgbActive}
          className={`basemap-pill-card ${isRgbActive ? 'basemap-pill-card--active' : ''}`}
          onClick={onToggleRgb}
          title={isRgbActive ? 'Click to hide RGB Ortho imagery' : 'Click to enable RGB Ortho imagery'}
        >
          <span className="basemap-pill-card__label">RGB Ortho</span>
          <span className={`basemap-pill-dot ${isRgbActive ? 'basemap-pill-dot--selected' : ''}`} />
        </button>
      </div>
    </aside>
  )
}
