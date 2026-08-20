#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a46-kick-history-v2-schema-failure-diagnosis-contract.json'
const workflowPath = '.github/workflows/analytics-12a46-kick-history-v2-schema-failure-diagnosis.yml'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a46-kick-history-v2-schema-failure-diagnosis-contract-v1', 'schema mismatch')
assert(contract.phase === '12A-46', 'phase mismatch')
assert(contract.issue === 936, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.status === 'read_only_production_diagnosis', 'status mismatch')
assert(contract.failedExecution.runId === 32332864208, 'source run mismatch')
assert(contract.failedExecution.productionJobId === 96316884149, 'source job mismatch')
assert(contract.failedExecution.mergeSha === '1c02df8525e579cea8dd0008a6003ec3d575b61a', 'source merge mismatch')
assert(contract.expectedV1Tables.length === 3, 'v1 table contract mismatch')
assert(contract.expectedV2Objects.tables.length === 3, 'v2 table contract mismatch')
assert(contract.expectedV2Objects.indexes.length === 2, 'v2 index contract mismatch')
assert(contract.temporaryWorkerService === 'viewloom-history-category-v2-schema-apply-kick', 'service mismatch')
assert(contract.allowed.d1SelectOnly === true, 'D1 SELECT read must be allowed')
assert(contract.allowed.cloudflareServiceGetOnly === true, 'service GET must be allowed')
for (const value of Object.values(contract.forbidden)) assert(value === true, 'all mutation surfaces must remain forbidden')

for (const required of [
  'SELECT type, name FROM sqlite_master',
  'SELECT COUNT(*) AS row_count FROM',
  'wrangler@4 d1 execute',
  '--remote',
  'workers/history-category-v2-schema-apply/wrangler.kick.toml',
  'actions/upload-artifact@v4',
  'viewloom-history-category-v2-schema-apply-kick',
]) assert(workflow.includes(required), `missing diagnosis fragment: ${required}`)

for (const forbidden of [
  'CREATE TABLE',
  'CREATE INDEX',
  'DROP TABLE',
  'DROP INDEX',
  'INSERT INTO',
  'DELETE FROM',
  'wrangler@4 deploy',
  'secret put',
  'curl -sS -X DELETE',
  '/apply',
]) assert(!workflow.includes(forbidden), `mutation surface forbidden in diagnosis workflow: ${forbidden}`)

console.log('12A-46 Kick History v2 schema failure diagnosis contract verified')
