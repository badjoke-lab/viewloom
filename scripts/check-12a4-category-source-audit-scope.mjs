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
  'workers/category-source-audit/shared.ts',
  'workers/category-source-audit/twitch.ts',
  'workers/category-source-audit/kick.ts',
  'workers/category-source-audit/wrangler.twitch.toml',
  'workers/category-source-audit/wrangler.kick.toml',
  'docs/audits/12a4-category-source-audit-contract.json',
  'docs/audits/12a4-category-source-audit-evidence.json',
  'docs/operations/12a4-category-source-audit-2026-07-12.md',
  'docs/work-in-progress/phase12a4-category-source-audit.md',
  'scripts/collect-12a4-category-source-evidence.mjs',
  'scripts/verify-12a4-category-source-evidence.mjs',
  'scripts/verify-12a4-category-source-audit-package.mjs',
  'scripts/check-12a4-category-source-audit-scope.mjs',
  '.github/workflows/analytics-12a4-category-source-audit.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `12A-4 category source audit changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'apps/web/',
  'db/',
  'workers/collector-twitch/',
  'workers/collector-kick/',
  'workers/shared/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `12A-4 source audit must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'workers/category-source-audit/twitch.ts',
  'workers/category-source-audit/kick.ts',
  'docs/audits/12a4-category-source-audit-contract.json',
  'scripts/collect-12a4-category-source-evidence.mjs',
  'scripts/verify-12a4-category-source-evidence.mjs',
  '.github/workflows/analytics-12a4-category-source-audit.yml',
]) assert.ok(changed.includes(required), `12A-4 source audit missing required path: ${required}`)

console.log('12A-4 category source audit scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production collector/shared/web/migration changes: 0')
console.log('- runtime category capture changes: 0')
console.log('- evidence-only temporary audit package')
