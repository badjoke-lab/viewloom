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
  'workers/analytics-postmerge-verifier/src/index.ts',
  'workers/analytics-postmerge-verifier/wrangler.twitch.toml',
  'workers/analytics-postmerge-verifier/wrangler.kick.toml',
  'docs/audits/12a3-postmerge-acceptance-contract.json',
  'docs/audits/12a3-postmerge-acceptance-evidence.json',
  'docs/operations/12a3-postmerge-acceptance-2026-07-12.md',
  'docs/work-in-progress/phase12a3-postmerge-acceptance.md',
  'scripts/collect-12a3-postmerge-evidence.mjs',
  'scripts/verify-12a3-postmerge-evidence.mjs',
  'scripts/verify-12a3-postmerge-package.mjs',
  'scripts/check-12a3-postmerge-scope.mjs',
  '.github/workflows/analytics-12a3-postmerge-acceptance.yml',
])

const forbidden = changed.filter((path) => !allowed.has(path))
assert.deepEqual(forbidden, [], `post-merge acceptance changed unapproved paths:\n${forbidden.join('\n')}`)

for (const prefix of [
  'apps/web/',
  'db/',
  'workers/collector-twitch/',
  'workers/collector-kick/',
  'workers/shared/',
]) {
  const matches = changed.filter((path) => path.startsWith(prefix))
  assert.deepEqual(matches, [], `post-merge acceptance must not change ${prefix}:\n${matches.join('\n')}`)
}

for (const required of [
  'workers/analytics-postmerge-verifier/src/index.ts',
  'docs/audits/12a3-postmerge-acceptance-contract.json',
  'scripts/verify-12a3-postmerge-evidence.mjs',
  '.github/workflows/analytics-12a3-postmerge-acceptance.yml',
]) assert.ok(changed.includes(required), `post-merge acceptance missing required path: ${required}`)

console.log('12A-3 post-merge acceptance scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- production collector/shared/web/migration changes: 0')
console.log('- temporary read-only verifier package only')
