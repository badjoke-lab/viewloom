#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const canaryContract = 'docs/audits/12a4-kick-category-capture-canary-package-contract.json'
const isKickCanaryFollowUp = changed.includes(canaryContract)

if (isKickCanaryFollowUp) {
  const allowed = new Set([
    '.github/workflows/analytics-12a4-kick-category-capture-canary-package.yml',
    canaryContract,
    'docs/work-in-progress/phase12a4-kick-category-capture-canary.md',
    'scripts/check-12a4-category-migration-runtime-scope.mjs',
    'scripts/check-12a4-kick-category-capture-canary-package-scope.mjs',
    'scripts/test-12a4-kick-category-capture-canary.py',
    'scripts/verify-12a4-kick-category-capture-canary-package.mjs',
    'workers/collector-kick/src/entry-category-canary.ts',
    'workers/collector-kick/wrangler.category-canary.toml',
    'workers/shared/category-capture.ts',
  ])
  const forbidden = changed.filter((path) => !allowed.has(path))
  assert.deepEqual(forbidden, [], `12A-4 Kick canary follow-up changed unapproved paths:\n${forbidden.join('\n')}`)
  for (const prefix of ['apps/', 'packages/', 'workers/collector-twitch/', 'db/']) {
    const matches = changed.filter((path) => path.startsWith(prefix))
    assert.deepEqual(matches, [], `Kick canary follow-up must not change ${prefix}:\n${matches.join('\n')}`)
  }
  assert.ok(changed.includes('workers/shared/category-capture.ts'), 'Kick canary follow-up must include the D1-compatible dictionary repair')
  assert.ok(changed.includes('workers/collector-kick/src/entry-category-canary.ts'), 'Kick canary follow-up must include the bounded wrapper')
  console.log('12A-4 category migration/runtime follow-up compatibility scope passed.')
  console.log(`- changed files inspected: ${changed.length}`)
  console.log('- original migration candidate remains frozen; only Kick canary wrapper and D1 dictionary compatibility changed')
  process.exit(0)
}

const scheduledObservationRepair = 'workers/collector-kick/src/scheduled-observation.ts'
const isKickScheduledObservationRepair = changed.includes(scheduledObservationRepair)

if (isKickScheduledObservationRepair) {
  const allowed = new Set([
    '.github/workflows/analytics-12a4-category-migration-runtime.yml',
    'scripts/check-12a4-category-migration-runtime-scope.mjs',
    'scripts/verify-12a2-controlled-remote-apply.mjs',
    'scripts/verify-collector-contracts.mjs',
    'workers/collector-kick/src/entry.ts',
    'workers/collector-kick/src/official-livestreams.ts',
    scheduledObservationRepair,
  ])
  const forbidden = changed.filter((path) => !allowed.has(path))
  assert.deepEqual(forbidden, [], `12A-4 Kick scheduled observation repair changed unapproved paths:\n${forbidden.join('\n')}`)

  for (const prefix of ['apps/', 'packages/', 'db/', 'workers/collector-twitch/', 'workers/shared/']) {
    const matches = changed.filter((path) => path.startsWith(prefix))
    assert.deepEqual(matches, [], `Kick scheduled observation repair must not change ${prefix}:\n${matches.join('\n')}`)
  }

  for (const required of [
    'workers/collector-kick/src/entry.ts',
    'workers/collector-kick/src/official-livestreams.ts',
    scheduledObservationRepair,
    'scripts/verify-collector-contracts.mjs',
    'scripts/verify-12a2-controlled-remote-apply.mjs',
  ]) assert.ok(changed.includes(required), `Kick scheduled observation repair missing required path: ${required}`)

  console.log('12A-4 Kick scheduled observation repair scope passed.')
  console.log(`- changed files inspected: ${changed.length}`)
  console.log('- no schema, shared analytics, Twitch collector, application, or package changes')
  process.exit(0)
}

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
  'scripts/verify-12a3-bounded-generator.mjs',
  'scripts/check-12a3-bounded-generator-scope.mjs',
  '.github/workflows/analytics-12a3-bounded-generator.yml',
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
  'workers/shared/intraday-rollup.ts',
  'db/d1/004_intraday_rollups.sql',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a3-bounded-generator-contract.json',
  'scripts/test-12a3-bounded-generator-sql.py',
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
  'scripts/verify-12a3-bounded-generator.mjs',
  'scripts/check-12a3-bounded-generator-scope.mjs',
  '.github/workflows/analytics-12a3-bounded-generator.yml',
  '.github/workflows/analytics-12a4-category-migration-runtime.yml',
]) assert.ok(changed.includes(required), `category migration/runtime missing required path: ${required}`)

console.log('12A-4 category migration/runtime scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production Wrangler, remote schema bootstrap, accepted 12A-3 core, web, and canonical state changes: 0')
console.log('- repository migration candidate, disabled runtime, and bounded-generator compatibility guard maintenance only')
