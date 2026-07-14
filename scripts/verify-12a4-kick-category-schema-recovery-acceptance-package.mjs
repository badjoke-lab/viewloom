import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-kick-category-schema-recovery-acceptance-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-kick-category-schema-recovery-acceptance.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-schema-recovery-acceptance-contract-v1')
assert.equal(contract.status, 'acceptance_package_ready')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.packagePr, 541)
assert.equal(contract.triggerPr, 542)
assert.equal(contract.triggerMergeSha, '27a143c83c134599bf1d92d61786fce86f4e76ba')
assert.equal(contract.sourceWorkflowFile, 'analytics-12a4-kick-category-schema-recovery.yml')
assert.equal(contract.sourceArtifactName, 'phase12a4-kick-category-schema-recovery')
assert.deepEqual(contract.requiredJobs, ['contract', 'production-kick-recovery'])
assert.equal(contract.requiredEvidence.schemaVersion, 'viewloom-12a4-kick-category-schema-recovery-evidence-v1')
assert.equal(contract.requiredEvidence.event, 'push')
assert.equal(contract.requiredEvidence.kickRecoveryPass, true)
assert.equal(contract.requiredEvidence.targetProvider, 'kick')
assert.equal(contract.requiredEvidence.twitchExecutionIncluded, false)
assert.equal(contract.requiredEvidence.twitchSchemaApplyAuthorized, false)
assert.equal(contract.requiredEvidence.categoryRuntimeEnablementAuthorized, false)
assert.equal(Object.values(contract.boundaries).every((value) => value === false), true)

for (const text of [
  "github.head_ref == 'accept-analytics-12a4-kick-category-schema-recovery-v2'",
  contract.triggerMergeSha,
  contract.sourceWorkflowFile,
  contract.sourceArtifactName,
  'event=push',
  'actions/artifacts/$artifact_id/zip',
  'verify-12a4-kick-category-schema-recovery-evidence.mjs',
  'production-kick-recovery',
]) assert.ok(workflow.includes(text), `workflow missing: ${text}`)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('wrangler deploy'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)

console.log(JSON.stringify({
  ok: true,
  triggerPr: contract.triggerPr,
  triggerMergeSha: contract.triggerMergeSha,
  productionExecutionByAcceptance: false,
}, null, 2))
