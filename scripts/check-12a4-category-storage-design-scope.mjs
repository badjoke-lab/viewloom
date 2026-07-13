#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const designCore = new Set([
  'docs/audits/12a4-category-storage-design-contract.json',
  'docs/audits/12a4-category-storage-budget-evidence.json',
  'scripts/measure-12a4-category-storage-models.py',
  'scripts/verify-12a4-category-storage-evidence.mjs',
  'scripts/verify-12a4-category-storage-design.mjs',
])

const designAllowed = new Set([
  ...designCore,
  'docs/work-in-progress/phase12a4-category-storage-design.md',
  'scripts/check-12a4-category-storage-design-scope.mjs',
  '.github/workflows/analytics-12a4-category-storage-design.yml',
])

const closeoutAllowed = new Set([
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12a4-category-storage-design.md',
  'docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md',
  'scripts/verify-development-policy.mjs',
  'scripts/check-12a4-category-storage-design-scope.mjs',
])

const designMode = changed.some((path) => designCore.has(path))
const mode = designMode ? 'design' : 'accepted-closeout'
const allowed = designMode ? designAllowed : closeoutAllowed
const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `category storage ${mode} changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'apps/',
  'db/',
  'workers/',
  'packages/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `${mode} branch must not change ${prefix}:\n${matches.join('\n')}`)
}

if (designMode) {
  for (const required of [
    'docs/audits/12a4-category-storage-design-contract.json',
    'scripts/measure-12a4-category-storage-models.py',
    'scripts/verify-12a4-category-storage-evidence.mjs',
    'scripts/verify-12a4-category-storage-design.mjs',
    '.github/workflows/analytics-12a4-category-storage-design.yml',
  ]) assert.ok(changed.includes(required), `category storage design missing: ${required}`)
} else {
  for (const required of [
    'README.md',
    'docs/audits/12a2-current-gate-state.json',
    'docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md',
    'docs/product/current-roadmap.md',
    'docs/product/current-schedule.md',
    'docs/work-in-progress/phase12a4-category-storage-design.md',
    'docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md',
    'scripts/verify-development-policy.mjs',
  ]) assert.ok(changed.includes(required), `category storage accepted closeout missing: ${required}`)
}

console.log('12A-4 category storage scope verification passed.')
console.log(`- mode: ${mode}`)
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production runtime/schema/migration/web changes: 0')
console.log(designMode
  ? '- benchmark, contract, evidence, and design records only'
  : '- accepted evidence closeout and canonical workstream transition only')
