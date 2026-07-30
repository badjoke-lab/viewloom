import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const gate = json('docs/audits/12a2-current-gate-state.json')
const evidence = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-evidence.json')
const retirement = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-retirement.json')
const decision = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.json')

for (const path of [
  'scripts/verify-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-decision.mjs',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-permanent.toml',
]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-execution.yml',
  '.github/workflows/analytics-12a5-twitch-checkpoint-failure-diagnosis-reporter.yml',
]) assert.equal(existsSync(path), false, `${path}: temporary diagnosis path must remain retired`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(evidence.status, 'diagnosis_complete')
assert.equal(evidence.categoryReferenceDiagnosis.checkpoint.coverageRatio, 0.994524)
assert.equal(evidence.categoryReferenceDiagnosis.postCheckpoint.coverageRatio, 0.994236)
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(decision.status, 'recovery_required')
assert.equal(decision.decision.originalReplacementWindowValid, false)
assert.equal(decision.decision.recoveryRequired, true)
assert.equal(decision.decision.publicCutoverAuthorized, false)
assert.equal(decision.clockRule.oldWindowRetired, true)
assert.equal(decision.clockRule.newStartAt, null)
assert.equal(decision.requiredRecovery.contractVersion, 'category-source-v2-candidate')
assert.equal(decision.requiredRecovery.semanticConstraints.kickMayBeChanged, false)
assert.equal(decision.requiredRecovery.semanticConstraints.publicUiMayBeChanged, false)

for (const [path, fragments] of Object.entries({
  'AGENTS.md': ['Diagnosis decision: recovery required', 'work-659-twitch-category-source-v2-completeness-recovery-package'],
  'CONTRIBUTING.md': ['Diagnosis decision recovery required', 'synthetic category mapping'],
  'docs/README.md': ['Diagnosis decision recovery required', 'Original stability clock valid no'],
  'docs/product/current-roadmap.md': ['### Current gate: Twitch category-source completeness v2 recovery package', 'category-source-v2-candidate'],
  'docs/product/current-schedule.md': ['Current gate category-source-v2 completeness recovery package', 'Original stability clock valid no'],
  'docs/product/twitch-replacement-seven-day-audit-spec.md': ['## Current gate: Twitch category-source-v2 completeness recovery package', 'original replacement window'],
  'docs/work-in-progress/phase12a4-category-parallel-execution.md': ['category-source-v2 completeness recovery package', 'No public category UI'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const dbId = (source) => source.match(/^database_id\s*=\s*"([^"]+)"$/m)?.[1] ?? null
const twNormal = read('workers/collector-twitch/wrangler.toml')
const twPermanent = read('workers/collector-twitch/wrangler.category-permanent.toml')
const kickNormal = read('workers/collector-kick/wrangler.toml')
const kickPermanent = read('workers/collector-kick/wrangler.category-permanent.toml')
assert.equal(cron(twNormal), '*/5 * * * *')
assert.equal(cron(twPermanent), cron(twNormal))
assert.equal(cron(kickNormal), '*/5 * * * *')
assert.equal(cron(kickPermanent), cron(kickNormal))
assert.equal(dbId(twPermanent), dbId(twNormal))
assert.equal(dbId(kickPermanent), dbId(kickNormal))
assert.notEqual(dbId(twPermanent), dbId(kickPermanent))
assert.ok(twPermanent.includes('CATEGORY_CAPTURE_ENABLED = "true"'))
assert.ok(kickPermanent.includes('CATEGORY_CAPTURE_ENABLED = "true"'))

console.log(JSON.stringify({
  ok: true,
  decision: decision.status,
  recoveryContract: decision.requiredRecovery.contractVersion,
  oldWindowRetired: true,
  publicTwitchFilterAuthorized: false,
}, null, 2))
