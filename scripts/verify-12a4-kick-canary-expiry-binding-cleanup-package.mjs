import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(file)

const contract = json('docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const categoryTrigger = json('docs/audits/12a4-kick-category-capture-canary-trigger.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml')
const runner = read('scripts/run-12a4-kick-canary-expiry-binding-cleanup.mjs')
const note = read('docs/work-in-progress/phase12a4-kick-canary-expiry-binding-cleanup.md')
const cleanupTriggerPath = contract.trigger.path

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-canary-expiry-binding-cleanup-v1')
assert.equal(contract.status, 'prepared')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.rejectedAcceptanceEvidence.workflowRunId, 29488056134)
assert.equal(contract.rejectedAcceptanceEvidence.workflowJobId, 87810458773)
assert.equal(contract.rejectedAcceptanceEvidence.artifactId, 8398761959)
assert.equal(contract.rejectedAcceptanceEvidence.onlyFailedGate, 'canaryBindingsAbsent')
assert.equal(contract.rejectedAcceptanceEvidence.normalSnapshotAuthenticated, true)
assert.equal(contract.rejectedAcceptanceEvidence.normalSnapshotNonempty, true)
assert.equal(contract.rejectedAcceptanceEvidence.categoryPayloadRowsAfterGrace, 0)
assert.equal(contract.rejectedAcceptanceEvidence.providerLeakageRows, 0)
assert.equal(contract.cleanup.deployNormalConfigOnly, true)
assert.equal(contract.cleanup.manualCollect, false)
assert.equal(Object.values(contract.hardBoundary).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v18')
assert.equal(gate.currentWorkstream.phase, '12A-4-11')
assert.equal(gate.currentWorkstream.finalRollbackPending, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickFinalEvidence, true)

assert.equal(categoryTrigger.status, 'armed')
assert.equal(categoryTrigger.provider, 'kick')
assert.equal(categoryTrigger.attempt, 3)
assert.equal(categoryTrigger.startAt, contract.acceptedCanaryIdentity.startAt)
assert.equal(categoryTrigger.until, contract.acceptedCanaryIdentity.until)
assert.ok(new Date(categoryTrigger.until).getTime() <= Date.now(), 'attempt-3 trigger must be expired before cleanup')

assert.ok(normalConfig.includes(`crons = ["${contract.cleanup.expectedCron}"]`))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)

for (const fragment of [
  "push:",
  cleanupTriggerPath,
  "github.event_name == 'push'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'run-12a4-kick-canary-expiry-binding-cleanup.mjs',
  'workers/collector-kick/wrangler.toml',
]) assert.ok(workflow.includes(fragment), `workflow missing ${fragment}`)
assert.equal(workflow.includes('workers/collector-twitch/wrangler.toml'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

for (const fragment of [
  "const CLEANUP_TRIGGER_PATH = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json'",
  "const CATEGORY_TRIGGER_PATH = 'docs/audits/12a4-kick-category-capture-canary-trigger.json'",
  "spawnSync('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', normalConfigPath]",
  'bindingsMatchTrigger',
  'canaryBindingsAbsent',
  'category_payload_rows_after_grace',
  'provider_leakage_rows',
  'snapshotAuthenticatedPass',
  'snapshotNonemptyPass',
  'productionPermanentEnablementAuthorized: false',
]) assert.ok(runner.includes(fragment), `runner missing ${fragment}`)
assert.equal(runner.includes('wrangler.category-canary.toml'), false)
assert.equal(runner.includes('manualCollect'), true)
assert.equal(runner.includes('workers/collector-twitch'), false)

for (const fragment of [
  'Prepared. No production action occurs from this package pull request.',
  '`canaryBindingsAbsent`: false',
  'normal Kick configuration is the only deployed configuration',
  'Twitch remains blocked throughout this sequence.',
]) assert.ok(note.includes(fragment), `working note missing ${fragment}`)

if (exists(cleanupTriggerPath)) {
  const trigger = json(cleanupTriggerPath)
  const createdAt = new Date(trigger.createdAt).getTime()
  const expiresAt = new Date(trigger.expiresAt).getTime()
  assert.equal(trigger.schemaVersion, contract.trigger.schemaVersion)
  assert.equal(trigger.status, 'armed')
  assert.equal(trigger.provider, 'kick')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.confirmation, contract.trigger.confirmation)
  assert.equal(trigger.attempt, 1)
  assert.equal(trigger.sourceWorkflowRunId, contract.rejectedAcceptanceEvidence.workflowRunId)
  assert.equal(trigger.sourceWorkflowJobId, contract.rejectedAcceptanceEvidence.workflowJobId)
  assert.equal(trigger.sourceArtifactId, contract.rejectedAcceptanceEvidence.artifactId)
  assert.equal(trigger.categoryCanaryAttempt, 3)
  assert.ok(Number.isFinite(createdAt))
  assert.ok(Number.isFinite(expiresAt))
  assert.ok(expiresAt > Date.now())
  assert.ok(expiresAt > createdAt)
}

console.log(JSON.stringify({
  ok: true,
  packageStatus: contract.status,
  rejectedArtifactId: contract.rejectedAcceptanceEvidence.artifactId,
  onlyFailedGate: contract.rejectedAcceptanceEvidence.onlyFailedGate,
  cleanupTriggerPresent: exists(cleanupTriggerPath),
  normalConfigOnly: true,
  twitchChanged: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
