import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-twitch-permanent-category-capture-package-contract.json')
const gate = json(contract.acceptedDecision.canonicalGate)
const spec = read(contract.acceptedDecision.specification)
const plan = read(contract.acceptedDecision.implementationPlan)
const normal = read(contract.package.normalConfig)
const permanent = read(contract.package.permanentConfig)
const entry = read(contract.package.collectorEntry)
const implementation = read(contract.package.collectorImplementation)
const category = read(contract.package.categoryContract)
const observer = read(contract.package.readOnlyObserver)
const fixture = read(contract.package.fixture)
const scope = read(contract.package.scopeVerifier)
const workflow = read(contract.package.workflow)
const wip = read('docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-permanent-category-capture-package-v1')
assert.equal(contract.workstream, '12A-4-20 Twitch permanent category capture implementation package')
assert.equal(contract.status, 'prepared')
assert.equal(contract.trackingIssue, 623)
assert.equal(contract.packagePr, 625)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.acceptedDecision.decisionPr, 624)
assert.equal(contract.acceptedDecision.decisionMergeSha, 'db5738f4ed59d409bc3a0c6c0ed7aaa3fafdf45e')
assert.equal(gate.schemaVersion, contract.acceptedDecision.requiredGateSchemaVersion)
assert.equal(gate.currentWorkstream.phase, contract.acceptedDecision.requiredGatePhase)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)

for (const fragment of [
  'Twitch permanent capture contract',
  'preserve the existing `*/5 * * * *` Worker cron',
  'Kick permanent category capture is not authorized',
  'Every category implementation, deployment, observation, acceptance, rollback, and UI PR must read and cite',
]) assert.ok(spec.includes(fragment), `spec missing ${fragment}`)
for (const fragment of [
  'Phase 12A-4-20 — Twitch implementation package',
  'Phase 12A-4-21 — exact Twitch deployment',
  'A temporary GitHub Actions observation schedule is allowed, but no new Worker cron is allowed',
]) assert.ok(plan.includes(fragment), `plan missing ${fragment}`)

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(toml(permanent, 'name'), contract.runtimeContract.serviceName)
assert.equal(toml(permanent, 'main'), contract.package.collectorEntry.replace('workers/collector-twitch/', '').replace('.ts', '.ts'))
assert.equal(toml(permanent, 'database_name'), contract.runtimeContract.databaseName)
assert.equal(toml(permanent, 'binding'), contract.runtimeContract.databaseBinding)
assert.equal(cron(permanent), contract.runtimeContract.collectorCron)
assert.equal(cron(permanent), cron(normal))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(permanent), false)

for (const fragment of [
  'categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)',
  'maybeGenerateCategoryIntradayRollups',
]) assert.ok(entry.includes(fragment), `entry missing ${fragment}`)
for (const fragment of [
  'game_id?: string',
  'game_name?: string',
  'encodeCategorySnapshot(input.items, input.hasMore)',
  'writeCategoryDictionary(',
]) assert.ok(implementation.includes(fragment), `implementation missing ${fragment}`)
assert.ok(category.includes("CATEGORY_CONTRACT_VERSION = 'category-source-v1'"))
assert.ok(category.includes('ON CONFLICT(provider, category_id) DO UPDATE SET'))

assert.deepEqual(contract.readOnlyPreflight.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyPreflight.d1Statements, ['SELECT'])
assert.equal(contract.readOnlyPreflight.productionMutationAllowed, false)
assert.equal(contract.observation.minimumHours, 24)
assert.equal(contract.observation.warningExtensionHours, 48)
assert.equal(contract.observation.initialConsecutiveCategorySnapshotsRequired, 2)
assert.equal(contract.observation.missingCategorySnapshotsHardStop, 3)
assert.equal(contract.observation.automaticKickStart, false)
assert.equal(contract.rollback.config, contract.package.normalConfig)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance, null)

for (const fragment of [
  'export function projectStorage',
  'export function bindingState',
  'export function parseLastJson',
  "['preflight', 'observe', 'rollback']",
  'cloudflareJson(',
  'runD1Select(',
  'provider_leakage_rows',
  'category_payload_rows_since_start',
  'collector_error_runs_since_start',
  'productionMutationAuthorized: false',
  'kickMutationAuthorized: false',
]) assert.ok(observer.includes(fragment), `observer missing ${fragment}`)
assert.equal(observer.includes('wrangler@4 deploy'), false)
assert.equal(/\bINSERT\s+INTO\b/i.test(observer), false)
assert.equal(/\bUPDATE\s+[A-Za-z_]/i.test(observer), false)
assert.equal(/\bDELETE\s+FROM\b/i.test(observer), false)

for (const fragment of [
  'permanentConfigMatchesNormalIdentity: true',
  'fiveMinuteCronPreserved: true',
  'storageGatesVerified: true',
  'bindingGatesVerified: true',
  'kickChanged: false',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)
assert.ok(scope.includes("'workers/collector-twitch/wrangler.toml'"))
assert.ok(scope.includes("'workers/collector-kick/'"))
assert.ok(scope.includes("'docs/audits/12a2-current-gate-state.json'"))

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes('Verify exact Twitch permanent category package scope'))
assert.ok(workflow.includes('Run Twitch permanent category package fixtures'))
assert.ok(workflow.includes('Verify Twitch permanent category package contract'))
assert.ok(workflow.includes('Verify current category rollout contract'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.toml'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.category-permanent.toml'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)

assert.ok(wip.includes('PR #625 prepares the Twitch-only permanent category capture package'))
assert.ok(wip.includes('does not deploy a Worker'))
assert.ok(wip.includes('exact production deployment trigger'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-20',
  provider: 'twitch',
  packagePr: 625,
  runtimeCaptureActive: false,
  permanentConfigValidated: true,
  rollbackConfigValidated: true,
  readOnlyObserverValidated: true,
  deploymentFromPr: false,
  kickChanged: false,
}, null, 2))
