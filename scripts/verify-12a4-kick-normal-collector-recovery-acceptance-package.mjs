import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-kick-normal-collector-recovery-acceptance-contract.json')
const normalConfig = read('workers/collector-kick/wrangler.toml')
const runner = read('scripts/run-12a4-kick-normal-collector-recovery-acceptance.mjs')
const runAudit = read('scripts/run-12a4-kick-normal-collector-recovery-run-audit.mjs')
const cloudflareAudit = read('scripts/run-12a4-kick-normal-collector-cloudflare-audit.mjs')
const workflow = read('.github/workflows/analytics-12a4-kick-normal-collector-recovery-acceptance.yml')
const scope = read('scripts/check-12a4-kick-normal-collector-recovery-acceptance-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-normal-collector-recovery-acceptance.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-normal-collector-recovery-acceptance-v1')
assert.equal(contract.workstream, '12A-4 Kick normal collector recovery read-only acceptance')
assert.equal(contract.status, 'candidate')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'kick')
assert.equal(contract.recoveryPackagePr, 573)
assert.equal(contract.recoveryPackageMergeSha, '9323606d337f1930ce65a96465c104848b61c925')
assert.equal(contract.recoveryExecutionPr, 575)
assert.equal(contract.recoveryExecutionMergeSha, 'd686008a5e3be177def4f787f89ef966a5a60165')
assert.equal(contract.recoveryAttempt, 2)
assert.equal(contract.incidentSnapshot.bucketMinute, '2026-07-15T11:50:00.000Z')
assert.equal(contract.incidentSnapshot.collectedAt, '2026-07-15T11:50:40.703Z')
assert.equal(contract.acceptance.freshnessMinutesMax, 10)
assert.equal(contract.acceptance.pollIntervalSeconds, 30)
assert.equal(contract.acceptance.pollAttempts, 20)
assert.equal(contract.acceptance.requireSnapshotNewerThanIncident, true)
assert.equal(contract.acceptance.requireCanaryBindingsAbsent, true)
assert.equal(contract.acceptance.requirePermanentCategoryFlagAbsent, true)
assert.equal(contract.acceptance.maximumProviderLeakageRows, 0)
assert.equal(contract.acceptance.requireCategoryCanaryTriggerAbsent, true)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(Object.values(contract.readOnlyBoundary).filter((value) => typeof value === 'boolean').every((value) => value === false), true)
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.rawPayloadIncluded, false)
assert.equal(contract.evidence.channelIdentitiesIncluded, false)
assert.equal(contract.evidence.secretsIncluded, false)

assert.match(normalConfig, /^name = "viewloom-collector-kick"$/m)
assert.match(normalConfig, /^main = "src\/entry.ts"$/m)
assert.ok(normalConfig.includes('crons = ["*/5 * * * *"]'))
assert.match(normalConfig, /^INTRADAY_GENERATION_ENABLED = "true"$/m)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(normalConfig), false)
assert.ok(normalConfig.includes('database_name = "vl_kick_hot"'))
assert.equal(existsSync('docs/audits/12a4-kick-category-capture-canary-trigger.json'), false)

assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(/^\s*workflow_dispatch:/m.test(workflow), false)
assert.ok(workflow.includes('actions: read'))
assert.ok(workflow.includes('node scripts/check-12a4-kick-normal-collector-recovery-acceptance-scope.mjs'))
assert.ok(workflow.includes('node scripts/verify-12a4-kick-normal-collector-recovery-acceptance-package.mjs'))
assert.ok(workflow.includes('node scripts/run-12a4-kick-normal-collector-recovery-acceptance.mjs'))
assert.ok(workflow.includes('node scripts/run-12a4-kick-normal-collector-recovery-run-audit.mjs'))
assert.ok(workflow.includes('node scripts/run-12a4-kick-normal-collector-cloudflare-audit.mjs'))
assert.ok(workflow.includes("RECOVERY_WORKFLOW_ID: '313764036'"))
assert.ok(workflow.includes('RECOVERY_EXECUTION_SHA: d686008a5e3be177def4f787f89ef966a5a60165'))
assert.ok(workflow.includes('GITHUB_TOKEN: ${{ github.token }}'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'))
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.includes('wrangler secret'), false)

assert.ok(runner.includes("['dlx', 'wrangler@4', 'd1', 'execute'"))
assert.ok(runner.includes("'--remote'"))
assert.ok(runner.includes('SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode'))
assert.ok(runner.includes('SELECT COUNT(*) AS provider_leakage_rows'))
assert.ok(runner.includes('fetchWorkerSettings'))
assert.ok(runner.includes('canaryBindingsAbsent'))
assert.ok(runner.includes('contract.acceptance.pollAttempts'))
assert.ok(runner.includes('contract.acceptance.pollIntervalSeconds'))
assert.equal(runner.includes("'deploy'"), false)
assert.equal(runner.includes("'/collect'"), false)
assert.equal(runner.includes('collector-twitch'), false)

assert.ok(runAudit.includes('/actions/workflows/'))
assert.ok(runAudit.includes('event=push'))
assert.ok(runAudit.includes('/actions/runs/'))
assert.ok(runAudit.includes('/jobs?per_page=100'))
assert.ok(runAudit.includes('/artifacts?per_page=100'))
assert.equal(/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(runAudit), false)
assert.equal(runAudit.includes('CLOUDFLARE'), false)
assert.equal(runAudit.includes('wrangler'), false)

assert.ok(cloudflareAudit.includes('/workers/services/'))
assert.ok(cloudflareAudit.includes('/environments/production/settings'))
assert.ok(cloudflareAudit.includes('/workers/scripts/'))
assert.ok(cloudflareAudit.includes('/schedules'))
assert.ok(cloudflareAudit.includes('/deployments'))
assert.ok(cloudflareAudit.includes('/workers/subdomain'))
assert.ok(cloudflareAudit.includes('secret_text'))
assert.equal(/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i.test(cloudflareAudit), false)
assert.equal(cloudflareAudit.includes('wrangler'), false)
assert.equal(cloudflareAudit.includes('collector-twitch'), false)

for (const source of [runner, runAudit, cloudflareAudit]) {
  for (const pattern of [
    /\bINSERT\s+INTO\b/i,
    /\bUPDATE\s+[A-Za-z_]/i,
    /\bDELETE\s+FROM\b/i,
    /\bDROP\s+(?:TABLE|INDEX)\b/i,
    /\bALTER\s+TABLE\b/i,
    /\bCREATE\s+(?:TABLE|INDEX)\b/i,
    /\bREPLACE\s+INTO\b/i,
    /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
  ]) {
    assert.equal(pattern.test(source), false, `read-only recovery acceptance source contains forbidden mutation pattern: ${pattern}`)
  }
}

assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(scope.includes('12a4-kick-category-capture-canary-trigger.json'))
assert.ok(scope.includes('12a4-kick-normal-collector-recovery-trigger.json'))
assert.ok(scope.includes('run-12a4-kick-normal-collector-recovery-run-audit.mjs'))
assert.ok(scope.includes('run-12a4-kick-normal-collector-cloudflare-audit.mjs'))
assert.ok(doc.includes('does not deploy'))
assert.ok(doc.includes('latest normal Kick snapshot'))
assert.ok(doc.includes('Attempt 2'))
assert.ok(doc.includes('Twitch remains unchanged'))

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  provider: contract.provider,
  recoveryPackagePr: contract.recoveryPackagePr,
  recoveryExecutionPr: contract.recoveryExecutionPr,
  recoveryAttempt: contract.recoveryAttempt,
  incidentCollectedAt: contract.incidentSnapshot.collectedAt,
  boundedPollingMinutes: contract.acceptance.pollIntervalSeconds * contract.acceptance.pollAttempts / 60,
  GitHubActionsAuditReadOnly: true,
  CloudflareAuditGetOnly: true,
  productionMutationAuthorized: false,
  TwitchChanged: false,
}, null, 2))
