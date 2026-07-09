import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'docs/audits/phase12-release-acceptance.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase12-release-acceptance-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12C-3 production closeout')
assert.equal(evidence.status, 'complete')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.expectedMainSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(evidence.deployedSha, evidence.expectedMainSha)
assert.deepEqual(evidence.deployment, {
  environment: 'production',
  branch: 'main',
  matchesExpected: true,
})
assert.equal(evidence.candidateEvidence.status, 'candidate_pass')
assert.equal(evidence.candidateEvidence.browserScenarios, 100)
assert.equal(evidence.candidateEvidence.browserViolations, 0)
assert.deepEqual(evidence.counts, {
  htmlRoutes: 25,
  statusApis: 2,
  sitemapRoutes: 21,
  launchAssets: 6,
  blockingAlerts: 0,
  watchAlerts: evidence.counts.watchAlerts,
})
assert.equal(Number.isInteger(evidence.counts.watchAlerts), true)
assert.equal(evidence.routes.length, 25)
for (const route of evidence.routes) {
  assert.equal(route.status, 200, `${route.route}: HTTP status`)
  assert.equal(route.hasViewLoom, true, `${route.route}: ownership`)
  assert.equal(route.canonicalMatches, true, `${route.route}: canonical`)
}
assert.deepEqual(evidence.support, {
  routeStatus: 200,
  paymentLinkPresent: true,
  refundPolicyLinkPresent: true,
  commercialDisclosureLinkPresent: true,
  contactLinkPresent: true,
})
assert.equal(evidence.providers.twitch.httpStatus, 200)
assert.equal(evidence.providers.twitch.platform, 'twitch')
assert.equal(evidence.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(evidence.providers.twitch.sourceMode, 'real')
assert.equal(evidence.providers.twitch.collectorState, 'ok')
assert.equal(evidence.providers.twitch.isStale, false)
assert.equal(evidence.providers.kick.httpStatus, 200)
assert.equal(evidence.providers.kick.platform, 'kick')
assert.equal(evidence.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(evidence.providers.kick.sourceMode, 'authenticated')
assert.equal(evidence.providers.kick.collectorState, 'snapshot_available')
assert.equal(evidence.providers.kick.isFresh, true)
assert.equal(evidence.providers.kick.isStale, false)
assert.equal(evidence.sitemap.status, 200)
assert.equal(evidence.sitemap.routes, 21)
assert.equal(evidence.launchAssets.length, 6)
for (const asset of evidence.launchAssets) {
  assert.equal(asset.status, 200, `${asset.id}: HTTP status`)
  assert.equal(asset.hashMatches, true, `${asset.id}: hash mismatch`)
  assert.equal(asset.sizeMatches, true, `${asset.id}: size mismatch`)
}
assert.deepEqual(evidence.notFound, {
  explicitStatus: 404,
  explicitMarkerPresent: true,
  previewProbeStatus: 404,
  previewProbeMarkerPresent: true,
})
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.nextWorkstream, 'Phase 12A Analytics Capture Foundation')

console.log('Phase 12 release acceptance verification passed.')
console.log('- exact merged main SHA matches production deployment')
console.log('- 25 HTML routes, 2 provider status APIs, and 21 sitemap URLs accepted')
console.log('- Support payment/legal link contract accepted')
console.log('- Twitch/Kick storage bindings and freshness accepted separately')
console.log('- all 6 repo-owned launch assets match production hashes and sizes')
console.log('- explicit 404 and preview-probe absence accepted')
console.log('- blocking alerts: 0')
console.log('- Phase 12A Analytics Capture Foundation is next')
