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
  'db/d1/',
  'migrations/',
]
const forbiddenExact = new Set([
  'apps/web/wrangler.toml',
  'wrangler.toml',
])

const forbidden = changed.filter((path) => forbiddenExact.has(path) || forbiddenPrefixes.some((prefix) => path.startsWith(prefix)))
assert.deepEqual(forbidden, [], `12A-2 design branch contains migration/runtime/data-path changes:\n${forbidden.join('\n')}`)

console.log('12A-2 design no-migration verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- migration/runtime/data-path changes: 0')
