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
  'workers/shared/intraday-rollup.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'docs/audits/12a3-bounded-generator-contract.json',
  'docs/work-in-progress/phase12a3-bounded-generator.md',
  'scripts/test-12a3-bounded-generator-sql.py',
  'scripts/verify-12a3-bounded-generator.mjs',
  'scripts/check-12a3-bounded-generator-scope.mjs',
  '.github/workflows/analytics-12a3-bounded-generator.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `bounded generator branch changed unapproved paths:\n${forbidden.join('\n')}`)

for (const path of [
  'workers/collector-twitch/src/index.ts',
  'workers/collector-kick/src/index.ts',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
]) assert.equal(changed.includes(path), false, `bounded generator implementation must not change ${path}`)

for (const prefix of ['apps/web/', 'db/d1/']) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `bounded generator implementation must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'workers/shared/intraday-rollup.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'docs/audits/12a3-bounded-generator-contract.json',
  'scripts/test-12a3-bounded-generator-sql.py',
  'scripts/verify-12a3-bounded-generator.mjs',
  '.github/workflows/analytics-12a3-bounded-generator.yml',
]) assert.ok(changed.includes(required), `bounded generator implementation missing required file: ${required}`)

console.log('12A-3 bounded generator scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- collector index changes: 0')
console.log('- Wrangler enablement changes: 0')
console.log('- web/API changes: 0')
console.log('- migration changes: 0')
console.log('- runtime scope limited to shared generator and two entry wrappers')
