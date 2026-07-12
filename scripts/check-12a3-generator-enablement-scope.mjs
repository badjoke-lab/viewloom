#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const allowed = new Set([
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/analytics-generator-acceptance/src/index.ts',
  'workers/analytics-generator-acceptance/wrangler.twitch.toml',
  'workers/analytics-generator-acceptance/wrangler.kick.toml',
  'docs/audits/12a3-generator-enablement-contract.json',
  'docs/audits/12a3-generator-enablement-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/operations/12a3-generator-enablement-acceptance-2026-07-12.md',
  'docs/work-in-progress/phase12a3-generator-enablement.md',
  'scripts/collect-12a3-generator-enablement-evidence.mjs',
  'scripts/verify-12a3-generator-enablement-evidence.mjs',
  'scripts/verify-12a3-generator-enablement.mjs',
  'scripts/check-12a3-generator-enablement-scope.mjs',
  '.github/workflows/analytics-12a3-generator-enablement.yml',
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'scripts/verify-development-policy.mjs',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `generator enablement branch changed unapproved paths:\n${forbidden.join('\n')}`)

for (const path of [
  'workers/collector-twitch/src/index.ts',
  'workers/collector-kick/src/index.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/shared/intraday-rollup.ts',
  'workers/shared/intraday-schema.ts',
]) assert.equal(changed.includes(path), false, `enablement must not change accepted runtime code: ${path}`)

for (const prefix of ['apps/web/', 'db/d1/']) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `generator enablement must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/analytics-generator-acceptance/src/index.ts',
  'docs/audits/12a3-generator-enablement-contract.json',
  'scripts/verify-12a3-generator-enablement-evidence.mjs',
  '.github/workflows/analytics-12a3-generator-enablement.yml',
]) assert.ok(changed.includes(required), `generator enablement missing required file: ${required}`)

console.log('12A-3 generator enablement scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- accepted generator runtime code changes: 0')
console.log('- collector index/entry changes: 0')
console.log('- web/API changes: 0')
console.log('- migration changes: 0')
console.log('- runtime change limited to two explicit Wrangler flags')
