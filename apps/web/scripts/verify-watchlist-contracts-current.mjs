import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const sourcePath = resolve(scriptDirectory, 'verify-watchlist-contracts.mjs')
const temporaryPath = resolve(scriptDirectory, '.verify-watchlist-contracts-current.tmp.mjs')

const replacements = new Map([
  ['P9H0 closeout active on work-p9h0-closeout', 'P9H0 closeout complete PR #432'],
  ['Local Watchlist W0-W5B                   complete through PR #425', 'P9H0 documentation closeout             complete PR #432'],
  ['Phase 8 P8B browser audit                complete through PR #428', 'Active implementation branch            none'],
  ['Phase 9 P9H0                             complete through PR #430', 'P9H1 branch created                     no'],
  ['Current branch: work-p9h0-closeout', 'Exact next branch                       work-history-ui-h1-metric'],
  ['Current branch: `work-p9h0-closeout`', 'Current implementation branch: none'],
  ['C9H0     work-p9h0-closeout', 'C9H0     documentation and program closeout'],
])

let source = readFileSync(sourcePath, 'utf8')
for (const [before, after] of replacements) {
  const count = source.split(before).length - 1
  assert.equal(count, 1, `historical Watchlist verifier marker changed: ${before}`)
  source = source.replace(before, after)
}

writeFileSync(temporaryPath, source, 'utf8')
try {
  const result = spawnSync(process.execPath, [temporaryPath], {
    cwd: resolve(scriptDirectory, '..'),
    encoding: 'utf8',
    env: process.env,
  })
  process.stdout.write(result.stdout ?? '')
  process.stderr.write(result.stderr ?? '')
  assert.equal(result.status, 0, 'current-state Watchlist contract verification failed')
} finally {
  rmSync(temporaryPath, { force: true })
}

console.log('- historical Watchlist verifier ran unchanged except for canonical current-state markers')
