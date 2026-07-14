import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const contract = JSON.parse(read('docs/audits/12a4-category-execution-cost-probe-contract.json'))
const gate = JSON.parse(read('docs/audits/12a2-current-gate-state.json'))
const evidence = JSON.parse(read('docs/audits/12a4-category-schema-recovery-audit-evidence.json'))
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe.yml')
const worker = read('workers/category-cost-probe/src/index.ts')
const twitch = read('workers/category-cost-probe/wrangler.twitch.toml')
const kick = read('workers/category-cost-probe/wrangler.kick.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v2')
assert.equal(contract.status, 'production_schema_accepted_bounded_probe_current')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedStartingPoint.postApplyAuditAcceptancePr, 545)
assert.equal(contract.acceptedStartingPoint.twitchCategorySchemaState, 'complete')
assert.equal(contract.acceptedStartingPoint.kickCategorySchemaState, 'complete')
assert.equal(contract.acceptedStartingPoint.productionCategoryCaptureEnabled, false)
assert.equal(contract.acceptedStartingPoint.productionCategoryRowsPresent, false)
assert.equal(contract.acceptedStartingPoint.schemaExecutionTriggersRetired, true)
assert.equal(contract.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(contract.acceptanceThresholds.dictionarySecondPassChangesMax, 0)
assert.equal(contract.acceptanceThresholds.probeCleanupRemainingRowsMax, 0)
assert.equal(contract.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(contract.currentDesign.productionExecutionIncluded, false)
assert.equal(contract.currentDesign.runtimeCaptureEnablementIncluded, false)
assert.equal(contract.planningPrBoundary.remoteSchemaApply, false)
assert.equal(contract.planningPrBoundary.productionCategoryCapture, false)
assert.equal(contract.planningPrBoundary.productionDeploymentJobIncluded, false)
assert.equal(contract.planningPrBoundary.cloudflareSecretsRequired, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v14')
assert.equal(gate.currentWorkstream.phase, '12A-4-5')
assert.equal(gate.categoryExecutionCostProbe.status, 'bounded_probe_design_current')
assert.equal(gate.categoryExecutionCostProbe.productionProbeAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.providers.twitch.schemaState, 'complete')
assert.equal(evidence.providers.kick.schemaState, 'complete')
assert.equal(evidence.gate.recoveryAuditPass, true)

assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(/wrangler\s+deploy(?!\s+--dry-run)/.test(workflow), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('push:'), false)
assert.equal(worker.includes('scheduled('), false)
assert.equal(worker.includes("mode: 'read_only_preflight'"), true)
assert.equal(worker.includes('productionRowsWrittenByWorker: false'), true)
assert.equal(worker.includes('payload_json'), false)

for (const [provider, config] of [['twitch', twitch], ['kick', kick]]) {
  assert.equal(config.includes(`PROVIDER = "${provider}"`), true)
  assert.equal(config.includes('CATEGORY_CAPTURE_ENABLED'), false)
  assert.equal(config.includes('REMOTE_SCHEMA_APPLY'), false)
  assert.equal(config.includes('[triggers]'), false)
}
assert.notEqual(twitch.match(/database_id = "([^"]+)"/)?.[1], kick.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  mode: 'bounded_probe_design_current',
  providerSchemas: { twitch: 'complete', kick: 'complete' },
  productionProbeAuthorized: false,
  productionCategoryCapture: false,
  providerSeparated: true,
}, null, 2))
