import assert from 'node:assert/strict'
import fs from 'node:fs'
import { applyStreamMapGeographyMode } from '../apps/web/src/features/twitch-stream-map/geography-mode-core.mjs'

const fixture = JSON.parse(fs.readFileSync('apps/web/fixtures/twitch-stream-map-city-ui-request-fixture.json', 'utf8'))
assert.equal(applyStreamMapGeographyMode(fixture.country.input, fixture.country.mode), fixture.country.expected)
assert.equal(applyStreamMapGeographyMode(fixture.city.input, fixture.city.mode), fixture.city.expected)
assert.equal(fixture.current.publiclySelectable, false)
console.log(JSON.stringify({ ok: true, countryDefault: true, cityExplicit: true, currentSelectable: false }, null, 2))
