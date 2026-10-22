// Run a test to inspect L.VectorGrid prototype and methods
const fs = require('fs');

const code = fs.readFileSync('./node_modules/leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled.js', 'utf8');

// Check what classes exist
const matches = [...code.matchAll(/VectorGrid\.Protobuf\s*=\s*([^;{]+)/g)].map(m => m[0]);
console.log('Protobuf inheritance:', matches);

// Check if redraw exists anywhere in the file
const redrawMatches = [...code.matchAll(/redraw\b[^\n]*/g)].map(m => m[0]);
console.log('redraw matches:', redrawMatches);

// Check setFeatureStyle
const styleMatches = [...code.matchAll(/setFeatureStyle[^\n]*/g)].map(m => m[0]);
console.log('style matches:', styleMatches);
