#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const required = [
  '.github/workflows/analytics-12a0-capacity-baseline.yml',
  '.github/workflows/analytics-12a0-no-runtime-change.yml',
  'docs/audits/12a0-capacity-baseline-contract.json',
  'docs/audits/12a0-runtime-boundary.json',
  'docs/audits/12a0-current-data-capacity-baseline.json',
  'scripts/check-12a0-no-runtime-change.mjs',
  'scripts/collect-12a0-capacity-baseline.mjs',
  'scripts/verify-12a0-capacity-baseline-contract.mjs',
  'scripts/verify-12a0-capacity-baseline-evidence.mjs',
]

for (const path of required) {
  assert.equal(existsSync(path), true, `missing 12A-0 package file: ${path}`)
  console.log(`present: ${path}`)
}

assert.equal(
  existsSync('docs/work-in-progress/phase12a0-capacity-baseline.md'),
  false,
  'completed 12A-0 WIP note must remain retired',
)

const contract = JSON.parse(readFileSync('docs/audits/12a0-capacity-baseline-contract.json', 'utf8'))
const runtimeBoundary = JSON.parse(readFileSync('docs/audits/12a0-runtime-boundary.json', 'utf8'))
const permanentEvidence = JSON.parse(readFileSync('docs/audits/12a0-current-data-capacity-baseline.json', 'utf8'))

assert.equal(contract.workstream, '12A-0 current data and capacity baseline')
assert.equal(contract.evidenceMode, 'read-only-production-observation')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.runtimeChanged, false)
assert.equal(contract.completionRules.runtimeChangeAllowed, false)
assert.equal(contract.completionRules.migrationAuthorizedByBaselineAlone, false)

assert.equal(runtimeBoundary.workstream, contract.workstream)
assert.equal(runtimeBoundary.boundary, 'evidence-only')
assert.equal(runtimeBoundary.runtimeChangeAllowed, false)
assert.ok(Array.isArray(runtimeBoundary.forbiddenPathPrefixes) && runtimeBoundary.forbiddenPathPrefixes.length >= 4)

assert.equal(permanentEvidence.schemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(permanentEvidence.workstream, contract.workstream)
assert.equal(permanentEvidence.evidenceMode, contract.evidenceMode)
assert.equal(permanentEvidence.providerSeparated, true)
assert.equal(permanentEvidence.runtimeChanged, false)
assert.equal(permanentEvidence.acceptance?.status, 'accepted')
assert.ok(Number.isInteger(permanentEvidence.acceptance?.workflowRunId))
assert.ok(Number.isInteger(permanentEvidence.acceptance?.artifactId))
assert.equal(permanentEvidence.collectorDuration?.twitch?.proxyMetric, 'bucket_completion_offset_seconds')
assert.equal(permanentEvidence.collectorDuration?.kick?.proxyMetric, 'bucket_completion_offset_seconds')
assert.match(permanentEvidence.budgets?.decisionBoundary ?? '', /No 12A-2 migration is authorized/i)

const workflow = readFileSync('.github/workflows/analytics-12a0-capacity-baseline.yml', 'utf8')
assert.ok(workflow.includes('collect-12a0-capacity-baseline.mjs'))
assert.ok(workflow.includes('verify-12a0-capacity-baseline-evidence.mjs'))
assert.ok(workflow.includes('phase12a0-capacity-baseline'))

console.log('12A-0 capacity baseline package verification passed.')
console.log('- completed WIP note remains retired')
console.log('- permanent accepted evidence replaces the WIP package note')
console.log('- evidence-only and no-migration boundaries remain enforced')
