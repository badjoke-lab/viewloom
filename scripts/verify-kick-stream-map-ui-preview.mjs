import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { buildKickStreamMapPreviewModel } from '../apps/web/src/features/kick-stream-map/preview-model.mjs'

function payload(overrides = {}) {
  return {
    provider: 'kick',
    geographyMode: 'country',
    state: 'blocked_stable_identity',
    publicActivationAuthorized: false,
    updatedAt: '2026-09-06T00:00:00Z',
    coverage: {
      observedStreams: 100,
      observedViewers: 123456,
      stableIdentityStreams: 0,
      mappedStreams: 7,
      mappedViewers: 7777,
      mappedCountryCount: 4,
      unmappedStreams: 100,
      unmappedViewers: 123456,
      unmappedReasons: { stable_identity_unavailable: 100 },
    },
    identity: {
      stableKey: 'broadcaster_user_id',
      stableIdentityCoverageState: 'unavailable',
      stableIdentityStreams: 0,
      missingStableIdentityStreams: 100,
      slugIsStableIdentity: false,
      loginDisplayMetadataOnly: true,
    },
    activation: {
      publicCountryActivationReady: false,
      blockers: [
        'production_livestream_snapshot_missing_broadcaster_user_id',
        'public_country_activation_not_authorized',
      ],
    },
    ...overrides,
  }
}

const blocked = buildKickStreamMapPreviewModel(payload())
assert.equal(blocked.previewOnly, true)
assert.equal(blocked.canRenderCountryGeography, false)
assert.equal(blocked.coverage.mappedStreams, 0, 'blocked preview must suppress staged mapped counts')
assert.equal(blocked.coverage.mappedViewers, 0, 'blocked preview must suppress staged mapped viewers')
assert.equal(blocked.coverage.mappedCountryCount, 0, 'blocked preview must suppress staged country counts')
assert.equal(blocked.stableIdentityContractValid, true)

const readinessWithoutAuthorization = buildKickStreamMapPreviewModel(payload({
  activation: { publicCountryActivationReady: true, blockers: [] },
}))
assert.equal(readinessWithoutAuthorization.canRenderCountryGeography, false)
assert.ok(readinessWithoutAuthorization.blockers.includes('public_country_activation_not_authorized'))

const authorizationWithoutReadiness = buildKickStreamMapPreviewModel(payload({
  publicActivationAuthorized: true,
  activation: { publicCountryActivationReady: false, blockers: ['reviewed_kick_country_evidence_runtime_not_connected'] },
}))
assert.equal(authorizationWithoutReadiness.canRenderCountryGeography, false)

const fullyGated = buildKickStreamMapPreviewModel(payload({
  publicActivationAuthorized: true,
  activation: { publicCountryActivationReady: true, blockers: [] },
}))
assert.equal(fullyGated.canRenderCountryGeography, true)
assert.equal(fullyGated.coverage.mappedStreams, 7)
assert.equal(fullyGated.coverage.mappedCountryCount, 4)

const invalidIdentity = buildKickStreamMapPreviewModel(payload({
  identity: {
    stableKey: 'slug',
    missingStableIdentityStreams: 0,
    slugIsStableIdentity: true,
    loginDisplayMetadataOnly: false,
  },
}))
assert.equal(invalidIdentity.stableIdentityContractValid, false)
assert.ok(invalidIdentity.blockers.includes('invalid_stable_identity_contract'))

assert.throws(() => buildKickStreamMapPreviewModel({ provider: 'twitch', geographyMode: 'country' }), /provider=kick/)
assert.throws(() => buildKickStreamMapPreviewModel({ provider: 'kick', geographyMode: 'city' }), /Country only/)

const viteConfig = readFileSync('apps/web/vite.config.ts', 'utf8')
assert.equal(viteConfig.includes("kick/map/index.html"), false, 'Kick Map must not enter the production Vite input in UI-P1')
assert.equal(existsSync('apps/web/kick/map/index.html'), false, 'UI-P1 must not create the public /kick/map/ page')

const previewHtml = readFileSync('apps/web/preview/kick-stream-map/index.html', 'utf8')
assert.ok(previewHtml.includes('PREVIEW ONLY'))
assert.ok(previewHtml.includes('noindex,nofollow'))
assert.equal(previewHtml.includes('rel="canonical"'), false, 'preview must not claim a public canonical route')
assert.equal(previewHtml.includes('href="/kick/map/"'), false, 'preview must not add a public Kick Map navigation target')
assert.ok(previewHtml.includes('/api/kick-stream-map'), 'copy must name the real staged API contract')

console.log(JSON.stringify({
  ok: true,
  previewOnly: true,
  publicRouteCreated: false,
  productionViteInputChanged: false,
  blockedGeographySuppressed: true,
  dualGateRequired: true,
  stableIdentity: 'broadcaster_user_id',
}, null, 2))
