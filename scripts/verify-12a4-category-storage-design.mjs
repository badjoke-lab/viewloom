#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contract = JSON.parse(readFileSync('docs/audits/12a4-category-storage-design-contract.json', 'utf8'))
const benchmark = readFileSync('scripts/measure-12a4-category-storage-models.py', 'utf8')
const sourceEvidence = JSON.parse(readFileSync('docs/audits/12a4-category-source-audit-evidence.json', 'utf8'))
const storageEvidence = JSON.parse(readFileSync('docs/audits/12a3-account-storage-evidence.json', 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-storage-design-contract-v1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.categoryContractVersion, 'category-source-v1')
assert.equal(sourceEvidence.status, 'accepted')
assert.equal(sourceEvidence.gate.categorySourceAuditPass, true)
assert.equal(sourceEvidence.gate.storageDesignAuthorized, true)
assert.equal(sourceEvidence.gate.runtimeCaptureAuthorized, false)
assert.equal(storageEvidence.gate.generationStorageGatePass, true)
assert.deepEqual(contract.candidateModels, [
  'raw_payload_only',
  'dominant_daily',
  'embedded_hourly',
  'separate_hourly_table',
])
assert.equal(contract.sourceLayer.dictionary.upsertMode, 'one set-based statement per collection')
assert.equal(contract.sourceLayer.dictionary.unchangedNameWriteAllowed, false)
for (const state of [
  'observed',
  'missing_from_source',
  'not_in_bounded_window',
  'partial_source_coverage',
  'stale',
  'unavailable',
]) assert.ok(contract.coverageStates.includes(state), `missing coverage state: ${state}`)
for (const value of Object.values(contract.scope)) assert.equal(value, false)
assert.equal(contract.acceptance.productionCostProbeRequiredBeforeRuntimeEnablement, true)
assert.equal(contract.acceptance.migrationAuthorizedByThisContract, false)
assert.equal(contract.acceptance.runtimeCaptureAuthorizedByThisContract, false)

for (const fragment of [
  'BENCHMARK_DAYS = 7',
  'PROJECTION_DAYS = 90',
  'SAFETY_MARGIN = 1.20',
  'CATEGORY_DISTINCT_RATIO = 0.45',
  'raw_payload_only',
  'dominant_daily',
  'embedded_hourly',
  'separate_hourly_table',
  'provider_category_dictionary',
  'category_hourly_json',
  'category_observed_samples',
  'category_missing_samples',
  'category_coverage_state',
  'categoryIds',
  'categoryRefs',
  'categoryNamesRepeatedInRawItems',
  'newCategoryIndex',
  'runtimeCaptureAuthorized',
  'productionCostProbeRequired',
]) assert.ok(benchmark.includes(fragment), `benchmark missing: ${fragment}`)

for (const forbidden of [
  'wrangler d1 execute',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
]) assert.equal(benchmark.includes(forbidden), false, `benchmark must not use: ${forbidden}`)

console.log('12A-4 category storage design contract verification passed.')
console.log('- four storage models are compared reproducibly')
console.log('- accepted Twitch/Kick source contracts remain separate')
console.log('- no migration, runtime capture, backfill, new cron, UI, or cross-provider category work')
