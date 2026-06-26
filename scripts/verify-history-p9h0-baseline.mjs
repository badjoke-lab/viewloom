import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`Missing required file: ${path}`)
}
const requireFragments = (path, fragments) => {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path}: missing required fragment: ${fragment}`)
  }
}
const requireOrder = (path, first, second) => {
  requireFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  const firstIndex = source.indexOf(first)
  const secondIndex = source.indexOf(second)
  if (firstIndex < 0 || secondIndex < 0 || firstIndex >= secondIndex) {
    failures.push(`${path}: expected ${first} before ${second}`)
  }
}

const requiredFiles = [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/public-browser-defects.json',
  'docs/audits/public-browser-audit.md',
  'docs/audits/history-p9h0-ownership.md',
  'apps/web/docs/history-p9h0-baseline-contract.md',
  'apps/web/twitch/history/index.html',
  'apps/web/kick/history/index.html',
  'apps/web/src/live/history-usability-pass.ts',
  'apps/web/src/live/history-current-shell-entry.ts',
  'apps/web/src/live/history-clarity-hotfix.ts',
  'apps/web/src/live/history-clarity-compat.ts',
  'apps/web/src/live/history-usability.ts',
  'apps/web/src/live/history-number-format.ts',
  'apps/web/src/live/history-view-shell.ts',
  'apps/web/src/live/history-overview.ts',
  'apps/web/src/live/history-default-day.ts',
  'apps/web/src/live/history-archives.ts',
  'apps/web/src/live/history-visual-responsive.ts',
  'apps/web/src/live/history-additional-rankings-state.ts',
  'apps/web/src/live/history-peak-archive-state.ts',
  'apps/web/src/live/history-battle-archive-state.ts',
  'apps/web/src/live/history-calendar-heat-state.ts',
  'apps/web/src/live/history-report-text-state.ts',
]
for (const path of requiredFiles) requireFile(path)

requireFragments('docs/product/current-roadmap.md', [
  'Current window: P9H0',
  'Current branch: work-history-ui-h0-baseline',
  'work-history-ui-h1-metric',
])
requireFragments('docs/product/current-schedule.md', [
  'Current window: P9H0 — exact History baseline, ownership trace, and failing permanent gates',
  'Current branch: work-history-ui-h0-baseline',
  'Exact next branch after P9H0 merge report and explicit continuation: work-history-ui-h1-metric',
])
requireFragments('docs/product/history-ui-repair-spec.md', [
  'Architecture ownership contract',
  'one documented authoritative controller/state owner',
  'no new global `window.fetch` replacement',
  'no new document-wide `MutationObserver` used as primary History state management',
])
requireFragments('docs/product/history-ui-repair-plan.md', [
  'P9H0 work-history-ui-h0-baseline         active',
  'identify every module that owns or mutates History state/DOM',
  'add failing permanent assertions before repair',
])

for (const path of ['apps/web/twitch/history/index.html', 'apps/web/kick/history/index.html']) {
  requireOrder(path, '/src/live/history-usability-pass.ts', '/src/live/history-current-shell-entry.ts')
  requireFragments(path, [
    'data-history-metric="viewer_minutes"',
    'data-history-metric="peak_viewers"',
    'data-history-summary',
    'data-history-selected-day',
  ])
}
requireFragments('apps/web/twitch/history/index.html', [
  'data-provider="twitch"',
  'https://vl.badjoke-lab.com/twitch/history/',
])
requireFragments('apps/web/kick/history/index.html', [
  'data-provider="kick"',
  'https://vl.badjoke-lab.com/kick/history/',
])

requireFragments('apps/web/src/live/history-usability-pass.ts', [
  "import './history-clarity-hotfix'",
  "import './history-clarity-compat'",
  "import './history-usability'",
  "import './history-number-format'",
  "import './history-view-shell'",
  "import './history-overview'",
  "import './history-default-day'",
  "import './history-archives'",
  "import './history-visual-responsive'",
])

const entry = read('apps/web/src/live/history-current-shell-entry.ts')
for (const fragment of [
  "type HistoryMetric = 'viewer_minutes' | 'peak_viewers'",
  "const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'",
  "params.set('metric', pageState.metric)",
  'renderChart(payload, daily, metric)',
]) {
  if (!entry.includes(fragment)) failures.push(`primary History entry missing: ${fragment}`)
}

// P9H0 known failure: the summary and selected-day renderers do not receive the selected metric.
if (!entry.includes('renderSummary(payload, daily, top)')) failures.push('P9H0 known failure changed: renderSummary call now differs; update the scheduled repair contract')
if (!entry.includes('function renderSummary(payload: HistoryPayload, daily: Day[], top: Streamer[]): void')) failures.push('P9H0 known failure changed: renderSummary signature now differs')
if (!entry.includes('<span>viewer-minutes</span>')) failures.push('P9H0 known failure changed: hard-coded summary unit no longer present')
if (!entry.includes('renderSelectedDay(daily)')) failures.push('P9H0 known failure changed: renderSelectedDay call now differs')
if (!entry.includes('function renderSelectedDay(daily: Day[]): void')) failures.push('P9H0 known failure changed: renderSelectedDay signature now differs')
if (!entry.includes('<small>Viewer-minutes</small>') || !entry.includes('<small>Peak viewers</small>')) failures.push('P9H0 known failure changed: selected-day dual-metric block no longer present')

const fetchOwners = [
  'apps/web/src/live/history-clarity-hotfix.ts',
  'apps/web/src/live/history-usability.ts',
  'apps/web/src/live/history-overview.ts',
  'apps/web/src/live/history-additional-rankings-state.ts',
  'apps/web/src/live/history-peak-archive-state.ts',
  'apps/web/src/live/history-battle-archive-state.ts',
  'apps/web/src/live/history-calendar-heat-state.ts',
  'apps/web/src/live/history-report-text-state.ts',
]
for (const path of fetchOwners) {
  requireFragments(path, [
    'const originalFetch = window.fetch.bind(window)',
    'window.fetch = (async',
  ])
}

const documentObserverOwners = [
  'apps/web/src/live/history-clarity-hotfix.ts',
  'apps/web/src/live/history-clarity-compat.ts',
  'apps/web/src/live/history-usability.ts',
  'apps/web/src/live/history-number-format.ts',
  'apps/web/src/live/history-overview.ts',
  'apps/web/src/live/history-default-day.ts',
  'apps/web/src/live/history-archives.ts',
]
for (const path of documentObserverOwners) requireFragments(path, ['new MutationObserver'])

requireFragments('apps/web/src/live/history-view-shell.ts', [
  'const observer = new MutationObserver(scheduleRehome)',
  'history.replaceState = ((',
  "move('overview'",
  "moveArchive('daily'",
  "move('report'",
])
requireFragments('apps/web/src/live/history-visual-responsive.ts', [
  "'button[data-history-view]'",
  "'button[data-history-archive-view]'",
  'new MutationObserver',
])

const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))
for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
]) {
  const defect = (ledger.defects ?? []).find((item) => item.id === id)
  if (!defect || defect.severity !== 'P1') failures.push(`P9H0 baseline missing P1 defect: ${id}`)
}
if (ledger.counts?.p1 !== 3) failures.push('P9H0 baseline expects exactly three P8B P1 defects')

requireFragments('docs/audits/history-p9h0-ownership.md', [
  'Status: active P9H0 audit record',
  'history-current-shell-entry.ts',
  'Fetch wrapper chain',
  'Mutation and rehome chain',
  'P9H0 known-failure gates',
  'work-history-ui-h1-metric',
])
requireFragments('apps/web/docs/history-p9h0-baseline-contract.md', [
  'Status: active known-failure contract',
  'renderSummary()',
  'renderSelectedDay()',
  'P9H1 replaces metric known-failure assertions',
])

if (failures.length) {
  console.error('ViewLoom History P9H0 baseline verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom History P9H0 baseline verification passed.')
console.log('- Twitch and Kick retain the same governed History entry order')
console.log('- the primary controller/request/render owner is recorded')
console.log(`- ${fetchOwners.length} current History fetch-wrapper owners are explicit`)
console.log(`- ${documentObserverOwners.length} document-level observer owners are explicit`)
console.log('- metric summary/selected-day synchronization remains an expected P9H1 failure')
console.log('- keyboard entry remains an expected P9H5 failure backed by P8B evidence')
console.log('- task hierarchy remains an expected P9H3/P9H5 failure backed by P8B evidence')
console.log('- no product repair is claimed by this baseline gate')