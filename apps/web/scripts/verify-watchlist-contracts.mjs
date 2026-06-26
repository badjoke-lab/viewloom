import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const readWeb = (path) => readFileSync(resolve(webRoot, path), 'utf8')
const readRepo = (path) => readFileSync(resolve(repoRoot, path), 'utf8')
const requireAll = (source, parts, label) => {
  for (const part of parts) assert.ok(source.includes(part), `${label} missing: ${part}`)
}

for (const script of [
  'scripts/verify-watchlist-storage.mjs',
  'scripts/verify-watchlist-latest.mjs',
  'scripts/verify-watchlist-history.mjs',
  'scripts/verify-watchlist-page.mjs',
]) {
  const result = spawnSync(process.execPath, [script], { cwd: webRoot, encoding: 'utf8', env: process.env })
  assert.equal(result.status, 0, `${script} did not pass.\n${result.stdout}\n${result.stderr}`)
}

const spec = readRepo('docs/product/local-watchlist-spec.md')
const record = readRepo('docs/product/watchlist-v1-implementation-plan.md')
const roadmap = readRepo('docs/product/current-roadmap.md')
const schedule = readRepo('docs/product/current-schedule.md')
requireAll(spec, [
  'Status: accepted permanent product specification',
  '/twitch/watchlist/', '/kick/watchlist/',
  'viewloom.watchlist.twitch.v1', 'viewloom.watchlist.kick.v1',
  'maximum entries: 50 per provider',
  'No Watchlist-specific server API is required or allowed for v1.',
], 'Watchlist specification')
requireAll(record, [
  'Status: completed implementation record',
  'work-watchlist-w5-production         completion PR #425',
  'viewloom-watchlist-production-acceptance-v1',
  'No additional Local Watchlist branch is scheduled.',
], 'Watchlist implementation record')
requireAll(roadmap, ['Local Watchlist v1 is complete through PR #425.', 'Phase 9 P9H2  active', 'work-history-ui-h2-chart'], 'roadmap')
requireAll(schedule, ['P9H2 active', 'Active branch: work-history-ui-h2-chart'], 'schedule')

const model = readWeb('src/live/watchlist/model.ts')
const storage = readWeb('src/live/watchlist/storage.ts')
const latest = readWeb('src/live/watchlist/latest-model.ts')
const history = readWeb('src/live/watchlist/history-model.ts')
const combined = readWeb('src/live/watchlist/combined-controller.ts')
const page = readWeb('src/live/watchlist-page.ts')
const channel = readWeb('src/live/channel-watchlist.ts')
requireAll(model, [
  "export const WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
  'export const WATCHLIST_REVISION = 1',
  'export const WATCHLIST_MAX_ENTRIES = 50',
  'export const WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
], 'Watchlist model')
assert.ok(storage.includes('return `viewloom.watchlist.${provider}.v1`'))
assert.ok(latest.includes("provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'"))
assert.ok(history.includes("provider === 'kick' ? '/api/kick-history' : '/api/history'"))
requireAll(combined, ['latest.refresh(entries)', 'history.refresh(entries, period)'], 'Watchlist controller')
assert.equal((page.match(/\bfetch\s*\(/g) ?? []).length, 1)
requireAll(page, ['dataController.initialLoad', 'dataController.changePeriod', 'dataController.refresh', 'Open Channel', 'Open History', 'Open Heatmap'], 'Watchlist page')
requireAll(channel, ['Save to Watchlist', 'Saved in Watchlist', 'No data request was made.', 'addStoredWatchlistEntry'], 'Channel action')
for (const token of ['fetch(', 'setInterval(', 'serviceWorker', 'gtag(']) assert.equal(channel.includes(token), false, `Channel action contains ${token}`)
for (const token of ['setInterval(', 'navigator.serviceWorker', 'sessionStorage', 'indexedDB', 'document.cookie', 'navigator.sendBeacon', '/api/watchlist']) {
  assert.equal(page.includes(token), false, `Watchlist page contains ${token}`)
}

requireAll(readWeb('src/watchlist-candidate-responsive.css'), [
  '@media (max-width: 980px)', '@media (max-width: 760px)', '@media (max-width: 430px)',
  '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)', 'min-height: 44px',
], 'Watchlist responsive contract')
requireAll(readWeb('scripts/watchlist-browser-acceptance.mjs'), ['viewloom-watchlist-local-browser-acceptance-v1', 'verifyTwitchIntegratedDesktop', 'verifyKickMobile'], 'local acceptance')
requireAll(readWeb('scripts/watchlist-production-acceptance.mjs'), ['viewloom-watchlist-production-acceptance-v1', 'verifyHome', 'verifyWatchlist', 'verifyChannelSave'], 'production acceptance')

for (const root of [resolve(webRoot, 'functions'), resolve(repoRoot, 'workers')]) {
  if (!existsSync(root)) continue
  for (const path of walk(root)) {
    const normalized = relative(repoRoot, path).replaceAll('\\', '/')
    const source = readFileSync(path, 'utf8')
    assert.equal(/watchlist/i.test(normalized), false, `server file introduced: ${normalized}`)
    assert.equal(source.includes('/api/watchlist'), false, `endpoint introduced: ${normalized}`)
  }
}

for (const path of [
  '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
  '.github/workflows/watchlist-page.yml',
  '.github/workflows/watchlist-candidate.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/watchlist-production-acceptance.yml',
]) requireAll(readRepo(path), ['concurrency:', 'cancel-in-progress: true'], path)

console.log('Watchlist production contracts remain valid under active P9H2.')

function walk(root) {
  const files = []
  for (const entry of readdirSync(root)) {
    if (['node_modules', 'dist', '.wrangler'].includes(entry)) continue
    const path = resolve(root, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) files.push(...walk(path))
    else if (stats.isFile()) files.push(path)
  }
  return files
}
