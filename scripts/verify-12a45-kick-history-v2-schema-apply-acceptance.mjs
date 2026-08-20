#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a45-kick-history-v2-schema-apply-acceptance-contract.json'
const workflowPath = '.github/workflows/analytics-12a45-kick-history-v2-schema-apply-acceptance.yml'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a45-kick-history-v2-schema-apply-acceptance-contract-v1', 'schema mismatch')
assert(contract.phase === '12A-45', 'phase mismatch')
assert(contract.issue === 934, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.status === 'awaiting_read_only_github_evidence', 'status mismatch')
assert(contract.productionTrigger.pr === 933, 'trigger PR mismatch')
assert(contract.productionTrigger.triggerHeadSha === 'dfef01fef5511052225d79ea0b0847228a611eee', 'trigger head mismatch')
assert(contract.productionTrigger.mergeSha === '1c02df8525e579cea8dd0008a6003ec3d575b61a', 'merge SHA mismatch')
assert(contract.productionTrigger.workflowName === 'Analytics 12A43 Kick History V2 Schema Apply Package', 'workflow name mismatch')
assert(contract.productionTrigger.artifactName === 'phase12a43-kick-history-v2-schema-apply', 'artifact name mismatch')
assert(contract.requiredEvidence.firstApplyStatementCount === 5, 'first statement count mismatch')
assert(contract.requiredEvidence.secondApplyStatementCount === 0, 'second statement count mismatch')
assert(contract.requiredEvidence.maxDatabaseSizeDeltaBytes === 5242880, 'size delta cap mismatch')

for (const [key, value] of Object.entries(contract.boundaries)) {
  if (key === 'githubActionsReadOnly') assert(value === true, `${key} must be true`)
  else assert(value === false, `${key} must remain false`)
}

for (const forbidden of [
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler',
  'workers.dev',
  'd1 execute',
  'secret put',
  'deploy --config',
]) {
  assert(!workflow.includes(forbidden), `production surface forbidden in acceptance workflow: ${forbidden}`)
}
assert(workflow.includes('gh api'), 'GitHub API evidence read required')
assert(workflow.includes('actions/runs?head_sha='), 'exact head run lookup missing')
assert(workflow.includes('production-schema-apply'), 'production job verification missing')
assert(workflow.includes('phase12a43-kick-history-v2-schema-apply'), 'source artifact verification missing')
assert(workflow.includes('actions/upload-artifact@v4'), 'acceptance artifact upload missing')

console.log('12A-45 Kick History v2 schema apply acceptance contract verified')
