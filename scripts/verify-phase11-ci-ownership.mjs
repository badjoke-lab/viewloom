import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/phase11-ci-ownership/ci-ownership.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-phase11-ci-ownership-v1')
assert.equal(evidence.phase, 'Phase 11')
assert.equal(evidence.workstream, 'P11B')
assert.equal(Array.isArray(evidence.workflows), true)
assert.ok(evidence.workflows.length > 0)
assert.equal(evidence.counts.workflows, evidence.workflows.length)
assert.equal(Array.isArray(evidence.missingLatestHeadCancellation), true)
assert.equal(Array.isArray(evidence.repeatedNamedSteps), true)
assert.equal(evidence.counts.workflowsMissingLatestHeadCancellation, evidence.missingLatestHeadCancellation.length)
assert.equal(evidence.counts.repeatedNamedSteps, evidence.repeatedNamedSteps.length)

for (const workflow of evidence.workflows) {
  assert.equal(typeof workflow.file, 'string')
  assert.equal(typeof workflow.name, 'string')
  assert.equal(typeof workflow.triggers.pullRequest, 'boolean')
  assert.equal(typeof workflow.concurrency.present, 'boolean')
  assert.equal(Array.isArray(workflow.stepNames), true)
}

console.log('Phase 11 CI ownership inventory verification passed.')
console.log(`- workflows: ${evidence.counts.workflows}`)
console.log(`- PR workflows: ${evidence.counts.pullRequestWorkflows}`)
console.log(`- missing latest-head cancellation: ${evidence.counts.workflowsMissingLatestHeadCancellation}`)
console.log(`- repeated named steps: ${evidence.counts.repeatedNamedSteps}`)
