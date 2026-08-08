import fs from 'node:fs'

const PACKAGE_PATH = 'docs/audits/12a5-twitch-replacement-audit-final-execution-package-contract.json'
const TRIGGER_CONTRACT_PATH = 'docs/audits/12a5-twitch-replacement-audit-final-trigger-contract.json'
const SOURCE_PATH = 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json'
const WORKFLOW_PATH = '.github/workflows/analytics-12a5-twitch-replacement-audit-final.yml'
const TRIGGER_PATH = 'docs/audits/12a5-twitch-replacement-audit-final-trigger.json'

const json = (path) => JSON.parse(fs.readFileSync(path, 'utf8'))
const fail = (message) => { throw new Error(message) }

const pkg = json(PACKAGE_PATH)
const triggerContract = json(TRIGGER_CONTRACT_PATH)
const source = json(SOURCE_PATH)
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8')

if (!['ready_for_validation', 'accepted'].includes(pkg.status)) fail('final_package_status_invalid')
if (pkg.phase !== '12A-5B-R2' || pkg.trackingIssue !== 659 || pkg.provider !== 'twitch' || pkg.mode !== 'final') fail('final_package_identity_invalid')
if (source.status !== 'accepted_active') fail('source_audit_package_not_active')
if (pkg.window.semantics !== source.window.semantics
  || pkg.window.startAt !== source.window.startAt
  || pkg.window.endExclusiveAt !== source.window.endExclusiveAt
  || Number(pkg.window.expectedSlots) !== Number(source.window.expectedFinalSlots)
  || Number(pkg.window.cadenceMinutes) !== Number(source.window.cadenceMinutes)) fail('final_window_identity_mismatch')
if (pkg.window.startAt !== '2026-07-31T17:00:00.000Z' || pkg.window.endExclusiveAt !== '2026-08-07T17:00:00.000Z' || Number(pkg.window.expectedSlots) !== 2016) fail('accepted_final_window_changed')
if (source.modes?.final?.requiresExactFullWindow !== true || source.modes?.final?.authorizesPublicCutover !== false) fail('source_final_mode_boundary_invalid')
if (pkg.execution.runner !== 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs') fail('runner_identity_changed')
if (pkg.execution.exactOneFileTriggerRequired !== true || pkg.execution.separateAcceptancePrRequired !== true) fail('execution_governance_incomplete')
if (pkg.execution.productionCredentialsUsedOnPackagePullRequest !== false || pkg.execution.productionExecutionOnPackagePullRequest !== false) fail('package_pr_production_boundary_invalid')
for (const [key, value] of Object.entries(pkg.readOnlyBoundary)) {
  if (Array.isArray(value)) continue
  if (value !== false) fail(`read_only_boundary_${key}_invalid`)
}
if (pkg.acceptanceBoundary.passingFinalAuditExposesUi !== false
  || pkg.acceptanceBoundary.separateEvidenceAcceptancePrRequired !== true
  || pkg.acceptanceBoundary.separateFinalModeDecisionRequired !== true
  || pkg.acceptanceBoundary.separatePublicCutoverPrRequired !== true
  || pkg.acceptanceBoundary.temporaryExecutionPathRetirementRequired !== true) fail('acceptance_boundary_invalid')
if (!['candidate', 'accepted'].includes(triggerContract.status)) fail('trigger_contract_status_invalid')
if (triggerContract.provider !== 'twitch' || triggerContract.mode !== 'final') fail('trigger_contract_identity_invalid')
if (triggerContract.trigger.path !== TRIGGER_PATH
  || triggerContract.trigger.schemaVersion !== 'viewloom-12a5-twitch-replacement-audit-final-trigger-v1'
  || triggerContract.trigger.status !== 'armed'
  || triggerContract.trigger.provider !== 'twitch'
  || triggerContract.trigger.mode !== 'final'
  || triggerContract.trigger.oneTime !== true
  || triggerContract.trigger.executeNotBefore !== pkg.window.endExclusiveAt) fail('trigger_shape_invalid')
if (fs.existsSync(TRIGGER_PATH)) fail('final_trigger_must_be_absent_from_package')

for (const fragment of [
  'AUDIT_MODE=final node scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  "github.event_name == 'push'",
  'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
  'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  'if: always()',
  'analytics-12a5-twitch-replacement-audit-final',
]) {
  if (!workflow.includes(fragment)) fail(`workflow_missing:${fragment}`)
}
for (const forbidden of ['wrangler deploy', 'wrangler publish', 'd1 migrations apply', 'INSERT INTO', 'UPDATE ', 'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE']) {
  if (workflow.includes(forbidden)) fail(`workflow_forbidden_mutation:${forbidden}`)
}

console.log(JSON.stringify({
  status: 'pass',
  packageStatus: pkg.status,
  triggerContractStatus: triggerContract.status,
  window: pkg.window,
  productionTriggerPresent: false,
  readOnly: true,
  publicExposureAuthorized: false,
}, null, 2))
