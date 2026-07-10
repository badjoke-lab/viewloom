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
  'workers/collector-twitch/src/',
  'workers/collector-kick/src/',
  'db/',
  'migrations/',
]
const forbiddenExact = new Set([
  'apps/web/wrangler.toml',
  'wrangler.toml',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
])

const forbidden = changed.filter((path) => forbiddenExact.has(path) || forbiddenPrefixes.some((prefix) => path.startsWith(prefix)))
assert.deepEqual(forbidden, [], `12A-1 field-contract branch contains runtime/data-path changes:\n${forbidden.join('\n')}`)

const allowedProbe = 'workers/collector-kick/scripts/probe-kick-official-livestreams.mjs'
const workerChanges = changed.filter((path) => path.startsWith('workers/'))
assert.ok(workerChanges.every((path) => path === allowedProbe), `12A-1 worker-tree changes must be limited to ${allowedProbe}`)

console.log('12A-1 no-runtime-change verification passed.')
console.log(`- changed files inspected: ${changed.length}`)
console.log(`- allowed worker probe changes: ${workerChanges.length}`)
console.log('- runtime/data-path changes: 0')
