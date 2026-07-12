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
  'docs/audits/12a4-category-storage-design-contract.json',
  'docs/audits/12a4-category-storage-budget-evidence.json',
  'docs/operations/12a4-category-storage-design-acceptance-2026-07-12.md',
  'docs/work-in-progress/phase12a4-category-storage-design.md',
  'scripts/measure-12a4-category-storage-models.py',
  'scripts/verify-12a4-category-storage-evidence.mjs',
  'scripts/verify-12a4-category-storage-design.mjs',
  'scripts/check-12a4-category-storage-design-scope.mjs',
  '.github/workflows/analytics-12a4-category-storage-design.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `category storage design changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'apps/',
  'db/',
  'workers/',
  'packages/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `design-only branch must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'docs/audits/12a4-category-storage-design-contract.json',
  'scripts/measure-12a4-category-storage-models.py',
  'scripts/verify-12a4-category-storage-evidence.mjs',
  'scripts/verify-12a4-category-storage-design.mjs',
  '.github/workflows/analytics-12a4-category-storage-design.yml',
]) assert.ok(changed.includes(required), `category storage design missing: ${required}`)

console.log('12A-4 category storage design scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production runtime/schema/migration/web changes: 0')
console.log('- benchmark, contract, evidence, and acceptance records only')
