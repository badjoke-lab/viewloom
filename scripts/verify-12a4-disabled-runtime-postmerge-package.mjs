#!/usr/bin/env node

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

for (const path of [
  'docs/audits/12a4-disabled-runtime-postmerge-contract.json',
  'workers/category-disabled-runtime-verifier/src/index.ts',
  'workers/category-disabled-runtime-verifier/wrangler.twitch.toml',
  'workers/category-disabled-runtime-verifier/wrangler.kick.toml',
  'scripts/collect-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-package.mjs',
  'scripts/check-12a4-disabled-runtime-postmerge-scope.mjs',
  '.github/workflows/analytics-12a4-disabled-runtime-postmerge.yml',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
]) assert.equal(existsSync(path), true, `missing disabled runtime acceptance file: ${path}`)

const contract = JSON.parse(readFileSync('docs/audits/12a4-disabled-runtime-postmerge-contract.json', 'utf8'))
assert.equal(contract.status === 'candidate' || contract.status === 'accepted', true)
assert.equal(contract.merge.pr, 516)
assert.equal(contract.merge.sha, '5d58b267a18399b5496a1f01aae7125a63f061c4')
assert.equal(contract.deployment.event, 'push')
assert.equal(contract.deployment.branch, 'main')
assert.equal(contract.deployment.exactMergeShaRequired, true)
assert.equal(contract.requiredChecks.latestSnapshotAfterDeployment, true)
assert.equal(contract.requiredChecks.categoryPayloadFieldsAbsent, true)
assert.equal(contract.requiredChecks.categorySchemaAbsent, true)
assert.equal(contract.requiredChecks.providerSeparated, true)
assert.equal(contract.requiredChecks.temporaryVerifiersDeleted, true)
assert.equal(contract.nextGate.productionExecutionCostProbeRequired, true)
assert.equal(contract.nextGate.remoteMigrationApplyAuthorized, false)
assert.equal(contract.nextGate.runtimeCaptureEnablementAuthorized, false)
for (const value of Object.values(contract.privacy)) assert.equal(value, false)
assert.equal(contract.boundaries.readOnly, true)
for (const [key, value] of Object.entries(contract.boundaries)) {
  if (key !== 'readOnly') assert.equal(value, false, `boundary must remain false: ${key}`)
}

const worker = readFileSync('workers/category-disabled-runtime-verifier/src/index.ts', 'utf8')
for (const fragment of [
  "json_type(payload_json, '$.categoryContractVersion')",
  "json_type(payload_json, '$.categoryIds')",
  "json_type(payload_json, '$.categoryRefs')",
  "name = 'provider_category_dictionary'",
  'PRAGMA table_info(',
  'latestAfterDeployment',
  'categoryPayloadFieldsAbsent',
  'categorySchemaAbsent',
  'providerSeparated',
]) assert.ok(worker.includes(fragment), `verifier worker missing: ${fragment}`)
for (const forbidden of [
  'INSERT INTO',
  'UPDATE ',
  'DELETE FROM',
  'CREATE TABLE',
  'ALTER TABLE',
  'scheduled(',
]) assert.equal(worker.includes(forbidden), false, `read-only verifier contains: ${forbidden}`)

for (const path of [
  'workers/category-disabled-runtime-verifier/wrangler.twitch.toml',
  'workers/category-disabled-runtime-verifier/wrangler.kick.toml',
]) {
  const source = readFileSync(path, 'utf8')
  assert.equal(source.includes('[triggers]'), false, `${path}: verifier must not have cron`)
  assert.ok(source.includes('MIN_COLLECTED_AT = "REPLACE_AT_RUNTIME"'))
  assert.ok(source.includes('binding = "DB"'))
}

console.log('12A-4 disabled runtime post-merge package verification passed.')
console.log('- read-only provider verifiers: true')
console.log('- exact main deployment required: true')
console.log('- production category schema and payload expected absent: true')
console.log('- temporary verifier deletion required: true')
