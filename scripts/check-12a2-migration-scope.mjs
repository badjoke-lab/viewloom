#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
const changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

const forbiddenPrefixes = [
  'apps/web/functions/',
  'apps/web/src/',
  'workers/',
  'migrations/',
]
const allowedDbPaths = new Set(['db/d1/004_intraday_rollups.sql'])
const dbChanges = changed.filter((path) => path.startsWith('db/d1/'))
const forbiddenDb = dbChanges.filter((path) => !allowedDbPaths.has(path))

assert.deepEqual(forbiddenDb, [], `unexpected D1 migration path changes:\n${forbiddenDb.join('\n')}`)
const forbiddenRuntime = changed.filter((path) => forbiddenPrefixes.some((prefix) => path.startsWith(prefix)))
assert.deepEqual(forbiddenRuntime, [], `12A-2 migration branch contains runtime/data-path changes:\n${forbiddenRuntime.join('\n')}`)

assert.ok(changed.includes('db/d1/004_intraday_rollups.sql'), 'approved migration file is missing')

console.log('12A-2 migration scope verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- approved D1 migration files: 1')
console.log('- runtime/data-path changes: 0')
