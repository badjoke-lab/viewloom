import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-contract.json',
  checkpointEvidence: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json',
  retirement: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json',
  runner: 'scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package.yml',
  collector: 'workers/collector-twitch/src/index-category.ts',
  encoder: 'workers/shared/category-capture.ts',
  schedule: 'docs/product/current-schedule.md',
  roadmap: 'docs/product/current-roadmap.md',
  spec: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  wip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contract = json(files.contract)
const checkpointEvidence = json(files.checkpointEvidence)
const retirement = json(files.retirement)
const runner = read(files.runner)
const workflow = read(files.workflow)
const collector = read(files.collector)
const encoder = read(files.encoder)

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-package-v1')
assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.phase, '12A-5B-R2')
assert.equal(contract.trackingIssue, 659)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.governingMainSha, '8e2a18c6644f516989e304c9ba35dcb05d2e9c2b')
assert.equal(contract.sourceEvidence.checkpointRunId, 30478338654)
assert.equal(contract.sourceEvidence.checkpointJobId, 90665697236)
assert.equal(contract.sourceEvidence.artifactId, 8734980337)
assert.equal(contract.sourceEvidence.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(contract.fixedWindows.gapContextStartAt, '2026-07-29T06:50:00.000Z')
assert.equal(contract.fixedWindows.gapContextEndExclusiveAt, '2026-07-29T08:00:00.000Z')
assert.equal(contract.fixedWindows.checkpointStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(contract.fixedWindows.checkpointEndExclusiveAt, '2026-07-29T18:20:00.000Z')
assert.deepEqual(contract.fixedWindows.missingBuckets, [
  '2026-07-29T07:20:00.000Z',
  '2026-07-29T07:25:00.000Z',
  '2026-07-29T07:30:00.000Z',
])
assert.equal(contract.staticCodeAttribution.nullReferenceCondition, 'categoryProviderId or categoryName is empty after trim')
assert.equal(contract.staticCodeAttribution.sourceFieldsStrippedBeforePersistence, true)
assert.equal(contract.staticCodeAttribution.postPersistenceIdVsNameDistinctionPossible, false)
assert.equal(contract.staticCodeAttribution.persistenceReindexingAfterEncoding, false)
assert.equal(contract.execution.productionExecutionIncludedOnPackagePr, false)
assert.equal(contract.execution.productionCredentialsUsedOnPackagePr, false)
assert.equal(contract.execution.separateExecutionPathAcceptanceRequired, true)
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(Object.values(contract.readOnlyBoundary).every((value) => Array.isArray(value) || value === false), true)
assert.deepEqual(contract.requiredOutputs, [
  'exact_missing_bucket_presence',
  'collector_runs_gap_context',
  'snapshots_gap_context',
  'null_refs_by_bucket',
  'null_refs_top_channels',
  'null_ref_checkpoint_summary',
  'null_ref_post_checkpoint_summary',
  'current_collector_status',
  'static_code_attribution',
  'diagnostic_limitations',
])
assert.equal(contract.acceptance.packagePr, null)
assert.equal(contract.acceptance.acceptancePr, null)
assert.equal(contract.acceptance.productionExecutionPerformed, false)

assert.equal(checkpointEvidence.status, 'checkpoint_failed')
assert.equal(checkpointEvidence.execution.workflowRunId, contract.sourceEvidence.checkpointRunId)
assert.deepEqual(checkpointEvidence.slotContinuity.missingSlots, contract.fixedWindows.missingBuckets)
assert.equal(checkpointEvidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(checkpointEvidence.categoryIntegrity.invalidCategoryRefs, 0)
assert.equal(checkpointEvidence.categoryIntegrity.unresolvedCategoryIds, 0)
assert.equal(checkpointEvidence.decision.publicCutoverAuthorized, false)
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.automaticClockResetAuthorized, false)

for (const fragment of [
  "const GAP_START = '2026-07-29T06:50:00.000Z'",
  "const GAP_END = '2026-07-29T08:00:00.000Z'",
  "const CHECKPOINT_START = '2026-07-29T05:30:00.000Z'",
  "const CHECKPOINT_END = '2026-07-29T18:20:00.000Z'",
  'exactMissingBucketPresence',
  'collectorRunsGapContext',
  'snapshotsGapContext',
  'nullRefsByBucket',
  'nullRefsTopChannels',
  'checkpointNullRefSummary',
  'postCheckpointNullRefSummary',
  'currentCollectorStatus',
  "ref.type = 'null'",
  "json_extract(m.payload_json, '$.items[' || ref.key || '].channelLogin')",
  "if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))",
  "throw new Error('non_select_statement_rejected')",
  "'wrangler@4'",
  "'--remote'",
  "'--json'",
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)

for (const forbidden of [
  'wrangler@4 deploy',
  'INSERT INTO',
  'UPDATE ',
  'DELETE FROM',
  'ALTER TABLE',
  'AUDIT_MODE=final',
]) assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)

assert.ok(collector.includes('game_id?: string'))
assert.ok(collector.includes('game_name?: string'))
assert.ok(collector.includes("const categoryProviderId = String(stream.game_id ?? '').trim()"))
assert.ok(collector.includes("const categoryName = String(stream.game_name ?? '').trim()"))
assert.ok(collector.includes('categoryProviderId: categoryProviderId || null'))
assert.ok(collector.includes('categoryName: categoryName || null'))
assert.ok(collector.includes('const storedItems = stripCategorySourceFields(input.items)'))
assert.ok(encoder.includes('if (!id || !name)'))
assert.ok(encoder.includes('categoryRefs.push(null)'))
assert.ok(encoder.includes('stripCategorySourceFields'))

for (const fragment of [
  'name: Analytics 12A5 Twitch Replacement Audit Checkpoint Failure Diagnosis Package',
  'Verify checkpoint failure diagnosis package',
  'Verify failed checkpoint evidence and retired path',
  'Verify current category rollout policy',
  'Verify current development policy',
  'Typecheck web',
  'Build web',
  'Verify production build still contains no public category controls',
]) assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('contents: write'), false)
assert.equal(workflow.includes('run: node scripts/run-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis.mjs'), false)

for (const [path, fragments] of Object.entries({
  [files.schedule]: ['Current gate checkpoint failure diagnosis package', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package'],
  [files.roadmap]: ['### Current gate: checkpoint failure diagnosis', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package'],
  [files.spec]: ['## Current gate: failure diagnosis', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package'],
  [files.wip]: ['checkpoint failure diagnosis', 'work-659-twitch-replacement-audit-checkpoint-failure-diagnosis-package'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  phase: contract.phase,
  sourceCheckpointFailed: true,
  diagnosisPackageReady: true,
  productionExecutionIncluded: false,
  sourceFieldLossLimitationRecorded: true,
  nextGate: contract.nextGate,
}, null, 2))
