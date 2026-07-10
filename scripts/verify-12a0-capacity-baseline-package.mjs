#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const required = [
  '.github/workflows/analytics-12a0-capacity-baseline.yml',
  '.github/workflows/analytics-12a0-no-runtime-change.yml',
  'docs/audits/12a0-capacity-baseline-contract.json',
  'docs/audits/12a0-runtime-boundary.json',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
  'scripts/check-12a0-no-runtime-change.mjs',
  'scripts/collect-12a0-capacity-baseline.mjs',
  'scripts/verify-12a0-capacity-baseline-contract.mjs',
  'scripts/verify-12a0-capacity-baseline-evidence.mjs',
]

for (const path of required) {
  assert.equal(existsSync(path), true, `missing 12A-0 package file: ${path}`)
  console.log(`present: ${path}`)
}

const contract = JSON.parse(readFileSync('docs/audits/12a0-capacity-baseline-contract.json', 'utf8'))
const runtimeBoundary = JSON.parse(readFileSync('docs/audits/12a0-runtime-boundary.json', 'utf8'))

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

const workflow = readFileSync('.github/workflows/analytics-12a0-capacity-baseline.yml', 'utf8')
assert.ok(workflow.includes('collect-12a0-capacity-baseline.mjs'))
assert.ok(workflow.includes('verify-12a0-capacity-baseline-evidence.mjs'))
assert.ok(workflow.includes('phase12a0-capacity-baseline'))

const note = readFileSync('docs/work-in-progress/phase12a0-capacity-baseline.md', 'utf8')
assert.ok(note.includes('evidence-only'))
assert.ok(note.includes('bucket_completion_offset_seconds'))
assert.ok(note.includes('12A-3'))

console.log('12A-0 capacity baseline package verification passed.')
