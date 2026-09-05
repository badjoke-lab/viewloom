import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildKickCountryPreviewModel } from '../apps/web/src/features/kick-stream-map/country-preview-model.mjs'
import { kickMapKui3aScenarios } from '../apps/web/src/features/kick-stream-map/kui3a-fixtures.mjs'
import { buildKickStreamMapPreviewModel } from '../apps/web/src/features/kick-stream-map/preview-model.mjs'

assert.equal(kickMapKui3aScenarios.length, 5)
assert.deepEqual(kickMapKui3aScenarios.map((scenario) => scenario.id), [
  'blocked-stable-identity',
  'ready-mixed',
  'ready-empty',
  'unsafe-contract',
  'api-error',
])

for (const scenario of kickMapKui3aScenarios) {
  if (scenario.httpStatus !== 200) continue

  const preview = buildKickStreamMapPreviewModel(scenario.payload)
  const country = buildKickCountryPreviewModel(scenario.payload, {
    allowGeography: preview.canRenderCountryGeography,
  })

  assert.equal(preview.provider, 'kick', `${scenario.id}: provider`)
  assert.equal(preview.geographyMode, 'country', `${scenario.id}: geography mode`)
  assert.equal(country.semantics.creatorCoordinatesUsed, false, `${scenario.id}: creator coordinates`)
  assert.equal(country.semantics.twitchEvidenceReused, false, `${scenario.id}: Twitch evidence reuse`)
  assert.equal(country.semantics.cityInferred, false, `${scenario.id}: City inference`)
  assert.equal(country.semantics.currentLocationPromoted, false, `${scenario.id}: Current promotion`)

  for (const stream of scenario.payload.mappedStreams ?? []) {
    assert.equal(stream.provider, 'kick', `${scenario.id}: mapped provider`)
    const serialized = JSON.stringify(stream)
    for (const forbidden of ['"lat"', '"lng"', '"latitude"', '"longitude"', '"coordinates"']) {
      assert.equal(serialized.includes(forbidden), false, `${scenario.id}: mapped stream must omit ${forbidden}`)
    }
  }

  if (scenario.id === 'blocked-stable-identity') {
    assert.equal(preview.canRenderCountryGeography, false)
    assert.equal(preview.coverage.mappedStreams, 0)
    assert.equal(country.countryRows.length, 0)
    assert.equal(country.mappedStreams.length, 0)
  }

  if (scenario.id === 'ready-mixed') {
    assert.equal(preview.canRenderCountryGeography, true)
    assert.equal(country.contractSafe, true)
    assert.deepEqual(country.countryRows, [
      { countryCode: 'US', streams: 2, viewers: 2000 },
      { countryCode: 'JP', streams: 1, viewers: 600 },
    ])
    assert.equal(country.mappedStreams.length, 3)
    assert.equal(country.accounting.unmappedStreams, 1)
    assert.equal(country.accounting.excludedStreams, 1)
    assert.equal(country.accounting.conflictStreams, 1)
    assert.equal(country.accounting.reconciliationPasses, true)
  }

  if (scenario.id === 'ready-empty') {
    assert.equal(preview.canRenderCountryGeography, true)
    assert.equal(country.contractSafe, true)
    assert.equal(country.countryRows.length, 0)
    assert.equal(country.mappedStreams.length, 0)
  }

  if (scenario.id === 'unsafe-contract') {
    assert.equal(preview.canRenderCountryGeography, true)
    assert.equal(country.contractSafe, false)
    assert.equal(country.countryRows.length, 0)
    assert.equal(country.mappedStreams.length, 0)
  }
}

const entry = readFileSync('apps/web/src/features/kick-stream-map/preview-entry.ts', 'utf8')
for (const fragment of [
  'country_contract_blocked',
  'Country response contract is unsafe',
  'country_empty',
  'No reviewed Country rows to render',
  'Preview data unavailable',
]) {
  assert.ok(entry.includes(fragment), `preview entry missing explicit state: ${fragment}`)
}

const html = readFileSync('apps/web/preview/kick-stream-map/index.html', 'utf8')
assert.ok(html.includes('noindex,nofollow'))
assert.equal(html.includes('rel="canonical"'), false)
assert.equal(html.includes('href="/kick/map/"'), false)

const css = readFileSync('apps/web/src/features/kick-stream-map/preview.css', 'utf8')
assert.ok(css.includes('min-height: 44px'), 'KUI3a controls must retain 44px minimum target treatment')
assert.ok(css.includes(':focus-visible'), 'KUI3a controls must retain explicit focus-visible treatment')

console.log(JSON.stringify({
  ok: true,
  scenarios: kickMapKui3aScenarios.length,
  browserStatesPrepared: ['blocked', 'ready-mixed', 'ready-empty', 'unsafe-contract', 'api-error'],
  creatorCoordinates: false,
  twitchEvidenceReuse: false,
  publicRouteCreated: false,
}, null, 2))
