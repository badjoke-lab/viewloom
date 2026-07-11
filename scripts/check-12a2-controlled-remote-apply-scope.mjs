#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const allowedRuntime = new Set([
  'workers/shared/intraday-schema.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
])

const runtimeChanges = changed.filter((path) => path.startsWith('workers/'))
const forbiddenRuntime = runtimeChanges.filter((path) => !allowedRuntime.has(path))
assert.deepEqual(forbiddenRuntime, [], `controlled apply branch changed unapproved worker runtime paths:\n${forbiddenRuntime.join('\n')}`)
assert.ok(runtimeChanges.length > 0, 'controlled apply branch must change at least one approved worker runtime path')

for (const forbiddenPrefix of ['apps/web/functions/', 'apps/web/src/', 'db/d1/']) {
  const matches = changed.filter((path) => path.startsWith(forbiddenPrefix))
  assert.deepEqual(matches, [], `controlled apply branch must not change ${forbiddenPrefix}:\n${matches.join('\n')}`)
}

console.log('12A-2 controlled remote apply scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log(`- approved worker runtime paths changed: ${runtimeChanges.length}`)
console.log('- unapproved worker runtime changes: 0')
console.log('- collector index.ts changes: 0')
console.log('- web/API changes: 0')
console.log('- migration file changes: 0')
