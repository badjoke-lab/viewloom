import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const auditPath = 'docs/audits/kick-stream-map-k4-preactivation-readiness-2026-09-06.json'
const audit = json(auditPath)
const adapterSource = read('apps/web/functions/api/kick-stream-map-public-adapter-core.mjs')
const runtimeSource = read('apps/web/functions/api/kick-stream-map-country-runtime-core.mjs')
const readinessSource = read('scripts/verify-kick-stream-map-country-public-readiness.mjs')
const viteSource = read('apps/web/vite.config.ts')

assert.equal(audit.schemaVersion, 'viewloom-kick-stream-map-k4-preactivation-readiness-v0.1')
assert.equal(audit.status, 'prerequisites_complete_activation_not_authorized')
assert.equal(audit.provider, 'kick')
assert.equal(audit.geography, 'country')
assert.equal(audit.auditedMain, 'a1e37d6aff3e6929b4d30d0d525061d71f038ff4')

assert.equal(audit.prerequisites.k2.status, 'complete')
assert.equal(audit.prerequisites.k2.pullRequest, 1249)
assert.equal(audit.prerequisites.k2.productionProofRun, 34008795931)
assert.equal(audit.prerequisites.k2.observedStreams, 100)
assert.equal(audit.prerequisites.k2.stableIdentityStreams, 100)
assert.equal(audit.prerequisites.k2.missingStableIdentityStreams, 0)

assert.equal(audit.prerequisites.k3.status, 'complete')
assert.equal(audit.prerequisites.k3.pullRequest, 1252)
assert.equal(audit.prerequisites.k3.mergeSha, '0e7b6b0682df21864551b6d47d9520209f42829f')
assert.equal(audit.prerequisites.k3.deployWebPagesRun, 34010236812)
assert.equal(audit.prerequisites.k3.countryReadinessRun, 34010236815)
assert.equal(audit.prerequisites.k3.productionApiSmokeRun, 34010236817)

assert.equal(audit.prerequisites.kui3b.status, 'complete')
assert.equal(audit.prerequisites.kui3b.pullRequest, 1253)
assert.equal(audit.prerequisites.kui3b.mergeSha, 'bea33532001989c71dde289e570752985d34f600')
assert.equal(audit.prerequisites.kui3b.acceptedMainRun, 34010502534)
assert.equal(audit.prerequisites.kui3b.artifactId, 9982308317)
assert.equal(audit.prerequisites.kui3b.artifactSha256, 'a97098e9902b2529fc8999b251858089142533934fc78699d7cc94aeba5f8666')
assert.equal(audit.prerequisites.kui3b.productionDeploymentCommit, '0e7b6b0682df21864551b6d47d9520209f42829f')
assert.equal(audit.prerequisites.kui3b.productionState, 'blocked_public_activation')
assert.equal(audit.prerequisites.kui3b.viewports, 2)
assert.equal(audit.prerequisites.kui3b.scenarios, 4)
assert.equal(audit.prerequisites.kui3b.violations, 0)
assert.deepEqual(audit.prerequisites.kui3b.productionSample.mappedCountryCodes, ['BR', 'PL'])
assert.equal(audit.prerequisites.kui3b.productionSample.observedStreams, 100)
assert.equal(audit.prerequisites.kui3b.productionSample.stableIdentityStreams, 100)
assert.equal(audit.prerequisites.kui3b.productionSample.reviewedIdentityStreams, 9)
assert.equal(audit.prerequisites.kui3b.productionSample.mappedStreams, 2)
assert.equal(audit.prerequisites.kui3b.productionSample.mappedViewers, 12848)
assert.equal(audit.prerequisites.kui3b.productionSample.unmappedStreams, 98)
assert.equal(audit.prerequisites.kui3b.productionSample.excludedStreams, 0)
assert.equal(audit.prerequisites.kui3b.productionSample.conflictStreams, 0)
assert.equal(audit.prerequisites.kui3b.productionSample.reconciliationPasses, true)
assert.equal(audit.prerequisites.kui3b.productionSample.stableIdentityPublished, false)

assert.equal(audit.currentGate.k4Authorized, false)
assert.equal(audit.currentGate.publicActivationAuthorized, false)
assert.equal(audit.currentGate.publicCountryActivationReady, false)
assert.deepEqual(audit.currentGate.blockers, ['public_country_activation_not_authorized'])
assert.equal(audit.currentGate.publicKickMapPage, 'absent')
assert.equal(audit.currentGate.productionViteInput, 'absent')

assert.equal(existsSync('apps/web/kick/map/index.html'), false, 'K4 pre-activation state must not contain a public Kick Map page')
assert.equal(existsSync('apps/web/kick/map'), false, 'K4 pre-activation state must not contain a public Kick Map directory')
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), false, 'K4 pre-activation state must not add a production Kick Map Vite input')
assert.equal(adapterSource.includes('publicActivationAuthorized: false'), true, 'Kick adapter must remain publicly blocked before K4 authorization')
assert.equal(runtimeSource.includes("'public_country_activation_not_authorized'"), true, 'production Country runtime must retain the K4 blocker')
assert.equal(runtimeSource.includes('stableIdentityPublished: false'), true, 'stable Kick identity must remain internal-only')
assert.equal(readinessSource.includes("assert.deepEqual(readiness.blockers, ['public_country_activation_not_authorized'])"), true, 'public-readiness gate must still identify K4 authorization as the only blocker')

for (const [key, value] of Object.entries(audit.invariants)) {
  if (key === 'stableIdentity') assert.equal(value, 'broadcaster_user_id')
  else assert.equal(value, false, `${key} must remain false before K4`)
}
for (const value of Object.values(audit.authorization)) assert.equal(value, false)

console.log(JSON.stringify({
  ok: true,
  schemaVersion: audit.schemaVersion,
  prerequisites: ['K2', 'K3', 'KUI3b'],
  productionSample: audit.prerequisites.kui3b.productionSample,
  blocker: audit.currentGate.blockers[0],
  publicKickMapPage: audit.currentGate.publicKickMapPage,
  productionViteInput: audit.currentGate.productionViteInput,
  k4Authorized: audit.currentGate.k4Authorized,
}, null, 2))
