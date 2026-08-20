#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a50-kick-history-v2-schema-retry-acceptance-contract.json'
const workflowPath = '.github/workflows/analytics-12a50-kick-history-v2-schema-retry-acceptance.yml'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) { if (!condition) throw new Error(message) }

assert(contract.schemaVersion === 'viewloom-12a50-kick-history-v2-schema-retry-acceptance-contract-v1', 'schema mismatch')
assert(contract.phase === '12A-50', 'phase mismatch')
assert(contract.issue === 951, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.source.executionIssue === 949, 'execution issue mismatch')
assert(contract.source.triggerPr === 948, 'trigger PR mismatch')
assert(contract.source.triggerHeadSha === '88f60b8aaa53cd0e60b3a4f72470064e29e26386', 'trigger head mismatch')
assert(contract.source.preExecutionMainSha === 'ba3435901a1d2055f4106aa12932d0e714b999e1', 'pre-execution main mismatch')
assert(contract.source.productionMergeSha === 'b0366eb1b1b2268ef75bb2a5d29251f6097ef574', 'production merge mismatch')
assert(contract.source.workflowName === 'Analytics 12A49 Kick History V2 Schema Apply Retry', 'workflow mismatch')
assert(contract.source.artifactName === 'phase12a49-kick-history-v2-schema-apply-retry', 'artifact mismatch')
assert(contract.successRequirements.firstApplyStatementCount === 5, 'first statement mismatch')
assert(contract.successRequirements.secondApplyStatementCount === 0, 'second statement mismatch')
assert(contract.successRequirements.v1SchemaCompleteAfter === true, 'v1 completeness mismatch')
assert(contract.successRequirements.v2SchemaCompleteAfter === true, 'v2 completeness mismatch')
assert(contract.successRequirements.v2AggregateRowsAfter === 0, 'v2 rows mismatch')
assert(contract.successRequirements.providerLeakageRowsAfter === 0, 'leakage mismatch')
assert(contract.successRequirements.freshNaturalSnapshot === true, 'fresh snapshot mismatch')
assert(contract.successRequirements.temporaryWorkerDeleted === true, 'worker deletion mismatch')
assert(contract.successRequirements.postDeleteHttpStatus === 404, 'delete status mismatch')
assert(contract.successRequirements.maxDatabaseSizeDeltaBytes === 5242880, 'size delta mismatch')
for (const [key, value] of Object.entries(contract.boundaries)) {
  if (key === 'githubActionsReadOnly') assert(value === true, `${key} must be true`)
  else assert(value === false, `${key} must remain false`)
}
for (const forbidden of ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','wrangler','workers.dev','d1 execute','secret put','deploy --config']) {
  assert(!workflow.includes(forbidden), `production surface forbidden: ${forbidden}`)
}
for (const required of ['gh api','actions/runs?head_sha=','production-schema-retry','phase12a49-kick-history-v2-schema-apply-retry','actions/upload-artifact@v4']) {
  assert(workflow.includes(required), `missing read-only acceptance fragment: ${required}`)
}
console.log('12A-50 Kick History v2 schema retry acceptance contract verified')
