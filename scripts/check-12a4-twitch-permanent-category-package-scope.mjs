import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-twitch-permanent-category-package.yml',
  'docs/audits/12a4-twitch-permanent-category-capture-package-contract.json',
  'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  'scripts/check-12a4-twitch-permanent-category-package-scope.mjs',
  'scripts/run-12a4-twitch-permanent-category-observer.mjs',
  'scripts/test-12a4-twitch-permanent-category-capture.mjs',
  'scripts/verify-12a4-twitch-permanent-category-package.mjs',
  'scripts/verify-category-rollout-policy.mjs',
  'workers/collector-twitch/wrangler.category-permanent.toml',
])
const forbidden = [
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/',
  'db/',
  'apps/',
  'docs/audits/12a2-current-gate-state.json',
]

const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', baseRef], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean)
  .sort()

assert.ok(changed.length > 0, 'package must contain changed files')
assert.deepEqual(changed.filter((file) => !allowed.has(file)), [], `unexpected package files: ${changed.filter((file) => !allowed.has(file)).join(', ')}`)
assert.deepEqual(changed.filter((file) => forbidden.some((path) => path.endsWith('/') ? file.startsWith(path) : file === path)), [], 'package touches a forbidden production or provider path')

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-20',
  changed,
  productionNormalConfigChanged: false,
  kickChanged: false,
  d1Changed: false,
  uiChanged: false,
  deploymentTriggerIncluded: false,
}, null, 2))
