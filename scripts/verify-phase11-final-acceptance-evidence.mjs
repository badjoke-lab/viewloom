import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-final-acceptance/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-final-acceptance-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11G')
assert.equal(evidence.state, 'pre-merge-pass')
for (const [name, result] of Object.entries(evidence.checks)) {
  assert.equal(result, true, `Phase 11 final acceptance check failed: ${name}`)
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
assert.equal(evidence.hostedProductionCloseout.status, 'pending-main-merge')
assert.equal(evidence.hostedProductionCloseout.owner, '.github/workflows/production-smoke.yml')
assert.equal(evidence.hostedProductionCloseout.requiredEvidenceSchema, 'viewloom-phase11-monitoring-evidence-v1')

console.log('Phase 11 final pre-merge acceptance evidence verification passed.')
console.log('- P11A strict-null remediation: complete')
console.log('- P11B CI cancellation remediation and overlap classification: complete')
console.log('- P11C monitoring contract: complete')
console.log('- P11D escalation runbook: present')
console.log('- P11E maintenance cadence: present')
console.log('- P11F public acceptance ownership: complete')
console.log('- hosted production closeout remains required after main merge')
