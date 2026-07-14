import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-readonly-preflight-acceptance-contract.json'))
const workflow = read('.github/workflows/analytics-12a4-category-readonly-preflight-acceptance.yml')

const failures = []
const check = (condition, label) => {
  if (!condition) failures.push(label)
}

check(contract.schemaVersion === 'viewloom-12a4-category-readonly-preflight-acceptance-contract-v1', 'contract schemaVersion')
check(contract.planningPr === 520, 'planning PR')
check(contract.packagePr === 521, 'package PR')
check(contract.triggerPr === 522, 'trigger PR')
check(contract.triggerMergeSha === '2e1e3ea3e338574840cb69182581505bcb6eacff', 'trigger merge SHA')
check(contract.workflowFile === 'analytics-12a4-category-readonly-preflight.yml', 'source workflow file')
check(contract.artifactName === 'phase12a4-category-readonly-preflight', 'source artifact name')
check(contract.requiredEvidence.event === 'push', 'push evidence required')
check(contract.requiredEvidence.readOnlyPreflightPass === true, 'preflight pass required')
check(contract.requiredEvidence.rowsWrittenMax === 0, 'zero rows-written threshold')
check(contract.requiredEvidence.changesMax === 0, 'zero changes threshold')
check(Object.values(contract.boundaries).every((value) => value === false), 'all acceptance boundaries false')

check(workflow.includes("github.head_ref == 'accept-analytics-12a4-category-readonly-preflight'"), 'acceptance branch gate')
check(workflow.includes('event=push'), 'exact push run lookup')
check(workflow.includes(contract.triggerMergeSha), 'trigger SHA pin')
check(workflow.includes(contract.workflowFile), 'source workflow lookup')
check(workflow.includes(contract.artifactName), 'source artifact lookup')
check(workflow.includes('actions/artifacts/$artifact_id/zip'), 'artifact download')
check(workflow.includes('verify-12a4-category-readonly-preflight-evidence.mjs'), 'evidence verifier')
check(!workflow.includes('CLOUDFLARE_API_TOKEN'), 'no Cloudflare API token')
check(!workflow.includes('wrangler deploy'), 'no Worker deployment')
check(!workflow.includes('wrangler d1 execute'), 'no D1 execute')
check(!workflow.includes('CATEGORY_CAPTURE_ENABLED'), 'no category enable flag')

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({ ok: true, triggerMergeSha: contract.triggerMergeSha, artifactName: contract.artifactName }, null, 2))
