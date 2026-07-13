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
  'docs/audits/12a4-disabled-runtime-postmerge-contract.json',
  'docs/audits/12a4-disabled-runtime-postmerge-evidence.json',
  'docs/operations/12a4-disabled-runtime-postmerge-acceptance-2026-07-14.md',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
  'workers/category-disabled-runtime-verifier/src/index.ts',
  'workers/category-disabled-runtime-verifier/wrangler.twitch.toml',
  'workers/category-disabled-runtime-verifier/wrangler.kick.toml',
  'scripts/collect-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-package.mjs',
  'scripts/check-12a4-disabled-runtime-postmerge-scope.mjs',
  '.github/workflows/analytics-12a4-disabled-runtime-postmerge.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `disabled runtime acceptance changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of ['apps/', 'db/', 'packages/', 'workers/collector-', 'workers/shared/']) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `disabled runtime acceptance must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'docs/audits/12a4-disabled-runtime-postmerge-contract.json',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
  'workers/category-disabled-runtime-verifier/src/index.ts',
  'workers/category-disabled-runtime-verifier/wrangler.twitch.toml',
  'workers/category-disabled-runtime-verifier/wrangler.kick.toml',
  'scripts/collect-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-evidence.mjs',
  'scripts/verify-12a4-disabled-runtime-postmerge-package.mjs',
  '.github/workflows/analytics-12a4-disabled-runtime-postmerge.yml',
]) assert.ok(changed.includes(required), `disabled runtime acceptance missing: ${required}`)

console.log('12A-4 disabled runtime post-merge scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- collector/shared/schema/web changes: 0')
console.log('- read-only evidence and temporary verifier package only')
