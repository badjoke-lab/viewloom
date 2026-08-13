import assert from 'node:assert/strict'
import { readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a13-kick-history-category-aggregate-benchmark-contract.json')
const frozen = json('docs/audits/12a13-kick-history-category-aggregate-benchmark-evidence.json')
const decision = json('docs/audits/12a12-kick-history-category-aggregate-capacity-decision.json')
const migration = read('db/d1/006_history_category_aggregate.sql')
const benchmarkScript = read('scripts/measure-12a13-kick-history-category-aggregate.py')

assert.equal(contract.schemaVersion, 'viewloom-12a13-kick-history-category-aggregate-benchmark-contract-v1')
assert.equal(contract.status, 'candidate_accepted_on_merge')
assert.equal(contract.phase, '12A-13')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.trackingIssue, 831)
assert.equal(contract.provider, 'kick')
assert.equal(contract.sourceDecision.decisionPr, 830)
assert.equal(contract.sourceDecision.decisionMergeSha, '9bba1bb5011204998419817bed8b39df6dd8d5de')
assert.equal(contract.sourceDecision.decision, decision.decision)
assert.equal(decision.decision, 'accept_bounded_forward_only_history_category_aggregate_design')

assert.equal(contract.hardBounds.retentionDays, 180)
assert.equal(contract.hardBounds.categoryRowsPerDay, 300)
assert.equal(contract.hardBounds.streamerCategoryRowsPerDay, 1000)
assert.equal(contract.hardBounds.maximumCategoryRows, 54000)
assert.equal(contract.hardBounds.maximumStreamerCategoryRows, 180000)
assert.equal(contract.hardBounds.maximumStatusRows, 180)
assert.equal(contract.hardBounds.maximumRowsTotal, 234180)
assert.equal(contract.hardBounds.capsAreRankingOrSampling, false)
assert.equal(contract.hardBounds.overflowPolicy, 'reject_entire_day_as_unavailable_overflow')
assert.equal(contract.hardBounds.partialOverflowRowsMayBeExposed, false)

assert.equal(contract.benchmarkGate.pageSizeBytes, 4096)
assert.equal(contract.benchmarkGate.safetyMarginPct, 20)
assert.equal(contract.benchmarkGate.incrementalMiBWithSafetyMax, 60)
assert.equal(contract.freeStrongGate.acceptedKickProjectedMiB, decision.currentAcceptedConstraints.kickProjectedNinetyDaySizeMb)
assert.equal(contract.freeStrongGate.acceptedProviderCeilingMiB, decision.currentAcceptedConstraints.projectedProviderSizeMbMax)
assert.equal(contract.freeStrongGate.acceptedProviderHeadroomMinMiB, decision.currentAcceptedConstraints.projectedProviderHeadroomMbMin)
assert.equal(contract.freeStrongGate.acceptedAccountHeadroomMiB, decision.currentAcceptedConstraints.kickProjectedAccountWideHeadroomMb)
assert.equal(contract.freeStrongGate.acceptedAccountHeadroomMinMiB, decision.currentAcceptedConstraints.projectedAccountWideHeadroomMbMin)
assert.equal(contract.freeStrongGate.thresholdRelaxationAllowed, false)

