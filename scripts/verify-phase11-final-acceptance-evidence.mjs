import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-final-acceptance/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-final-acceptance-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11G')
assert.equal(evidence.state, 'production-closeout-complete')
for (const [name, result] of Object.entries(evidence.checks)) {
  assert.equal(result, true, `Phase 11 retained acceptance check failed: ${name}`)
}

assert.equal(evidence.boundaries.providerSeparationRequired, true)
assert.equal(evidence.boundaries.providerCombinationAuthorized, false)
assert.equal(evidence.boundaries.newApiAuthorized, false)
assert.equal(evidence.boundaries.newD1SchemaAuthorized, false)
assert.equal(evidence.boundaries.newCollectorAuthorized, false)
assert.equal(evidence.boundaries.newApplicationCronAuthorized, false)
assert.equal(evidence.boundaries.newCollectorCronAuthorized, false)
assert.equal(evidence.boundaries.retentionChangeAuthorized, false)
assert.equal(evidence.hostedProductionCloseout.required, true)
assert.equal(evidence.hostedProductionCloseout.status, 'complete')
assert.equal(evidence.hostedProductionCloseout.owner, '.github/workflows/production-smoke.yml')
assert.equal(evidence.hostedProductionCloseout.requiredEvidenceSchema, 'viewloom-phase11-monitoring-evidence-v1')
assert.equal(evidence.hostedProductionCloseout.closeoutRecord, 'docs/operations/phase11-production-closeout-2026-07-08.md')
assert.equal(evidence.hostedProductionCloseout.workflowRun, 28932232525)
assert.equal(evidence.hostedProductionCloseout.artifactId, 8163904094)
assert.equal(evidence.hostedProductionCloseout.expectedMainSha, '90fb2714137cc83e6f20e44415574a5e35a98439')
assert.equal(evidence.hostedProductionCloseout.deployedSha, '90fb2714137cc83e6f20e44415574a5e35a98439')
assert.equal(evidence.hostedProductionCloseout.blockingAlerts, 0)

console.log('Phase 11 retained final acceptance evidence verification passed.')
console.log('- P11A strict-null remediation: complete')
console.log('- P11B CI cancellation remediation and overlap classification: complete')
console.log('- P11C monitoring contract and hosted evidence: complete')
console.log('- P11D escalation runbook: present')
console.log('- P11E maintenance cadence: present')
console.log('- P11F public acceptance ownership: complete')
console.log('- P11G production closeout: complete')
