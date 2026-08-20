#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a48-kick-history-v2-schema-retry-acceptance-contract.json'
const workflowPath = '.github/workflows/analytics-12a48-kick-history-v2-schema-retry-acceptance.yml'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) { if (!condition) throw new Error(message) }

assert(contract.schemaVersion === 'viewloom-12a48-kick-history-v2-schema-retry-acceptance-contract-v1', 'schema mismatch')
assert(contract.phase === '12A-48', 'phase mismatch')
assert(contract.issue === 943, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.source.executionIssue === 942, 'execution issue mismatch')
assert(contract.source.triggerPr === 941, 'trigger PR mismatch')
assert(contract.source.productionMergeSha === 'fc5634130be59e3d86056781793a8550055725d3', 'source merge mismatch')
assert(contract.source.workflowName === 'Analytics 12A47 Kick History V2 Schema Apply Retry', 'workflow mismatch')
assert(contract.source.artifactName === 'phase12a47-kick-history-v2-schema-apply-retry', 'artifact mismatch')
assert(contract.successRequirements.firstApplyStatementCount === 5, 'first statement mismatch')
assert(contract.successRequirements.secondApplyStatementCount === 0, 'second statement mismatch')
assert(contract.successRequirements.postDeleteHttpStatus === 404, 'delete status mismatch')
for (const [key, value] of Object.entries(contract.boundaries)) {
  if (key === 'githubActionsReadOnly') assert(value === true, `${key} must be true`)
  else assert(value === false, `${key} must remain false`)
}
for (const forbidden of ['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','wrangler','workers.dev','d1 execute','secret put','deploy --config']) {
  assert(!workflow.includes(forbidden), `production surface forbidden: ${forbidden}`)
}
for (const required of ['gh api','actions/runs?head_sha=','production-schema-retry','phase12a47-kick-history-v2-schema-apply-retry','actions/upload-artifact@v4']) {
  assert(workflow.includes(required), `missing read-only acceptance fragment: ${required}`)
}
console.log('12A-48 Kick History v2 schema retry acceptance contract verified')
