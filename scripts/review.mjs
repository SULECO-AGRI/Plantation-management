import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const sourceRoots = ['src', 'public', 'package.json']
const forbidden = [
  /authcontext/i,
  /loginpage/i,
  /registerpage/i,
  /auth\.service/i,
  /rbac/i,
  /protected\s*route/i,
  /userrole/i,
  /sessionstorage/i,
  /localstorage[^\n]*(token|auth)/i,
  /bearer\s+/i,
  /jwt/i,
  /citizen/i,
  /municipal/i,
  /tax\.service/i,
  /approvals\.service/i,
  /requests\.service/i,
]

function collect(target) {
  const absolute = path.join(root, target)
  if (!fs.existsSync(absolute)) return []
  const stat = fs.statSync(absolute)
  if (stat.isFile()) return [absolute]
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(absolute, entry.name)
    return entry.isDirectory() ? collect(path.relative(root, next)) : [next]
  })
}

const scannedFiles = sourceRoots
  .flatMap(collect)
  .filter((file) => !/\.(geojson|jpg|jpeg|png|webp|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(file))
const forbiddenFindings = []
for (const file of scannedFiles) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(text)) forbiddenFindings.push(`${path.relative(root, file)} matched ${pattern}`)
  }
}

const sourceFiles = collect('src').filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts'))
const brokenImports = []
const importPattern = /from\s+['"](\.[^'"]+)['"]/g
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, 'utf8')
  for (const match of text.matchAll(importPattern)) {
    const base = path.resolve(path.dirname(file), match[1])
    const candidates = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.css`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.tsx'),
    ]
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      brokenImports.push(`${path.relative(root, file)} -> ${match[1]}`)
    }
  }
}

const geoDir = path.join(root, 'public/data')
const geoFiles = fs.readdirSync(geoDir).filter((name) => name.endsWith('.geojson')).sort()
const manifest = JSON.parse(fs.readFileSync(path.join(geoDir, 'data-manifest.json'), 'utf8'))
const manifestGeoFiles = manifest.sources
  .filter((source) => source.type === 'uploaded-geojson')
  .map((source) => source.file)
  .sort()
const geoMatch = JSON.stringify(geoFiles) === JSON.stringify(manifestGeoFiles)

const layerSource = fs.readFileSync(path.join(root, 'src/data/layers.ts'), 'utf8')
const dataUrlMatches = [...layerSource.matchAll(/url:\s*['"]\/data\/([^'"]+)['"]/g)].map((match) => match[1])
const missingDataUrls = dataUrlMatches.filter((name) => !fs.existsSync(path.join(geoDir, name)))

const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const scriptCheck = ['dev', 'build', 'preview', 'review'].every((name) => Boolean(packageJson.scripts?.[name]))

console.log('\nWeddamulle Plantation Management - /review equivalent')
console.log('-----------------------------------------------------')
console.log(`Removed platform-code scan: ${forbiddenFindings.length === 0 ? 'PASS (0 findings)' : 'FAIL'}`)
if (forbiddenFindings.length) forbiddenFindings.forEach((finding) => console.log(`  - ${finding}`))
console.log(`Local import references: ${brokenImports.length === 0 ? 'PASS' : 'FAIL'}`)
if (brokenImports.length) brokenImports.forEach((finding) => console.log(`  - ${finding}`))
console.log(`GeoJSON manifest coverage: ${geoMatch ? 'PASS' : 'FAIL'}`)
console.log(`Layer data URLs: ${missingDataUrls.length === 0 ? 'PASS' : 'FAIL'}`)
if (missingDataUrls.length) missingDataUrls.forEach((name) => console.log(`  - missing public/data/${name}`))
console.log(`Package scripts: ${scriptCheck ? 'PASS' : 'FAIL'}`)
console.log(`Uploaded GeoJSON layers: ${geoFiles.length}`)
console.log(`VisiGeo source: ${manifest.sources.find((source) => source.type === 'visigeo')?.url ?? 'missing'}`)

const failed = forbiddenFindings.length || brokenImports.length || !geoMatch || missingDataUrls.length || !scriptCheck
if (failed) process.exit(1)
console.log('Review result: PASS')
