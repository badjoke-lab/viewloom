import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const json = (path) => JSON.parse(read(path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

for (const path of [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a3-generator-enablement-contract.json',
  'docs/audits/12a3-generator-enablement-evidence.json',
  'docs/audits/12a3-postmerge-acceptance-contract.json',
  'docs/audits/12a3-postmerge-acceptance-evidence.json',
  'docs/operations/12a3-generator-enablement-acceptance-2026-07-12.md',
  'docs/operations/12a3-postmerge-acceptance-2026-07-12.md',
  'workers/shared/intraday-generator.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
]) assert.equal(exists(path), true, `missing file: ${path}`)

for (const retired of [
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
  'docs/work-in-progress/phase12a1-field-contract.md',
  'docs/work-in-progress/phase12a2-intraday-rollup-design.md',
  'docs/work-in-progress/phase12a2-binding-size-gate.md',
  'docs/work-in-progress/phase12a2-migration.md',
  'docs/work-in-progress/phase12a2-remote-schema-probe.md',
  'docs/work-in-progress/phase12a2-controlled-remote-apply.md',
  'docs/work-in-progress/phase12a2-collector-worker-deploy.md',
  'docs/work-in-progress/phase12a3-account-storage-gate.md',
  'docs/work-in-progress/phase12a3-execution-cost-probe.md',
  'docs/work-in-progress/phase12a3-generator-enablement.md',
  'docs/work-in-progress/phase12a3-postmerge-acceptance.md',
]) assert.equal(exists(retired), false, `retired file still present: ${retired}`)

for (const path of ['docs/product/current-roadmap.md', 'docs/product/current-schedule.md']) {
  check(path, [
    'Phase 12A Analytics Capture Foundation',
    'PR #506',
    'PR #507',
    'PR #508',
    'PR #510',
    'PR #511',
    'Production generation started yes',
    '12A-4 provider-specific category capture foundation',
  ])
}

const enablement = json('docs/audits/12a3-generator-enablement-evidence.json')
assert.equal(enablement.status, 'accepted')
assert.equal(enablement.providerSeparated, true)
assert.equal(enablement.gate?.generationEnablementPass ?? enablement.gate?.acceptancePass, true)

const postmerge = json('docs/audits/12a3-postmerge-acceptance-evidence.json')
assert.equal(postmerge.status, 'accepted')
assert.equal(postmerge.merge.pr, 510)
assert.equal(postmerge.merge.sha, 'ad90585d74149b0fb1805b9a76fd8d796a5e7c2d')
assert.equal(postmerge.deployment.runId, 29191094150)
assert.equal(postmerge.deployment.gatePass, true)
assert.equal(postmerge.providerSeparated, true)
assert.equal(postmerge.providers.twitch.providerGatePass, true)
assert.equal(postmerge.providers.kick.providerGatePass, true)
assert.equal(postmerge.providers.twitch.config.streamerCap, 600)
assert.equal(postmerge.providers.kick.config.streamerCap, 200)
assert.equal(postmerge.gate.postMergeAccumulationPass, true)
assert.equal(postmerge.boundaries.readOnly, true)
assert.equal(postmerge.boundaries.sourceRowsModified, false)
assert.equal(postmerge.boundaries.backfillPerformed, false)
assert.equal(postmerge.boundaries.newCronAdded, false)
assert.equal(postmerge.boundaries.crossProviderAnalyticsIncluded, false)
assert.equal(postmerge.boundaries.temporaryVerifiersRetained, false)
for (const value of Object.values(postmerge.privacy)) assert.equal(value, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v9')
assert.equal(state.status, '12a3_complete_12a4_current')
assert.equal(state.generationEnablement.pr, 510)
assert.equal(state.postMergeAccumulation.pr, 511)
assert.equal(state.postMergeAccumulation.postMergeAccumulationPass, true)
assert.equal(state.postMergeAccumulation.temporaryVerifiersRetained, false)
assert.equal(state.generation.status, 'enabled_and_accumulating')
assert.equal(state.generation.authorized, true)
assert.equal(state.generation.runtimeGenerationStarted, true)
assert.equal(state.generation.providerSeparated, true)
assert.equal(state.generation.newCronAdded, false)
assert.equal(state.generation.backfillPerformed, false)
assert.equal(state.currentWorkstream.phase, '12A-4')
assert.equal(state.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(state.currentWorkstream.crossProviderAnalyticsAllowed, false)
assert.equal(state.nextWorkstream, '12A-4 provider-specific category capture foundation')

console.log('Development and documentation policy verification passed.')
console.log('- Phase 12A remains active')
console.log('- 12A-3 bounded generator enabled PR #510')
console.log('- post-merge production accumulation accepted PR #511')
console.log('- Twitch and Kick remain provider-separated')
console.log('- no new cron, backfill, raw-retention extension, or cross-provider analytics')
console.log('- current workstream: 12A-4 provider-specific category capture foundation')
