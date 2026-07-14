import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-schema-recovery-audit-acceptance-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-schema-recovery-audit-acceptance.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-schema-recovery-audit-acceptance-contract-v1')
assert.equal(contract.status, 'acceptance_package_ready')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.packagePr, 535)
assert.equal(contract.triggerPr, 544)
assert.equal(contract.triggerMergeSha, '867d2746a83be84b97a102cc86e011e5df055e05')
assert.equal(contract.sourceWorkflowFile, 'analytics-12a4-category-schema-recovery-audit.yml')
assert.equal(contract.sourceArtifactName, 'phase12a4-category-schema-recovery-audit')
assert.deepEqual(contract.requiredJobs, ['contract', 'production-recovery-audit'])
assert.equal(contract.requiredEvidence.schemaVersion, 'viewloom-12a4-category-schema-recovery-audit-evidence-v1')
assert.equal(contract.requiredEvidence.event, 'push')
assert.equal(contract.requiredEvidence.recoveryAuditPass, true)
assert.equal(contract.requiredEvidence.providerStatesKnown, true)
assert.equal(contract.requiredEvidence.twitchSchemaState, 'complete')
assert.equal(contract.requiredEvidence.kickSchemaState, 'complete')
assert.equal(contract.requiredEvidence.remoteSchemaApplyAuthorized, false)
assert.equal(contract.requiredEvidence.categoryRuntimeEnablementAuthorized, false)
assert.equal(Object.values(contract.boundaries).every((value) => value === false), true)

for (const text of [
  "github.head_ref == 'accept-analytics-12a4-category-schema-postapply-audit'",
  contract.triggerMergeSha,
  contract.sourceWorkflowFile,
  contract.sourceArtifactName,
  'event=push',
  'actions/artifacts/$artifact_id/zip',
  'verify-12a4-category-schema-recovery-audit-evidence.mjs',
  'production-recovery-audit',
  "providers.twitch.schemaState == 'complete'",
  "providers.kick.schemaState == 'complete'",
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
