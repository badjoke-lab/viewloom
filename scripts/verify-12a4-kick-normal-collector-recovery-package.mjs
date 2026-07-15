import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-normal-collector-recovery-contract.json')
const trigger = json('docs/audits/12a4-kick-normal-collector-recovery-trigger.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const runner = read('scripts/run-12a4-kick-normal-collector-recovery.mjs')
const workflow = read('.github/workflows/analytics-12a4-kick-normal-collector-recovery.yml')
const scope = read('scripts/check-12a4-kick-normal-collector-recovery-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-normal-collector-recovery.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-normal-collector-recovery-v1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'kick')
assert.equal(contract.recovery.config, 'workers/collector-kick/wrangler.toml')
assert.equal(contract.recovery.service, 'viewloom-collector-kick')
assert.equal(contract.recovery.database, 'vl_kick_hot')
assert.equal(contract.recovery.expectedCron, '*/5 * * * *')
assert.equal(contract.recovery.deployNormalConfigOnly, true)
assert.equal(contract.recovery.manualCollect, false)
assert.equal(contract.recovery.pollIntervalSeconds, 30)
assert.equal(contract.recovery.pollAttempts, 20)
assert.equal(contract.recovery.freshnessMinutesMax, 10)
assert.equal(contract.recovery.requireSnapshotNewerThanPreDeploy, true)
assert.equal(contract.recovery.requireCanaryBindingsAbsentAfterDeploy, true)
assert.equal(contract.recovery.requirePermanentCategoryFlagAbsent, true)
assert.equal(Object.values(contract.hardBoundary).every((value) => value === false), true)
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.rawPayloadIncluded, false)
assert.equal(contract.evidence.channelIdentitiesIncluded, false)
assert.equal(contract.evidence.secretsIncluded, false)

assert.equal(trigger.schemaVersion, 'viewloom-12a4-kick-normal-collector-recovery-trigger-v1')
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, 'RECOVER_KICK_NORMAL_COLLECTOR')
assert.ok(Number.isSafeInteger(trigger.attempt) && trigger.attempt > 0)
const createdAt = new Date(trigger.createdAt)
const expiresAt = new Date(trigger.expiresAt)
assert.ok(Number.isFinite(createdAt.getTime()))
assert.ok(Number.isFinite(expiresAt.getTime()))
assert.ok(expiresAt.getTime() > createdAt.getTime())
assert.ok(expiresAt.getTime() > Date.now(), 'normal collector recovery trigger expired')

assert.match(normalConfig, /^name = "viewloom-collector-kick"$/m)
assert.match(normalConfig, /^main = "src\/entry.ts"$/m)
assert.ok(normalConfig.includes('crons = ["*/5 * * * *"]'))
assert.match(normalConfig, /^INTRADAY_GENERATION_ENABLED = "true"$/m)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(normalConfig), false)
assert.ok(normalConfig.includes('database_name = "vl_kick_hot"'))

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*push:/m)
assert.ok(workflow.includes("if: github.event_name == 'pull_request'"))
assert.ok(workflow.includes("if: github.event_name == 'push'"))
assert.ok(workflow.includes('node scripts/check-12a4-kick-normal-collector-recovery-scope.mjs'))
assert.ok(workflow.includes('node scripts/verify-12a4-kick-normal-collector-recovery-package.mjs'))
assert.ok(workflow.includes('node scripts/run-12a4-kick-normal-collector-recovery.mjs'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'))

assert.ok(runner.includes("['dlx', 'wrangler@4', 'deploy', '--config', NORMAL_CONFIG_PATH]"))
assert.equal((runner.match(/wrangler@4', 'deploy'/g) ?? []).length, 1)
assert.equal(runner.includes('wrangler.category-canary.toml'), false)
assert.equal(runner.includes('collector-twitch'), false)
assert.equal(runner.includes("'/collect'"), false)
assert.equal(runner.includes('CATEGORY_CAPTURE_ENABLED ='), false)
assert.ok(runner.includes('CATEGORY_TRIGGER_PATH'))
assert.ok(runner.includes('category_canary_trigger_still_present'))
assert.ok(runner.includes("['dlx', 'wrangler@4', 'd1', 'execute'"))
assert.ok(runner.includes("'--remote'"))
assert.ok(runner.includes('SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode'))
assert.ok(runner.includes('SELECT COUNT(*) AS provider_leakage_rows'))
for (const pattern of [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+[A-Za-z_]/i,
  /\bDELETE\s+FROM\b/i,
  /\bDROP\s+(?:TABLE|INDEX)\b/i,
  /\bALTER\s+TABLE\b/i,
  /\bCREATE\s+(?:TABLE|INDEX)\b/i,
  /\bREPLACE\s+INTO\b/i,
]) {
  assert.equal(pattern.test(runner), false, `recovery runner contains forbidden D1 mutation pattern: ${pattern}`)
}

assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(scope.includes('12a4-kick-category-capture-canary-trigger.json'))
assert.ok(doc.includes('does not:'))
assert.ok(doc.includes('start category capture'))
assert.ok(doc.includes('normal 5-minute cron'))

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  provider: contract.provider,
  attempt: trigger.attempt,
  triggerExpiresAt: trigger.expiresAt,
  normalCron: contract.recovery.expectedCron,
  productionActionOnPullRequest: false,
  productionActionOnPush: 'deploy canonical normal Kick config and verify a fresh cron snapshot',
  TwitchChanged: false,
  categoryCaptureStarted: false,
}, null, 2))
