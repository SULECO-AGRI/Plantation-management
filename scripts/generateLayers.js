import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const divisionGeo = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/Division.geojson'), 'utf8'));

// 1. Outer Boundary (MultiPolygon of all divisions or convex/concave union hull)
const outerBoundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "estate-outer-boundary",
      properties: {
        Name: "Weddamulle Estate Outer Boundary",
        Estate: "Weddamulle",
        Total_Acres: 2024,
        Divisions_Count: 5,
        Elevation_Range: "1050m - 1480m",
        Shape_Length: 22450.5,
        Shape_Area: 8185641.5
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: divisionGeo.features.map(f => f.geometry.coordinates)
      }
    }
  ]
};
fs.writeFileSync(path.join(__dirname, '../public/data/Outer_Boundary.geojson'), JSON.stringify(outerBoundary, null, 2));

// 2. Roads GeoJSON
const roads = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "road-1",
      properties: {
        Name: "Main Estate Access Road (B393 Connector)",
        Road_Type: "Paved Primary",
        Surface: "Tarred / Bitumen",
        Width_M: 5.5,
        Length_Km: 4.8
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.685, 7.045], [80.692, 7.048], [80.701, 7.051],
          [80.709, 7.054], [80.716, 7.058], [80.724, 7.062], [80.732, 7.068]
        ]
      }
    },
    {
      type: "Feature",
      id: "road-2",
      properties: {
        Name: "Weddamulla - Ramboda Spine Route",
        Road_Type: "Estate Secondary",
        Surface: "Gravel / Concrete Track",
        Width_M: 4.0,
        Length_Km: 3.2
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.705, 7.042], [80.708, 7.049], [80.712, 7.053],
          [80.715, 7.059], [80.719, 7.066], [80.722, 7.072]
        ]
      }
    },
    {
      type: "Feature",
      id: "road-3",
      properties: {
        Name: "Camnethan - Lilliesland Harvesting Track",
        Road_Type: "Agricultural Track",
        Surface: "Compacted Earth / Stone",
        Width_M: 3.2,
        Length_Km: 2.6
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.690, 7.055], [80.698, 7.058], [80.704, 7.060],
          [80.710, 7.063], [80.717, 7.067]
        ]
      }
    },
    {
      type: "Feature",
      id: "road-4",
      properties: {
        Name: "Wewandon Ridge Access Path",
        Road_Type: "Field Tractor Route",
        Surface: "Gravel",
        Width_M: 3.0,
        Length_Km: 2.1
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.718, 7.045], [80.723, 7.049], [80.727, 7.054],
          [80.731, 7.060], [80.735, 7.065]
        ]
      }
    }
  ]
};
fs.writeFileSync(path.join(__dirname, '../public/data/Roads.geojson'), JSON.stringify(roads, null, 2));

// 3. Streams GeoJSON
const streams = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "stream-1",
      properties: {
        Name: "Weddamulle Oya (Main Stream)",
        Order: "Primary Catchment",
        Flow: "Perennial",
        Catchment_Ha: 340,
        Length_Km: 5.4
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.734, 7.073], [80.728, 7.067], [80.721, 7.061],
          [80.714, 7.055], [80.707, 7.049], [80.699, 7.044], [80.686, 7.041]
        ]
      }
    },
    {
      type: "Feature",
      id: "stream-2",
      properties: {
        Name: "Ramboda Tributary North",
        Order: "Secondary Stream",
        Flow: "Perennial",
        Catchment_Ha: 120,
        Length_Km: 2.8
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.726, 7.076], [80.722, 7.070], [80.718, 7.063], [80.714, 7.055]
        ]
      }
    },
    {
      type: "Feature",
      id: "stream-3",
      properties: {
        Name: "Lilliesland Valley Drainage Branch",
        Order: "Drainage Channel",
        Flow: "Seasonal / High Rainfall",
        Catchment_Ha: 75,
        Length_Km: 2.1
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.695, 7.066], [80.700, 7.060], [80.704, 7.054], [80.707, 7.049]
        ]
      }
    }
  ]
};
fs.writeFileSync(path.join(__dirname, '../public/data/Streams.geojson'), JSON.stringify(streams, null, 2));

// 4. Buildings GeoJSON
const buildings = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "bldg-1",
      properties: {
        Name: "Weddamulle Central Tea Factory",
        Category: "Industrial / Processing",
        Area_SqM: 3200,
        Floors: 3,
        Status: "Operational"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.7118, 7.0535], [80.7126, 7.0535],
          [80.7126, 7.0528], [80.7118, 7.0528],
          [80.7118, 7.0535]
        ]]
      }
    },
    {
      type: "Feature",
      id: "bldg-2",
      properties: {
        Name: "Estate Administration Office & Weighbridge",
        Category: "Administrative",
        Area_SqM: 850,
        Floors: 2,
        Status: "Operational"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.7128, 7.0538], [80.7134, 7.0538],
          [80.7134, 7.0532], [80.7128, 7.0532],
          [80.7128, 7.0538]
        ]]
      }
    },
    {
      type: "Feature",
      id: "bldg-3",
      properties: {
        Name: "Senior Superintendent Residence & Bungalow",
        Category: "Residential / Executive",
        Area_SqM: 650,
        Floors: 2,
        Status: "Occupied"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.7085, 7.0565], [80.7092, 7.0565],
          [80.7092, 7.0558], [80.7085, 7.0558],
          [80.7085, 7.0565]
        ]]
      }
    },
    {
      type: "Feature",
      id: "bldg-4",
      properties: {
        Name: "Ramboda Division Muster Shed & Green Leaf Hub",
        Category: "Field Facility",
        Area_SqM: 420,
        Floors: 1,
        Status: "Operational"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.7192, 7.0612], [80.7198, 7.0612],
          [80.7198, 7.0606], [80.7192, 7.0606],
          [80.7192, 7.0612]
        ]]
      }
    },
    {
      type: "Feature",
      id: "bldg-5",
      properties: {
        Name: "Lilliesland Division Leaf Collection Shed",
        Category: "Field Facility",
        Area_SqM: 380,
        Floors: 1,
        Status: "Operational"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.6975, 7.0592], [80.6981, 7.0592],
          [80.6981, 7.0586], [80.6975, 7.0586],
          [80.6975, 7.0592]
        ]]
      }
    },
    {
      type: "Feature",
      id: "bldg-6",
      properties: {
        Name: "Fertilizer & Agricultural Stores Complex",
        Category: "Storage / Agronomy",
        Area_SqM: 1100,
        Floors: 1,
        Status: "Active"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [80.7138, 7.0526], [80.7145, 7.0526],
          [80.7145, 7.0519], [80.7138, 7.0519],
          [80.7138, 7.0526]
        ]]
      }
    }
  ]
};
fs.writeFileSync(path.join(__dirname, '../public/data/Buildings.geojson'), JSON.stringify(buildings, null, 2));
console.log('Successfully generated Outer_Boundary, Roads, Streams, and Buildings geojson datasets.');
