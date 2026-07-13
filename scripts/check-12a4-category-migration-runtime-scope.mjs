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
  'db/d1/005_category_capture.sql',
  'docs/audits/12a4-category-migration-runtime-contract.json',
  'workers/shared/category-capture.ts',
  'workers/shared/category-intraday-sql.ts',
  'workers/shared/category-intraday-rollup.ts',
  'workers/collector-twitch/src/index-category.ts',
  'workers/collector-twitch/src/index.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/index-category.ts',
  'workers/collector-kick/src/index.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/collector-kick/src/official-livestreams.ts',
  'scripts/test-12a4-category-migration-runtime.py',
  'scripts/verify-12a4-category-migration-runtime.mjs',
  'scripts/check-12a4-category-migration-runtime-scope.mjs',
  'scripts/verify-collector-contracts.mjs',
  '.github/workflows/analytics-12a4-category-migration-runtime.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `12A-4 category migration/runtime changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'apps/',
  'packages/',
  'docs/product/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `category migration/runtime must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const path of [
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/shared/intraday-schema.ts',
  'db/d1/004_intraday_rollups.sql',
  'docs/audits/12a2-current-gate-state.json',
]) assert.equal(changed.includes(path), false, `category migration/runtime must not change ${path}`)

for (const required of [
  'db/d1/005_category_capture.sql',
  'docs/audits/12a4-category-migration-runtime-contract.json',
  'workers/shared/category-capture.ts',
  'workers/shared/category-intraday-sql.ts',
  'workers/shared/category-intraday-rollup.ts',
  'workers/collector-twitch/src/index-category.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/index-category.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/collector-kick/src/official-livestreams.ts',
  'scripts/test-12a4-category-migration-runtime.py',
  'scripts/verify-12a4-category-migration-runtime.mjs',
  '.github/workflows/analytics-12a4-category-migration-runtime.yml',
]) assert.ok(changed.includes(required), `category migration/runtime missing required path: ${required}`)

console.log('12A-4 category migration/runtime scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production Wrangler, remote schema bootstrap, web, and canonical state changes: 0')
console.log('- repository migration candidate and disabled runtime only')
