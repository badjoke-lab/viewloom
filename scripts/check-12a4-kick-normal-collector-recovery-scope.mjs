import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const allowed = new Set([
  '.github/workflows/analytics-12a4-kick-normal-collector-recovery.yml',
  'docs/audits/12a4-kick-normal-collector-recovery-contract.json',
  'docs/audits/12a4-kick-normal-collector-recovery-trigger.json',
  'docs/work-in-progress/phase12a4-kick-normal-collector-recovery.md',
  'scripts/check-12a4-kick-normal-collector-recovery-scope.mjs',
  'scripts/run-12a4-kick-normal-collector-recovery.mjs',
  'scripts/verify-12a4-kick-normal-collector-recovery-package.mjs',
])

const forbiddenExact = new Set([
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
  'workers/collector-twitch/wrangler.toml',
])

const forbiddenPrefixes = ['apps/', 'db/', 'workers/', 'packages/']
const baseRef = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main'
const result = spawnSync('git', ['diff', '--name-only', `${baseRef}...HEAD`], {
  cwd: process.cwd(),
  encoding: 'utf8',
})
assert.equal(result.status, 0, `git diff failed: ${result.stderr || result.stdout}`)

const changed = result.stdout.split(/\r?\n/).map((value) => value.trim()).filter(Boolean)
assert.ok(changed.length > 0, 'recovery package must contain changed files')
const unexpected = changed.filter((file) => !allowed.has(file))
const forbidden = changed.filter((file) => forbiddenExact.has(file) || forbiddenPrefixes.some((prefix) => file.startsWith(prefix)))

assert.deepEqual(unexpected, [], `recovery package contains files outside exact scope: ${unexpected.join(', ')}`)
assert.deepEqual(forbidden, [], `recovery package touches forbidden source or production config paths: ${forbidden.join(', ')}`)
assert.equal(changed.includes('docs/audits/12a4-kick-normal-collector-recovery-trigger.json'), true)
assert.equal(changed.includes('workers/collector-kick/wrangler.toml'), false)
assert.equal(changed.includes('workers/collector-twitch/wrangler.toml'), false)

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4 Kick normal collector recovery',
  changedFiles: changed,
  normalConfigSourceChanged: false,
  TwitchChanged: false,
}, null, 2))
