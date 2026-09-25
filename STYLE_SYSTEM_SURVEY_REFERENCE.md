# Agalawatta Survey-Sheet Map Style System

This visual system is based on the uploaded `Agalawatta_Plantaion_A2.pdf` survey-map reference. The reskin changes appearance only: no event listeners, state, layer ordering, coordinates, GeoJSON feeds, API calls, zoom/pan logic, draw behavior, or feature-selection logic were removed or replaced.

## 1. Basemap theme

- Theme: light, warm, printed topographic/cartographic sheet.
- Default OSM treatment: reduced saturation, modest grayscale, a small warm/sepia bias, slightly raised brightness, softened contrast.
- Satellite and RGB orthophoto imagery are not filtered.
- Map canvas / outside-map green: `#D4E1C5`.
- Paper background: `#F7F5EE`.
- Soft paper surface: `#FBFAF4`.
- Muted paper surface: `#EFEEE8`.

## 2. Core cartographic palette

| Token | Hex | Use |
|---|---|---|
| Survey ink | `#333430` | Major outlines, headers, title-block lines |
| Field boundary | `#3A3A36` | Fine agricultural parcel outlines |
| Survey plum | `#6C004B` | Buildings, selected features, drawn annotations |
| Division boundary | `#6E716B` | Division outlines |
| Division neutral fill | `#F1F0EB` | Division base wash |
| Road brown | `#B86B3E` | Roads / edit highlight |
| Stream cyan | `#7EB9C4` | Hydrology |
| Contour index | `#C18A5A` | Strong contour tone |
| Contour minor | `#DBC9A9` | Fine contour tone |

## 3. Division fills

| Division | Hex |
|---|---|
| Weddamulla | `#F0D090` |
| Ramboda | `#C0BFB3` |
| Camnethan | `#F0D8D8` |
| Lilliesland | `#E8D8F0` |
| Wewandon | `#E0F0C0` |

## 4. Land-use fills

| Class | Hex |
|---|---|
| Tea cultivation | `#B04818` |
| Shrubs / scrub | `#E8A018` |
| High vegetation / forest | `#408018` |
| Vegetable cultivation | `#80B018` |
| Developed / built-up | `#6C004B` |

## 5. Typography

- Cartographic labels, panel titles, feature names: `"Times New Roman", Times, Georgia, serif`.
- UI microcopy, controls, metadata, category headings: `Arial, Helvetica, sans-serif`.
- Division labels: uppercase serif, restrained tracking, subtle warm-paper halo.
- Field labels: serif, high-contrast dark ink with a small warm-paper halo.
- No new font download is required for the map reskin.

## 6. Surfaces and elevation

- Main floating cards: `#FBFAF4` / `#F7F5EE` with 1 px `#B7B8B0` border.
- Secondary separators: `#D9D8D0`.
- Corner radius: primarily `2-3px`, matching technical drawing / title-block geometry.
- Standard shadow: `0 3px 12px rgba(51, 52, 48, 0.16)`.
- Strong floating shadow: `0 6px 18px rgba(51, 52, 48, 0.20)`.
- Glass blur and large rounded-pill styling are removed from the map UI.

## 7. Map controls and overlays

- Search: 40 px high paper field with 1 px technical border and 2 px radius.
- Layer panel: flat paper legend with square swatches and compact rectangular toggle indicators.
- Zoom and draw buttons: 30-32 px square technical controls, 1 px borders, minimal rounding.
- Basemap selector: compact title-block tab treatment.
- Popups/tooltips: warm paper, dark ink, 1 px outline, small shadow; no dark glass effect.
- Detail drawer: styled as a survey schedule/title block with serif feature heading and table-like cells.
- Drawn geometry: survey plum (`#6C004B`); edit highlight: road brown (`#B86B3E`).

## 8. External assets

No new external assets are required. Existing Lucide icons, Leaflet, OSM, Google Satellite, and VisiGeo sources are preserved exactly. The existing Google Fonts import used elsewhere in the site remains untouched, but the map reskin itself relies on system serif/sans fonts.

## 9. Modified source files

- `src/styles.css`
- `src/data/layers.ts`
- `src/components/map/PlantationMap.tsx`
- `src/components/map/draw/MapDrawToolbar.tsx`

## 10. Verification

- TypeScript project check completed successfully with `tsc -b`.
- CSS parsed successfully with PostCSS.
- Vite bundling could not be completed in this sandbox because the uploaded Windows-oriented `node_modules` archive does not contain Rollup's Linux native optional package (`@rollup/rollup-linux-x64-gnu`). This is an environment dependency issue, not a TypeScript/CSS error. Running a clean `npm install` on the target machine will restore the platform-specific optional package before `npm run build`.
