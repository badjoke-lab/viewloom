import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-normal-collector-recovery-contract.json')
const trigger = json('docs/audits/12a4-kick-normal-collector-recovery-trigger.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const workflow = read('.github/workflows/analytics-12a4-kick-normal-collector-recovery.yml')
const scope = read('scripts/check-12a4-kick-normal-collector-recovery-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-normal-collector-recovery.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-normal-collector-recovery-v1')
assert.equal(contract.status, 'completed')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'kick')
assert.equal(contract.recovery.config, 'workers/collector-kick/wrangler.toml')
assert.equal(contract.recovery.service, 'viewloom-collector-kick')
assert.equal(contract.recovery.database, 'vl_kick_hot')
assert.equal(contract.recovery.expectedCron, '*/5 * * * *')
assert.equal(contract.recovery.manualCollect, false)
assert.equal(contract.repair.pr, 576)
assert.equal(contract.repair.mergeSha, '4c0e9afeadda9c443d83594648cdf1ea7079cf00')
assert.equal(contract.repair.nestedOfficialChannelNormalization, true)
assert.equal(contract.repair.scheduledLifecycleLogging, true)
assert.equal(contract.repair.honestEmptyObservationFallback, true)
assert.equal(contract.completionEvidence.outcome, 'accepted')
assert.equal(contract.completionEvidence.firstAcceptedSnapshot.streamCount, 100)
assert.equal(contract.completionEvidence.secondAcceptedSnapshot.streamCount, 100)
assert.equal(contract.completionEvidence.firstAcceptedSnapshot.sourceMode, 'authenticated')
assert.equal(contract.completionEvidence.secondAcceptedSnapshot.sourceMode, 'authenticated')
assert.ok(new Date(contract.completionEvidence.secondAcceptedSnapshot.collectedAt).getTime()
  > new Date(contract.completionEvidence.firstAcceptedSnapshot.collectedAt).getTime())
assert.equal(contract.completionEvidence.boundedTail.scheduledEventsObserved, 5)
assert.equal(contract.completionEvidence.boundedTail.exceptionsObserved, 0)
assert.equal(contract.completionEvidence.providerLeakageRows, 0)
assert.equal(contract.completionEvidence.canaryBindingsAbsent, true)
assert.equal(contract.completionEvidence.permanentCategoryFlagAbsent, true)
assert.equal(Object.values(contract.hardBoundary).every((value) => value === false), true)

assert.equal(trigger.schemaVersion, 'viewloom-12a4-kick-normal-collector-recovery-trigger-v1')
assert.equal(trigger.status, 'retired')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.consumed, true)
assert.equal(trigger.attempt, 2)
assert.equal(trigger.repairPr, 576)
assert.equal(trigger.repairMergeSha, contract.repair.mergeSha)
assert.ok(Number.isFinite(new Date(trigger.retiredAt).getTime()))

assert.match(normalConfig, /^name = "viewloom-collector-kick"$/m)
assert.match(normalConfig, /^main = "src\/entry\.ts"$/m)
assert.ok(normalConfig.includes('crons = ["*/5 * * * *"]'))
assert.match(normalConfig, /^INTRADAY_GENERATION_ENABLED = "true"$/m)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(normalConfig), false)
assert.ok(normalConfig.includes('database_name = "vl_kick_hot"'))

assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(workflow.includes('recover-normal-kick-collector:'), false)
assert.equal(workflow.includes('run-12a4-kick-normal-collector-recovery.mjs'), false)
assert.ok(workflow.includes('node scripts/check-12a4-kick-normal-collector-recovery-scope.mjs'))
assert.ok(workflow.includes('node scripts/verify-12a4-kick-normal-collector-recovery-package.mjs'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run'))

assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(scope.includes('12a4-kick-category-capture-canary-trigger.json'))
assert.ok(doc.includes('Recovery completed'))
assert.ok(doc.includes('one-time recovery workflow is retired'))

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  provider: contract.provider,
  status: contract.status,
  repairPr: contract.repair.pr,
  firstAcceptedSnapshot: contract.completionEvidence.firstAcceptedSnapshot.bucketMinute,
  secondAcceptedSnapshot: contract.completionEvidence.secondAcceptedSnapshot.bucketMinute,
  scheduledEventsObserved: contract.completionEvidence.boundedTail.scheduledEventsObserved,
  productionRecoveryPathRetired: true,
  TwitchChanged: false,
  categoryCaptureStarted: false
}, null, 2))
