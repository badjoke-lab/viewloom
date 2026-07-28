import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-permanent-category-recovery-contract.json',
  incident: 'docs/audits/12a5-twitch-seven-day-accumulation-audit-rejection.json',
  deployContract: 'docs/audits/12a2-collector-worker-deploy-contract.json',
  workflow: '.github/workflows/analytics-12a5-twitch-permanent-category-recovery.yml',
  observer: 'scripts/run-12a4-twitch-permanent-category-observer.mjs',
  permanent: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normal: 'workers/collector-twitch/wrangler.toml',
  kickPermanent: 'workers/collector-kick/wrangler.category-permanent.toml',
  trigger: 'docs/audits/12a5-twitch-permanent-category-recovery-trigger.json',
}

for (const path of Object.values(files).filter((path) => path !== files.trigger)) assert.equal(existsSync(path), true, `${path}: missing`)
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const contract = json(files.contract)
const incident = json(files.incident)
const deployContract = json(files.deployContract)
const workflow = readFileSync(files.workflow, 'utf8')
const observer = readFileSync(files.observer, 'utf8')
const permanent = readFileSync(files.permanent, 'utf8')
const normal = readFileSync(files.normal, 'utf8')
const kickPermanent = readFileSync(files.kickPermanent, 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a5-twitch-permanent-category-recovery-v1')
assert.ok(['ready_for_dormant_package_validation', 'accepted'].includes(contract.status))
assert.equal(contract.trackingIssue, 652)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.acceptedComponents.collectorCron, '*/5 * * * *')
assert.equal(contract.workflow.packagePullRequestValidationOnly, true)
assert.equal(contract.workflow.packagePullRequestProductionDeployment, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.trigger.confirmation, 'RUN_TWITCH_PERMANENT_CATEGORY_RECOVERY')
assert.equal(contract.preflight.readOnly, true)
assert.deepEqual(contract.preflight.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.preflight.d1Statements, ['SELECT'])
assert.equal(contract.deployment.provider, 'twitch')
assert.equal(contract.deployment.kickConfigReferenced, false)
assert.equal(contract.verification.consecutiveCategorySnapshotsRequired, 2)
assert.equal(contract.rollback.automaticOnFailure, true)
assert.equal(contract.rollback.kickMustRemainUnchanged, true)
assert.equal(Object.values(contract.boundaries).every((value) => value === false), true)
assert.equal(contract.postRecovery.newSevenDayAuditRequired, true)
assert.equal(contract.postRecovery.publicCutoverAutomaticallyAuthorized, false)

assert.equal(incident.status, 'rejected_production_regression')
assert.equal(incident.regression.workflowRunId, 30003576549)
assert.equal(incident.regression.twitchDeployJobId, 89194219805)
assert.equal(incident.decision.recoveryRequired, true)
assert.equal(incident.decision.publicCutoverAuthorized, false)
assert.equal(deployContract.schemaVersion, 'viewloom-12a2-collector-worker-deploy-contract-v3')
assert.equal(deployContract.planning.kickChangeDeploysTwitch, false)
assert.equal(deployContract.planning.twitchChangeDeploysKick, false)
assert.equal(deployContract.planning.canonicalActiveConfigSelection, true)

for (const fragment of [
  'name: Analytics 12A5 Twitch Permanent Category Recovery',
  'contents: read',
  'Verify dormant recovery package',
  'Run fresh read-only Twitch recovery preflight',
  'Deploy only the Twitch permanent-category config',
  'Verify two consecutive Twitch category snapshots',
  'Restore normal Twitch configuration on recovery failure',
  'Verify normal Twitch recovery after rollback',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'workers/collector-twitch/wrangler.toml',
  'MODE=preflight',
  'MODE=observe',
  'MODE=rollback',
]) assert.ok(workflow.includes(fragment), `recovery workflow missing: ${fragment}`)

assert.equal(workflow.includes('workers/collector-kick/wrangler'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('contents: write'), false)
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('pull_request_target:'), false)
assert.equal(workflow.includes('git push'), false)

for (const fragment of [
  'process.env.MODE',
  "['preflight', 'observe', 'rollback']",
  "provider = 'twitch'",
  'category-source-v1',
]) assert.ok(observer.includes(fragment), `observer missing: ${fragment}`)

assert.match(permanent, /^name = "viewloom-collector-twitch"$/m)
assert.match(permanent, /^CATEGORY_CAPTURE_ENABLED = "true"$/m)
assert.match(permanent, /crons = \["\*\/5 \* \* \* \*"\]/)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.match(normal, /crons = \["\*\/5 \* \* \* \*"\]/)
assert.match(kickPermanent, /^CATEGORY_CAPTURE_ENABLED = "true"$/m)

if (contract.status === 'ready_for_dormant_package_validation') assert.equal(existsSync(files.trigger), false, 'package PR must not include the recovery trigger')
if (contract.status === 'accepted') {
  assert.equal(Number.isInteger(contract.acceptance?.packagePr), true)
  assert.match(String(contract.acceptance?.packageMergeSha ?? ''), /^[0-9a-f]{40}$/)
}

console.log(JSON.stringify({
  ok: true,
  provider: 'twitch',
  issue: 652,
  status: contract.status,
  productionDeploymentFromPackagePr: false,
  rollback: true,
  kickChanged: false,
  publicExposureAuthorized: false,
}, null, 2))
