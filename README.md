# Weddamulle Plantation Management

A brand-new lightweight React + Leaflet plantation GIS viewer built from the supplied urban-platform source logic, the uploaded Weddamulle GeoJSON archive, and the supplied Weddemulle VisiGeo source.

## Scope

- Landing page with a direct **Explore Estate Map** CTA.
- Interactive map page focused on the uploaded Weddamulle estate geometry.
- 5 division polygons and 218 field polygons loaded from the supplied GeoJSON files.
- VisiGeo RGB imagery layer using the same Leaflet tile mechanism found in the supplied reference source.
- Click any division or field to inspect all available source attributes.
- Search features by division name, field number, object ID, or any other uploaded property value.
- Layer toggles for imagery, divisions, and each field group.
- No backend, login, signup, sessions, users, roles, RBAC, citizen portal, requests, tax, approvals, or municipal administration code.

## Run

```bash
npm install
npm run dev
```

Open the local Vite URL (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Review / zero-auth verification

The requested `/review` check is represented as a deterministic local review script:

```bash
npm run review
```

It fails if known auth/RBAC/urban-platform terms are found in the new source tree, or if the GeoJSON source manifest does not cover every shipped GeoJSON file.

## Data origin verification

All estate feature values shown in the application come from these uploaded files copied unchanged into `public/data/`:

- `Division.geojson` — 5 features
- `Ramboda_Fields.geojson` — 42 features
- `Wewandon_Fileds.geojson` — 26 features
- `Lilliesland_Fields.geojson` — 28 features
- `Camnethan_Fields.geojson` — 58 features
- `Weddamulla_Fields.geojson` — 64 features

Total: **223 features = 5 divisions + 218 fields**.

The imagery source is the supplied VisiGeo estate endpoint:

- `https://weddemulle-estate.visigeo.com/`
- Tile pattern reused from the reference project's VisiGeo mechanism: `/rgb/{z}/{x}/{y}.png`

No OSM or other third-party basemap is loaded, so the spatial presentation remains restricted to the uploaded estate layers and the supplied VisiGeo source.

## Attribute behavior

The detail panel does not manufacture missing attributes. For example:

- Division polygons expose `Name`, `Area`, `Total_area`, `Div_Pct`, `Tea_ac`, `Veg_ac`, `Grass_ac`, `HighVeg_ac`, `Dev_ac`, and geometry metrics when present.
- Field polygons expose `Division`, `Field_No`, `Shape_Length`, `Shape_Area`, and IDs.
- Field `Shape_Area` values are treated as square metres and displayed additionally as hectares/acres.
- Division `Area` and `*_ac` values are treated as acres because the uploaded schema explicitly names acreage fields and the values align with the area breakdown.
- Soil, rainfall, elevation, and field-level crop type are not shown unless present in a future uploaded dataset.

## Architecture

```text
src/
├─ components/
│  ├─ PlantationMap.tsx        # Leaflet map container + GIS loading + selection/search
│  ├─ LayerController.tsx      # layer visibility and imagery controls
│  └─ FeatureDetailPanel.tsx   # source-driven feature inspection panel
├─ data/
│  └─ layers.ts                # Weddamulle layer catalog + VisiGeo source config
├─ lib/
│  └─ geo.ts                   # typed GIS parsing/formatting helpers
├─ pages/
│  ├─ LandingPage.tsx
│  └─ EstateMapPage.tsx
└─ types/
   └─ gis.ts                   # strong source-property and feature types
```

## VisiGeo configuration

The default source is already set. If the imagery host changes later:

```bash
cp .env.example .env
```

Then update `VITE_VISIGEO_ROOT`.

## Division → field inspection workflow

The map uses a deliberate two-level interaction model:

1. **Divisions ON** — the division layer is rendered above the field polygons. Clicking the map selects the division and opens its popup/details.
2. **Divisions OFF** — the division layer is removed, exposing the field polygons underneath. Clicking a field then opens that field's popup/details.

The **Divisions** control remains at the bottom of the layer list for clarity, even though its Leaflet pane has a higher z-index while enabled. Field layers can remain visible underneath at all times.
