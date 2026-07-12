#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/12a4-category-storage/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a4-category-storage-design-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-storage-budget-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.ok(['measured', 'accepted'].includes(evidence.status))
assert.equal(evidence.benchmark.benchmarkDays, contract.benchmark.benchmarkDays)
assert.equal(evidence.benchmark.projectionDays, contract.benchmark.projectionDays)
assert.equal(evidence.benchmark.snapshotsPerDay, contract.benchmark.snapshotsPerDay)
assert.equal(evidence.benchmark.safetyMarginPct, contract.benchmark.safetyMarginPct)
assert.equal(evidence.sourceContract.providerSeparated, true)
assert.equal(evidence.sourceContract.categoryContractVersion, contract.categoryContractVersion)
assert.deepEqual(evidence.sourceContract.twitch, { providerIdPath: 'game_id', namePath: 'game_name' })
assert.deepEqual(evidence.sourceContract.kick, { providerIdPath: 'category.id', namePath: 'category.name' })

for (const model of contract.candidateModels) assert.ok(evidence.candidateModels[model], `missing model: ${model}`)
assert.equal(evidence.candidateModels.raw_payload_only.decision, 'rejected')
assert.equal(evidence.candidateModels.raw_payload_only.retains90DayCategoryEvidence, false)
assert.equal(evidence.candidateModels.dominant_daily.decision, 'rejected')
assert.equal(evidence.candidateModels.dominant_daily.preservesHourlyCategory, false)
assert.equal(evidence.candidateModels.embedded_hourly.decision, 'selected')
assert.equal(evidence.candidateModels.embedded_hourly.retains90DayCategoryEvidence, true)
assert.equal(evidence.candidateModels.embedded_hourly.preservesHourlyCategory, true)
assert.equal(evidence.candidateModels.separate_hourly_table.decision, 'rejected')

assert.equal(evidence.selectedDesign.model, 'embedded_hourly')
assert.equal(evidence.selectedDesign.rawPayload.categoryContractVersion, 'root scalar')
assert.equal(evidence.selectedDesign.rawPayload.categoryIds, 'root provider-native id array')
assert.equal(evidence.selectedDesign.rawPayload.categoryRefs, 'root item-order-aligned reference array')
assert.equal(evidence.selectedDesign.rawPayload.nameStorage, 'set-based provider_category_dictionary upsert')
assert.equal(evidence.selectedDesign.dictionaryTable.name, 'provider_category_dictionary')
assert.deepEqual(evidence.selectedDesign.dictionaryTable.primaryKey, ['provider', 'category_id'])
for (const field of [
  'category_hourly_json',
  'category_observed_samples',
  'category_missing_samples',
  'category_contract_version',
]) assert.ok(evidence.selectedDesign.rollupColumns.includes(field), `missing rollup field: ${field}`)
for (const field of [
  'category_observed_streamers',
  'category_observed_samples',
  'category_missing_samples',
  'category_coverage_state',
]) assert.ok(evidence.selectedDesign.statusColumns.includes(field), `missing status field: ${field}`)
assert.equal(evidence.selectedDesign.categoryHourlyJson.hourlyResolution, true)
assert.equal(evidence.selectedDesign.categoryHourlyJson.exactSwitchTimeClaimAllowed, false)
assert.equal(evidence.selectedDesign.categoryHourlyJson.exactSessionClaimAllowed, false)
assert.equal(evidence.selectedDesign.indexes.newCategoryIndex, false)
assert.equal(evidence.selectedDesign.indexes.existingStreamerDayIndexReused, true)
assert.equal(evidence.selectedDesign.retentionDays, 90)
assert.equal(evidence.selectedDesign.newCron, false)
assert.equal(evidence.selectedDesign.backfill, false)
assert.equal(evidence.selectedDesign.rawRetentionChanged, false)
assert.equal(evidence.selectedDesign.runtimeCaptureEnabled, false)

for (const state of contract.coverageStates) assert.ok(evidence.coverageContract[state], `missing coverage state: ${state}`)

