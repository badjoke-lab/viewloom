#!/usr/bin/env node

import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

const base = process.env.GITHUB_BASE_REF || 'main'
let changed = []
try {
  execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', base], { stdio: 'ignore' })
  changed = execFileSync('git', ['diff', '--name-only', `origin/${base}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

const forbiddenPrefixes = [
  'apps/web/functions/',
  'apps/web/src/',
  'workers/',
  'db/',
]
const forbiddenExact = new Set([
  'apps/web/wrangler.toml',
  'wrangler.toml',
])

const forbidden = changed.filter((path) => forbiddenExact.has(path) || forbiddenPrefixes.some((prefix) => path.startsWith(prefix)))
assert.deepEqual(forbidden, [], `12A-0 evidence-only branch contains runtime/data-path changes:\n${forbidden.join('\n')}`)

console.log('12A-0 no-runtime-change verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log('- runtime/data-path changes: 0')
