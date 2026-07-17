import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const allowed = new Set([
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-kick-category-capture-canary-execution-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  'scripts/check-12a4-category-capture-enablement-decision-scope.mjs',
  'scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-execution-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
  'scripts/check-12a4-kick-category-capture-canary-post-rollback-acceptance-scope.mjs',
  'scripts/check-12a4-kick-canary-expiry-binding-cleanup-scope.mjs',
  'scripts/verify-12a4-category-capture-enablement-decision.mjs',
  'scripts/verify-12a4-category-execution-cost-probe.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-execution-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-post-rollback-acceptance-package.mjs',
  'scripts/verify-12a4-kick-canary-expiry-binding-cleanup-package.mjs',
  'scripts/verify-development-policy.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
])
const forbiddenExact = new Set([
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
  'workers/collector-twitch/wrangler.toml',
])
const forbiddenPrefixes = ['apps/', 'db/', 'workers/', 'packages/']

const gate = JSON.parse(readFileSync('docs/audits/12a2-current-gate-state.json', 'utf8'))
const trigger = JSON.parse(readFileSync('docs/audits/12a4-kick-category-capture-canary-trigger.json', 'utf8'))
const evidence = JSON.parse(readFileSync('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json', 'utf8'))
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.currentWorkstream?.phase, '12A-4-12')
assert.equal(gate.currentWorkstream?.acceptedKickCanaryFinalEvidence, true)
assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.retired, true)
assert.equal(evidence.outcome, 'accepted')
assert.equal(evidence.artifact?.artifactId, 8399137444)

const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
const result = spawnSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert.equal(result.status, 0, `git diff failed: ${result.stderr || result.stdout}`)
const changed = result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
assert.ok(changed.length > 0, 'final acceptance bundle must contain changed files')
const unexpected = changed.filter((file) => !allowed.has(file))
const forbidden = changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))
assert.deepEqual(unexpected, [], `final acceptance bundle contains files outside exact scope: ${unexpected.join(', ')}`)
assert.deepEqual(forbidden, [], `final acceptance bundle touches forbidden production paths: ${forbidden.join(', ')}`)

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-12 accepted and retired',
  changedFiles: changed,
  productionPathsChanged: false,
  triggerRetired: true,
  gateStateAdvanced: true,
  twitchChanged: false,
}, null, 2))
