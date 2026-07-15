import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-kick-category-capture-canary-acceptance.yml',
  'docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-acceptance.md',
  'scripts/check-12a4-kick-category-capture-canary-acceptance-scope.mjs',
  'scripts/run-12a4-kick-category-capture-canary-acceptance.mjs',
  'scripts/verify-12a4-kick-category-capture-canary-acceptance-package.mjs',
])

const forbiddenExact = new Set([
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
  'workers/collector-twitch/wrangler.toml',
])

const forbiddenPrefixes = [
  'apps/',
  'db/',
  'workers/',
  'packages/',
]

const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
const result = spawnSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
  cwd: process.cwd(),
  encoding: 'utf8',
})

assert.equal(result.status, 0, `git diff failed: ${result.stderr || result.stdout}`)
const changed = result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
assert.ok(changed.length > 0, 'acceptance package must contain changed files')

const unexpected = changed.filter((file) => !allowed.has(file))
const forbidden = changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))

assert.deepEqual(unexpected, [], `acceptance package contains files outside its exact scope: ${unexpected.join(', ')}`)
assert.deepEqual(forbidden, [], `acceptance package touches forbidden production paths: ${forbidden.join(', ')}`)
assert.equal(changed.includes('docs/audits/12a4-kick-category-capture-canary-trigger.json'), false)
assert.equal(changed.includes('docs/audits/12a2-current-gate-state.json'), false)

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-11',
  changedFiles: changed,
  productionPathsChanged: false,
  triggerChanged: false,
  gateStateChanged: false,
}, null, 2))
