#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const page = readFileSync('twitch/map/index.html', 'utf8')
const entry = readFileSync('src/features/twitch-stream-map/stream-map-entry.ts', 'utf8')

assert.equal(pkg.dependencies?.['maplibre-gl'], '6.4.1')
assert.ok(entry.includes("import maplibregl from 'maplibre-gl'"))
assert.ok(entry.includes("import 'maplibre-gl/dist/maplibre-gl.css'"))
assert.ok(entry.includes('window.maplibregl = maplibregl as unknown as MapLibreNamespace'))
assert.ok(entry.includes("style: 'https://tiles.openfreemap.org/styles/dark'"))
assert.equal(page.includes('unpkg.com/maplibre-gl'), false)
assert.equal(page.includes('maplibre-gl.js'), false)
assert.equal(page.includes('maplibre-gl.css'), false)
assert.ok(page.includes('src="/src/features/twitch-stream-map/stream-map-entry.ts"'))

console.log(JSON.stringify({
  ok: true,
  rendererBundled: true,
  rendererVersion: pkg.dependencies['maplibre-gl'],
  externalRendererCdnRemoved: true,
  mapEntryRetained: true,
  basemapStyleRetained: true,
}, null, 2))
