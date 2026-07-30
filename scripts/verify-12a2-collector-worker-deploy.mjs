#!/usr/bin/env node

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const workflow = readFileSync('.github/workflows/deploy-collector-workers.yml', 'utf8')
const planner = readFileSync('scripts/plan-collector-worker-deploy.mjs', 'utf8')
const contract = JSON.parse(readFileSync('docs/audits/12a2-collector-worker-deploy-contract.json', 'utf8'))
const evidence = JSON.parse(readFileSync('docs/audits/12a2-collector-worker-deploy-evidence.json', 'utf8'))
const gate = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))
const normalTwitch = readFileSync('workers/collector-twitch/wrangler.toml', 'utf8')
const permanentTwitch = readFileSync('workers/collector-twitch/wrangler.category-permanent.toml', 'utf8')
const normalKick = readFileSync('workers/collector-kick/wrangler.toml', 'utf8')
const permanentKick = readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

assert.equal(contract.schemaVersion, 'viewloom-12a2-collector-worker-deploy-contract-v3')
assert.equal(contract.status, 'accepted_provider_scoped_planning')
assert.equal(contract.workflow, '.github/workflows/deploy-collector-workers.yml')
assert.equal(contract.planner, 'scripts/plan-collector-worker-deploy.mjs')
assert.equal(contract.deploymentMethod, 'wrangler@4 CLI')
assert.equal(contract.wranglerVersion, '4')
assert.deepEqual(contract.secrets, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'])
assert.equal(contract.triggers.pullRequestVerificationOnly, true)
assert.equal(contract.triggers.mainPushDeploy, true)
assert.equal(contract.triggers.manualProviderSelectionRequired, true)
assert.equal(contract.triggers.pullRequestDeploy, false)
assert.equal(contract.triggers.workflowOnlyPushDeploy, false)
assert.equal(contract.permissions.contents, 'read')
assert.equal(contract.planning.providerScopedChangedPaths, true)
assert.equal(contract.planning.twitchChangeDeploysKick, false)
assert.equal(contract.planning.kickChangeDeploysTwitch, false)
assert.equal(contract.planning.canonicalActiveConfigSelection, true)
assert.equal(contract.providers.twitch.normalConfig, 'workers/collector-twitch/wrangler.toml')
assert.equal(contract.providers.twitch.permanentConfig, 'workers/collector-twitch/wrangler.category-permanent.toml')
assert.equal(contract.providers.kick.normalConfig, 'workers/collector-kick/wrangler.toml')
assert.equal(contract.providers.kick.permanentConfig, 'workers/collector-kick/wrangler.category-permanent.toml')
assert.equal(contract.regression.status, 'confirmed_and_blocked_by_v3')
assert.equal(contract.regression.incidentIssue, 652)
assert.equal(contract.regression.workflowRunId, 30003576549)
assert.equal(contract.regression.twitchDeployJobId, 89194219805)

assert.equal(evidence.status, 'accepted')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.deployment.providerSeparated, true)
assert.equal(evidence.remoteSchema.twitch.schemaComplete, true)
assert.equal(evidence.remoteSchema.kick.schemaComplete, true)
assert.equal(evidence.boundary.directD1ExecuteUsed, false)
assert.equal(evidence.boundary.backfillPerformed, false)

for (const fragment of [
  'name: Deploy Collector Workers',
  'provider:',
  'Plan provider-scoped deployment',
  'node scripts/plan-collector-worker-deploy.mjs',
  "if: needs.plan.outputs.deploy_twitch == 'true'",
  "if: needs.plan.outputs.deploy_kick == 'true'",
  'wrangler deploy --config "$TWITCH_CONFIG"',
  'wrangler deploy --config "$KICK_CONFIG"',
  'needs.plan.outputs.any_deploy',
  'contents: read',
  'pnpm check:collectors',
  'node scripts/collect-12a2-remote-schema-production-evidence.mjs',
  'node scripts/verify-12a2-remote-schema-production-evidence.mjs',
]) assert.ok(workflow.includes(fragment), `deployment workflow missing: ${fragment}`)

for (const fragment of [
  "value.startsWith('workers/shared/')",
  "value.startsWith('workers/collector-twitch/')",
  "value.startsWith('workers/collector-kick/')",
  'twitchPermanentRuntimeCaptureActive',
  'kickPermanentRuntimeCaptureActive',
  'wrangler.category-permanent.toml',
  'cross_provider_deploy_plan',
]) assert.ok(planner.includes(fragment), `deployment planner missing: ${fragment}`)

assert.equal(workflow.includes('pull_request_target:'), false)
assert.equal(workflow.includes('contents: write'), false)
assert.equal(workflow.includes('wrangler d1 execute'), false)
assert.equal(workflow.includes('pages deploy'), false)
assert.equal(workflow.includes('cd workers/collector-twitch\n          wrangler deploy'), false)
assert.equal(workflow.includes('cd workers/collector-kick\n          wrangler deploy'), false)

assert.match(normalTwitch, /^name = "viewloom-collector-twitch"$/m)
assert.match(normalTwitch, /binding = "DB_TWITCH_HOT"/)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalTwitch), false)
assert.match(permanentTwitch, /^CATEGORY_CAPTURE_ENABLED = "true"$/m)
assert.match(normalKick, /^name = "viewloom-collector-kick"$/m)
assert.match(normalKick, /binding = "DB_KICK_HOT"/)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalKick), false)
assert.match(permanentKick, /^CATEGORY_CAPTURE_ENABLED = "true"$/m)
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, true)

const temp = mkdtempSync(path.join(os.tmpdir(), 'viewloom-deploy-plan-'))
try {
  const prOutput = path.join(temp, 'pr-output')
  const pr = spawnSync(process.execPath, ['scripts/plan-collector-worker-deploy.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: 'pull_request', GITHUB_OUTPUT: prOutput },
  })
  assert.equal(pr.status, 0, pr.stderr || pr.stdout)
  const prValues = readFileSync(prOutput, 'utf8')
  assert.ok(prValues.includes('deploy_twitch=false'))
  assert.ok(prValues.includes('deploy_kick=false'))
  assert.ok(prValues.includes('any_deploy=false'))

  const manualOutput = path.join(temp, 'manual-output')
  const manual = spawnSync(process.execPath, ['scripts/plan-collector-worker-deploy.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_EVENT_NAME: 'workflow_dispatch', DEPLOY_PROVIDER: 'twitch', GITHUB_OUTPUT: manualOutput },
  })
  assert.equal(manual.status, 0, manual.stderr || manual.stdout)
  const manualValues = readFileSync(manualOutput, 'utf8')
  assert.ok(manualValues.includes('deploy_twitch=true'))
  assert.ok(manualValues.includes('deploy_kick=false'))
  assert.ok(manualValues.includes('twitch_config=workers/collector-twitch/wrangler.category-permanent.toml'))
} finally {
  rmSync(temp, { recursive: true, force: true })
}

console.log(JSON.stringify({
  ok: true,
  contract: contract.schemaVersion,
  providerScoped: true,
  pullRequestDeploy: false,
  twitchCanonicalConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickActiveConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
  regressionBlocked: true,
}, null, 2))
