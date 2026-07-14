import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-controlled-schema-apply-acceptance-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-controlled-schema-apply-acceptance.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-acceptance-contract-v1')
assert.equal(contract.status, 'acceptance_package_ready')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.designPr, 528)
assert.equal(contract.packagePr, 529)
assert.equal(contract.triggerPr, 530)
assert.equal(contract.triggerMergeSha, '2fb683405ba5e400cfb4197aad8c9535b6fdc0f2')
assert.equal(contract.sourceWorkflowFile, 'analytics-12a4-category-controlled-schema-apply-execution.yml')
assert.equal(contract.sourceArtifactName, 'phase12a4-category-controlled-schema-apply')
assert.deepEqual(contract.requiredJobs, ['contract', 'production-schema-apply'])
assert.equal(contract.requiredEvidence.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-evidence-v1')
assert.equal(contract.requiredEvidence.event, 'push')
assert.equal(contract.requiredEvidence.providerSeparated, true)
assert.equal(contract.requiredEvidence.twitchGatePass, true)
assert.equal(contract.requiredEvidence.kickGatePass, true)
assert.equal(contract.requiredEvidence.controlledSchemaApplyPass, true)
assert.equal(contract.requiredEvidence.categoryRuntimeEnablementAuthorized, false)
assert.equal(contract.requiredEvidence.boundedCategoryCostProbeAuthorizedByThisEvidence, false)
assert.equal(Object.values(contract.boundaries).every((value) => value === false), true)

for (const text of [
  "github.head_ref == 'accept-analytics-12a4-category-controlled-schema-apply'",
  'event=push',
  contract.triggerMergeSha,
  contract.sourceWorkflowFile,
  contract.sourceArtifactName,
  'actions/artifacts/$artifact_id/zip',
  'verify-12a4-category-controlled-schema-apply-evidence.mjs',
  'production-schema-apply',
]) assert.ok(workflow.includes(text), `workflow missing: ${text}`)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('wrangler deploy'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED'), false)

console.log(JSON.stringify({
  ok: true,
  triggerPr: contract.triggerPr,
  triggerMergeSha: contract.triggerMergeSha,
  sourceArtifactName: contract.sourceArtifactName,
  productionExecutionByAcceptance: false,
}, null, 2))
