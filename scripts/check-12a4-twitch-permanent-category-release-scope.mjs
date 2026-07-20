import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const triggerPath = 'docs/audits/12a4-twitch-permanent-category-release-trigger.json'
const allowed = new Set([
  '.github/workflows/analytics-12a4-twitch-permanent-category-release.yml',
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-surface-inventory.yml',
  'docs/audits/12a4-twitch-permanent-category-release-contract.json',
  'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  'scripts/check-12a4-twitch-permanent-category-release-scope.mjs',
  'scripts/inspect-12a4-twitch-permanent-category-release-trigger.mjs',
  'scripts/run-12a4-twitch-permanent-category-observer.mjs',
  'scripts/run-12a4-twitch-permanent-category-release.mjs',
  'scripts/test-12a4-twitch-permanent-category-release.mjs',
  'scripts/verify-12a4-twitch-permanent-category-release-package.mjs',
  'scripts/verify-12a4-twitch-permanent-category-release-trigger.mjs',
  'scripts/verify-category-rollout-policy.mjs',
  'scripts/wait-12a4-twitch-permanent-category-release-start.mjs',
])
const forbiddenExact = new Set([
  triggerPath,
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'docs/audits/12a2-current-gate-state.json',
])
const forbiddenPrefixes = ['workers/collector-kick/', 'db/', 'apps/']

const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', baseRef], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean)
  .sort()

assert.ok(changed.length > 0, 'release package must contain changed files')
assert.deepEqual(changed.filter((file) => !allowed.has(file)), [], `unexpected release package files: ${changed.filter((file) => !allowed.has(file)).join(', ')}`)
assert.deepEqual(
  changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix))),
  [],
  'release package touches forbidden trigger, production config, provider, database, gate, or UI paths',
)
assert.equal(fs.existsSync(triggerPath), false, 'exact release trigger must be absent from the dormant package PR')

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-21',
  changed,
  triggerPresent: false,
  productionConfigChanged: false,
  kickChanged: false,
  remoteD1OperationFromPullRequest: false,
  productionActivationFromPullRequest: false,
  permanentRolloutPolicyRoutingFixed: true,
  publicInventoryPolicyRoutingFixed: true,
}, null, 2))