for (const table of contract.schema.tables) {
  assert.ok(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`), `migration missing table ${table}`)
}
for (const index of contract.schema.indexes) {
  assert.ok(migration.includes(`CREATE INDEX IF NOT EXISTS ${index}`), `migration missing index ${index}`)
}
for (const fragment of [
  'PRIMARY KEY (provider, day, category_id)',
  'PRIMARY KEY (provider, day, category_id, streamer_id)',
  'PRIMARY KEY (provider, day)',
  'ON history_category_daily (provider, category_id, day)',
  'ON history_category_streamer_daily (provider, category_id, day, streamer_id)',
  "contract_version TEXT NOT NULL DEFAULT 'category-source-v1'",
]) assert.ok(migration.includes(fragment), `migration missing schema fragment: ${fragment}`)
assert.equal(/\b(?:INSERT|UPDATE|DELETE|REPLACE)\b/i.test(migration), false, 'migration candidate must be DDL-only')
assert.match(migration, /Do not apply remotely/)
assert.match(migration, /authorizes Kick only/)

for (const fragment of [
  'DAYS = 180',
  'CATEGORY_ROW_CAP = 300',
  'STREAMER_CATEGORY_ROW_CAP = 1000',
  'SAFETY_MARGIN = 1.20',
  'DESIGN_BUDGET_MIB = 60.0',
  'unavailable_overflow',
  'EXPLAIN QUERY PLAN',
  'secondPassFileByteDelta',
]) assert.ok(benchmarkScript.includes(fragment), `benchmark missing contract fragment: ${fragment}`)

assert.equal(frozen.schemaVersion, 'viewloom-12a13-kick-history-category-aggregate-benchmark-v1')
assert.equal(frozen.status, 'measured')
assert.equal(frozen.trackingIssue, 831)
assert.equal(frozen.provider, 'kick')
assert.equal(frozen.migration, contract.package.migration)
assert.equal(frozen.benchmark.retentionDays, contract.hardBounds.retentionDays)
assert.equal(frozen.benchmark.categoryRowCapPerDay, contract.hardBounds.categoryRowsPerDay)
assert.equal(frozen.benchmark.streamerCategoryRowCapPerDay, contract.hardBounds.streamerCategoryRowsPerDay)
assert.equal(frozen.benchmark.safetyMarginPct, contract.benchmarkGate.safetyMarginPct)
assert.equal(frozen.benchmark.designBudgetMiB, contract.benchmarkGate.incrementalMiBWithSafetyMax)
assert.ok(frozen.benchmark.incrementalMiBWithSafety <= contract.benchmarkGate.incrementalMiBWithSafetyMax)
assert.equal(frozen.benchmark.incrementalMiBWithSafety, 49.91)
assert.equal(frozen.benchmark.designBudgetHeadroomMiB, 10.09)
assert.equal(frozen.benchmark.designBudgetPass, true)
assert.deepEqual(frozen.maximumRows, {
  historyCategoryDaily: 54000,
  historyCategoryStreamerDaily: 180000,
  historyCategoryDayStatus: 180,
  total: 234180,
})
assert.deepEqual(frozen.measuredRows, {
  historyCategoryDaily: 54000,
  historyCategoryStreamerDaily: 180000,
  historyCategoryDayStatus: 180,
})
assert.equal(frozen.rowCountPass, true)
assert.equal(frozen.migrationIdempotency.secondPassFileByteDelta, 0)
assert.equal(frozen.migrationIdempotency.schemaStable, true)
assert.equal(frozen.queryPlanPass.categoryDailyRange, true)
assert.equal(frozen.queryPlanPass.streamerPeriodRanking, true)
assert.ok(frozen.queryPlans.categoryDailyRange.some((line) => line.includes(contract.benchmarkGate.categoryDailyRangeMustUseIndex)))
assert.ok(frozen.queryPlans.streamerPeriodRanking.some((line) => line.includes(contract.benchmarkGate.streamerPeriodRangeMustUseIndex)))
assert.equal(frozen.overflowFixture.persistedCategoryRows, 0)
assert.equal(frozen.overflowFixture.persistedStreamerCategoryRows, 0)
assert.equal(frozen.overflowFixture.coverageState, 'unavailable_overflow')
assert.equal(frozen.overflowFixture.pass, true)
assert.equal(frozen.providerSeparationFixture.pass, true)
assert.equal(frozen.providerSeparationFixture.sameCategoryIdCollidesAcrossProviders, false)
assert.equal(frozen.providerSeparationFixture.twitchRolloutAuthorized, false)
assert.equal(frozen.freeStrongProjection.measuredProjectedKickMiB, 419.59)
assert.equal(frozen.freeStrongProjection.measuredProviderHeadroomMiB, 20.41)
assert.equal(frozen.freeStrongProjection.measuredAccountHeadroomMiB, 829.68)
assert.ok(frozen.freeStrongProjection.measuredProjectedKickMiB <= contract.freeStrongGate.acceptedProviderCeilingMiB)
assert.ok(frozen.freeStrongProjection.measuredProviderHeadroomMiB >= contract.freeStrongGate.acceptedProviderHeadroomMinMiB)
assert.ok(frozen.freeStrongProjection.measuredAccountHeadroomMiB >= contract.freeStrongGate.acceptedAccountHeadroomMinMiB)

for (const key of [
  'productionSchemaApply',
  'productionD1Mutation',
  'collectorGeneration',
  'workerDeployment',
  'bindingChange',
  'cadenceChange',
  'retentionChange',
  'backfill',
  'historyApiCategoryParameter',
  'historyCategoryUi',
  'hiddenCandidate',
  'publicCutover',
  'twitchRollout',
  'crossProviderRanking',
]) assert.equal(contract.authorization[key], false, `${key}: must remain false`)

const rerunPath = join(tmpdir(), `viewloom-12a13-${process.pid}.json`)
rmSync(rerunPath, { force: true })
const rerun = spawnSync(
  'python3',
  [
    'scripts/measure-12a13-kick-history-category-aggregate.py',
    '--migration', contract.package.migration,
    '--decision', contract.sourceDecision.path,
    '--output', rerunPath,
  ],
  { encoding: 'utf8' },
)
if (rerun.status !== 0) {
  process.stderr.write(rerun.stdout || '')
  process.stderr.write(rerun.stderr || '')
  throw new Error(`benchmark rerun failed with exit ${rerun.status}`)
}
const generated = json(rerunPath)
rmSync(rerunPath, { force: true })

assert.equal(generated.benchmark.designBudgetPass, true)
assert.equal(generated.rowCountPass, true)
assert.equal(generated.migrationIdempotency.secondPassFileByteDelta, 0)
assert.equal(generated.migrationIdempotency.schemaStable, true)
assert.deepEqual(generated.maximumRows, frozen.maximumRows)
assert.deepEqual(generated.measuredRows, frozen.measuredRows)
assert.deepEqual(generated.queryPlanPass, frozen.queryPlanPass)
assert.deepEqual(generated.overflowFixture, frozen.overflowFixture)
assert.deepEqual(generated.providerSeparationFixture, frozen.providerSeparationFixture)
assert.equal(generated.benchmark.incrementalMiBWithSafety, frozen.benchmark.incrementalMiBWithSafety)
assert.equal(generated.benchmark.designBudgetHeadroomMiB, frozen.benchmark.designBudgetHeadroomMiB)
assert.deepEqual(generated.freeStrongProjection, frozen.freeStrongProjection)

console.log('Kick History category aggregate migration/benchmark verified: exact 180-day maximum-row schema remains within the 60 MiB Free Strong design budget, range indexes are used, overflow fails closed, and no production/runtime/UI/Twitch authority is granted.')
