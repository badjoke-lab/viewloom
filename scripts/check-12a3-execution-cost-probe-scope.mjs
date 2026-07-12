#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const allowedExact = new Set([
  'workers/analytics-cost-probe/src/index.ts',
  'workers/analytics-cost-probe/wrangler.twitch.toml',
  'workers/analytics-cost-probe/wrangler.kick.toml',
  'docs/audits/12a3-execution-cost-probe-contract.json',
  'docs/audits/12a3-execution-cost-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/operations/12a3-execution-cost-acceptance-2026-07-12.md',
  'docs/work-in-progress/phase12a3-execution-cost-probe.md',
  'scripts/collect-12a3-execution-cost-evidence.mjs',
  'scripts/verify-12a3-execution-cost-evidence.mjs',
  'scripts/verify-12a3-execution-cost-probe.mjs',
  'scripts/check-12a3-execution-cost-probe-scope.mjs',
  '.github/workflows/analytics-12a3-execution-cost-probe.yml',
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'scripts/verify-development-policy.mjs',
])

const forbidden = changed.filter((path) => !allowedExact.has(path))
assert.deepEqual(forbidden, [], `12A-3 execution cost probe changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'workers/collector-twitch/',
  'workers/collector-kick/',
  'workers/shared/',
  'apps/web/',
  'db/d1/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `cost probe must not change ${prefix}:\n${matches.join('\n')}`)
}

assert.ok(changed.includes('workers/analytics-cost-probe/src/index.ts'), 'temporary probe Worker missing')
assert.ok(changed.includes('.github/workflows/analytics-12a3-execution-cost-probe.yml'), 'probe workflow missing')

console.log('12A-3 execution cost probe scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production collector runtime changes: 0')
console.log('- web/API changes: 0')
console.log('- migration changes: 0')
console.log('- temporary probe scope only')
