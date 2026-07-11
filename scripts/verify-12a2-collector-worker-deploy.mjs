#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = readFileSync('.github/workflows/deploy-collector-workers.yml', 'utf8')
const contract = JSON.parse(readFileSync('docs/audits/12a2-collector-worker-deploy-contract.json', 'utf8'))
const evidence = JSON.parse(readFileSync('docs/audits/12a2-collector-worker-deploy-evidence.json', 'utf8'))
const twitchWrangler = readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const kickWrangler = readFileSync('workers/collector-kick/wrangler.toml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a2-collector-worker-deploy-contract-v2')
assert.equal(contract.workstream, '12A-2 collector Worker deployment evidence and remote schema verification')
assert.equal(contract.status, 'accepted')
assert.equal(contract.workflow, '.github/workflows/deploy-collector-workers.yml')
assert.equal(contract.deploymentMethod, 'wrangler@4 CLI')
assert.equal(contract.wranglerVersion, '4')
assert.deepEqual(contract.secrets, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'])
assert.equal(contract.triggers.pullRequestVerificationOnly, true)
assert.equal(contract.triggers.mainPushDeploy, true)
assert.equal(contract.triggers.manualDeploy, true)
assert.equal(contract.triggers.pullRequestDeploy, false)
assert.equal(contract.triggers.pullRequestTargetUsed, false)
assert.equal(contract.permissions.contents, 'read')
assert.equal(contract.providers.twitch.workingDirectory, 'workers/collector-twitch')
assert.equal(contract.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(contract.providers.kick.workingDirectory, 'workers/collector-kick')
assert.equal(contract.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(contract.verification.preDeployCollectorChecks, true)
assert.equal(contract.verification.preDeployMigrationParityCheck, true)
assert.equal(contract.verification.postDeploySchemaAuditPath, '/api/schema-audit')
assert.equal(contract.verification.pollIntervalSeconds, 30)
assert.equal(contract.verification.maximumPollAttempts, 30)
assert.equal(contract.verification.twitchRequiredObjects, 3)
assert.equal(contract.verification.kickRequiredObjects, 3)
assert.equal(contract.verification.rowsWrittenRequired, 0)
assert.equal(contract.verification.artifactName, 'phase12a2-collector-worker-deploy')
assert.equal(contract.acceptedEvidence.workflowRunId, 29158855070)
assert.equal(contract.acceptedEvidence.artifactId, 8250263833)
assert.equal(contract.acceptedEvidence.twitchDeployPass, true)
assert.equal(contract.acceptedEvidence.kickDeployPass, true)
assert.equal(contract.acceptedEvidence.remoteSchemaGatePass, true)
assert.equal(contract.scope.pagesDeployIncluded, false)
assert.equal(contract.scope.directD1ExecuteIncluded, false)
assert.equal(contract.scope.backfillIncluded, false)
assert.equal(contract.scope.generationIncluded, false)
assert.equal(contract.scope.retentionChanged, false)
assert.equal(contract.scope.newCronAdded, false)
assert.equal(contract.scope.categoryCaptureIncluded, false)
assert.equal(contract.scope.crossProviderAnalyticsIncluded, false)

assert.equal(evidence.schemaVersion, 'viewloom-12a2-collector-worker-deploy-evidence-v1')
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.deployment.method, 'wrangler@4 CLI')
assert.equal(evidence.deployment.secretValuesIncluded, false)
assert.equal(evidence.deployment.providerSeparated, true)
assert.equal(evidence.deployment.twitch.outcome, 'success')
assert.equal(evidence.deployment.twitch.exitCode, 0)
assert.equal(evidence.deployment.kick.outcome, 'success')
assert.equal(evidence.deployment.kick.exitCode, 0)
assert.equal(evidence.remoteSchema.twitch.schemaComplete, true)
assert.equal(evidence.remoteSchema.twitch.observedObjectCount, 3)
assert.equal(evidence.remoteSchema.twitch.rowsWritten, 0)
assert.equal(evidence.remoteSchema.kick.schemaComplete, true)
assert.equal(evidence.remoteSchema.kick.observedObjectCount, 3)
assert.equal(evidence.remoteSchema.kick.rowsWritten, 0)
assert.equal(evidence.gate.workerDeploymentEvidencePresent, true)
assert.equal(evidence.gate.remoteSchemaGatePass, true)
assert.equal(evidence.gate.accountAggregateMeasured, false)
assert.equal(evidence.gate.generationStorageGatePass, false)
assert.equal(evidence.gate.generationAuthorized, false)
assert.deepEqual(evidence.gate.remainingBlockers, ['account_aggregate_storage_unmeasured'])
assert.equal(evidence.boundary.directD1ExecuteUsed, false)
assert.equal(evidence.boundary.backfillPerformed, false)
assert.equal(evidence.boundary.rollupGenerationStarted, false)

for (const fragment of [
  'name: Deploy Collector Workers',
  'pull_request:',
  'push:',
  'workflow_dispatch:',
  'permissions:\n  contents: read',
  'cancel-in-progress: false',
  "if: github.event_name != 'pull_request'",
  'uses: actions/setup-node@v4',
  "node-version: '22'",
  'npm install --global wrangler@4',
  'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
  'CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
  'cd workers/collector-twitch',
  'cd workers/collector-kick',
  'wrangler deploy',
  'node scripts/verify-12a2-collector-worker-deploy.mjs',
  'node scripts/verify-12a2-controlled-remote-apply.mjs',
  'pnpm check:collectors',
  'node scripts/collect-12a2-remote-schema-production-evidence.mjs',
  'node scripts/verify-12a2-remote-schema-production-evidence.mjs',
  'for attempt in $(seq 1 30)',
  'sleep 30',
  'e.gate.remoteSchemaGatePass?0:1',
  'name: phase12a2-collector-worker-deploy',
]) assert.ok(workflow.includes(fragment), `deployment workflow missing: ${fragment}`)

assert.equal(workflow.includes('pull_request_target:'), false, 'pull_request_target must not be used')
assert.equal(workflow.includes('cloudflare/wrangler-action'), false, 'accepted permanent workflow must use direct Wrangler CLI')
assert.equal(workflow.includes('wrangler d1 execute'), false, 'direct D1 execute must not be used')
assert.equal(workflow.includes('pages deploy'), false, 'Pages deployment must not be included')
assert.equal(workflow.includes('contents: write'), false, 'workflow must not request contents write')
assert.equal(workflow.includes('echo "$CLOUDFLARE_API_TOKEN"'), false, 'API token must not be echoed')

const deployGuardCount = workflow.match(/if: github\.event_name != 'pull_request'/g)?.length ?? 0
assert.equal(deployGuardCount, 3, 'both deploy jobs and post-deploy verification must be guarded from PR execution')

assert.match(twitchWrangler, /^name = "viewloom-collector-twitch"$/m)
assert.match(twitchWrangler, /^main = "src\/entry\.ts"$/m)
assert.match(twitchWrangler, /binding = "DB_TWITCH_HOT"/)
assert.match(twitchWrangler, /database_name = "vl_twitch_hot"/)
assert.match(kickWrangler, /^name = "viewloom-collector-kick"$/m)
assert.match(kickWrangler, /^main = "src\/entry\.ts"$/m)
assert.match(kickWrangler, /binding = "DB_KICK_HOT"/)
assert.match(kickWrangler, /database_name = "vl_kick_hot"/)

console.log('12A-2 collector Worker deployment verification passed.')
console.log('- accepted deployment evidence uses direct Wrangler 4 CLI')
console.log('- pull requests run verification only')
console.log('- main push and manual dispatch may deploy')
console.log('- Twitch and Kick deploy through separate working directories')
console.log('- Cloudflare secrets are referenced but not printed')
console.log('- post-deploy schema gate polls for up to 15 minutes')
console.log('- remote schema gate is accepted at 3 / 3 for both providers')
console.log('- no direct D1 execute, Pages deploy, backfill, or generation')