for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers[provider]
  assert.equal(row.selectedModel, 'embedded_hourly')
  assert.ok(row.rawReferenceEncoding.incrementalBytesPerSnapshot > 0)
  assert.ok(row.rawReferenceEncoding.projectedIncrementalMbAtRawRetentionWithSafety > 0)
  assert.equal(row.rawReferenceEncoding.categoryNamesRepeatedInRawItems, false)
  for (const model of ['baseline', 'dominant_daily', 'embedded_hourly', 'separate_hourly_table']) {
    assert.ok(row.models[model].fileBytes > 0, `${provider}/${model}: file bytes missing`)
    assert.ok(row.models[model].counts.rollupRows > 0, `${provider}/${model}: rows missing`)
  }
  assert.ok(row.models.dominant_daily.projectedIncrementalMb90dWithSafety < row.models.embedded_hourly.projectedIncrementalMb90dWithSafety)
  assert.ok(row.models.embedded_hourly.projectedIncrementalMb90dWithSafety < row.models.separate_hourly_table.projectedIncrementalMb90dWithSafety)
  assert.ok(row.selectedIncrementalMbWithSafety > 0)
  assert.ok(row.projectedSizeMbWithCategorySafety <= row.operationalCeilingMb)
  assert.ok(row.projectedHeadroomMb > 0)
  assert.equal(row.storageGatePass, true)
  assert.equal(row.dictionaryWriteBudget.additionalStatementsPerCollectorInvocation, 1)
  assert.equal(row.dictionaryWriteBudget.conflictRule, 'update only when provider category name changes')
  assert.equal(row.dictionaryWriteBudget.productionCostMeasurementRequiredBeforeEnablement, true)
  assert.equal(row.generatorBudget.additionalStatementsPerMaintenanceRefresh, 0)
  assert.equal(row.generatorBudget.maximumQueriesRemains, 12)
  assert.equal(row.generatorBudget.productionCostMeasurementRequiredBeforeEnablement, true)
}

assert.ok(evidence.providers.twitch.projectedSizeMbWithCategorySafety <= contract.selectedCandidateRequirements.twitchProjectedDatabaseMbMax)
assert.ok(evidence.providers.twitch.projectedHeadroomMb >= contract.selectedCandidateRequirements.twitchMinimumHeadroomMb)
assert.ok(evidence.providers.kick.projectedSizeMbWithCategorySafety <= contract.selectedCandidateRequirements.kickProjectedDatabaseMbMax)
assert.ok(evidence.providers.kick.projectedHeadroomMb >= contract.selectedCandidateRequirements.kickMinimumHeadroomMb)
assert.ok(evidence.account.projectedSizeMbWithCategorySafety <= contract.selectedCandidateRequirements.accountProjectedDatabaseMbMax)
assert.ok(evidence.account.projectedHeadroomMb >= contract.selectedCandidateRequirements.accountMinimumHeadroomMb)
assert.equal(evidence.account.storageGatePass, true)

assert.equal(evidence.gate.twitchStoragePass, true)
assert.equal(evidence.gate.kickStoragePass, true)
assert.equal(evidence.gate.accountStoragePass, true)
assert.equal(evidence.gate.categoryStorageDesignPass, true)
assert.equal(evidence.gate.migrationAuthorized, false)
assert.equal(evidence.gate.runtimeCaptureAuthorized, false)
assert.equal(evidence.gate.productionCostProbeRequired, true)

for (const value of Object.values(evidence.boundaries)) assert.equal(value, false)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'database_id',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'channelLogin":"',
  'displayName":"',
]) assert.equal(serialized.includes(forbidden), false, `forbidden evidence content: ${forbidden}`)

console.log('12A-4 category storage evidence verification passed.')
console.log(`- selected model: ${evidence.selectedDesign.model}`)
console.log(`- Twitch projected total/headroom: ${evidence.providers.twitch.projectedSizeMbWithCategorySafety}/${evidence.providers.twitch.projectedHeadroomMb} MB`)
console.log(`- Kick projected total/headroom: ${evidence.providers.kick.projectedSizeMbWithCategorySafety}/${evidence.providers.kick.projectedHeadroomMb} MB`)
console.log(`- account projected total/headroom: ${evidence.account.projectedSizeMbWithCategorySafety}/${evidence.account.projectedHeadroomMb} MB`)
console.log('- migration/runtime capture: unauthorized')
