import fs from 'node:fs/promises'
import path from 'node:path'

const [, , inputArg, outputArg] = process.argv
if (!inputArg || !outputArg) {
  console.error('Usage: node apps/web/scripts/build-twitch-stream-map-city-centroids.mjs <natural-earth-populated-places.geojson> <output.json>')
  process.exit(2)
}

const inputPath = path.resolve(inputArg)
const outputPath = path.resolve(outputArg)
const source = JSON.parse(await fs.readFile(inputPath, 'utf8'))
if (source?.type !== 'FeatureCollection' || !Array.isArray(source.features)) {
  throw new Error('Expected a GeoJSON FeatureCollection')
}

const rows = []
for (const feature of source.features) {
  const properties = feature?.properties ?? {}
  const coordinates = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : null
  const countryCode = clean(properties.iso_a2).toUpperCase()
  const city = clean(properties.nameascii) || clean(properties.name)
  const region = clean(properties.adm1name) || null
  const longitude = number(coordinates?.[0] ?? properties.longitude)
  const latitude = number(coordinates?.[1] ?? properties.latitude)

  if (!/^[A-Z]{2}$/.test(countryCode) || !city || longitude === null || latitude === null) continue
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) continue

  const aliases = unique([
    clean(properties.name),
    clean(properties.nameascii),
    clean(properties.ls_name),
  ]).filter((value) => value && normalize(value) !== normalize(city))

  rows.push({
    countryCode,
    city,
    region,
    longitude,
    latitude,
    aliases,
    sourceId: properties.ne_id ?? null,
  })
}

rows.sort((a, b) =>
  a.countryCode.localeCompare(b.countryCode) ||
  a.city.localeCompare(b.city) ||
  String(a.region ?? '').localeCompare(String(b.region ?? '')) ||
  Number(a.sourceId ?? 0) - Number(b.sourceId ?? 0),
)

const output = {
  schema: 'viewloom-city-centroids-v0.1',
  source: {
    dataset: source.name ?? path.basename(inputPath),
    provider: 'Natural Earth',
    license: 'public-domain',
    homepage: 'https://www.naturalearthdata.com/',
  },
  generatedAt: new Date().toISOString(),
  records: rows,
}

await fs.mkdir(path.dirname(outputPath), { recursive: true })
await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify({ records: rows.length, output: outputPath }))

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalize(value) {
  return clean(value).normalize('NFKC').replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
