import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }
const needFile = (path) => assert(existsSync(join(root, path)), `Missing required file: ${path}`)
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) assert(source.includes(fragment), `${path}: missing ${fragment}`)
}
const forbid = (path, fragments) => {
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) assert(!source.includes(fragment), `${path}: stale fragment remains: ${fragment}`)
}

const retiredNotes = [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
  'docs/work-in-progress/phase5-data-capability-audit.md',
  'docs/work-in-progress/watchlist-v1-working-note.md',
  'docs/work-in-progress/watchlist-w5a-hosted-preview-note.md',
  'docs/work-in-progress/watchlist-w5b-production-note.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy-2.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy-3.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy-4.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy-5.md',
  'docs/work-in-progress/watchlist-w5b-production-note-copy-6.md',
]

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/localization-spec.md',
  'docs/product/localization-implementation-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/P8A_SCOPE.md',
  'docs/audits/P8B_SCOPE.md',
  'docs/audits/public-browser-defects.json',
  'docs/audits/public-browser-audit.md',
  'docs/audits/history-ui-h0-baseline.md',
  'docs/audits/history-ui-h0-owner-map.json',
  'docs/audits/history-ui-h0-source-map.md',
  'docs/audits/history-ui-h0-findings.md',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit.mjs',
  'scripts/verify-history-ui-h0-baseline.mjs',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/history-ui-h0-baseline.yml',
  '.github/pull_request_template.md',
]
for (const path of requiredFiles) needFile(path)
for (const path of retiredNotes) assert(!existsSync(join(root, path)), `Retired note must remain deleted: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth',
  '`work-*`',
  '`preview-*`',
  '`main` is the production branch',
  'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory',
  'Temporary-note lifecycle',
  'delete the temporary note',
])

need('README.md', [
  'P9H0 complete PR #430',
  'work-p9h0-closeout',
  'work-history-ui-h1-metric',
  'cross-site-quality-remediation-spec.md',
  'localization-spec.md',
  'No Phase 16 feature is approved.',
])
need('docs/README.md', [
  'P9H0 completed through PR #430.',
  'C9H0     work-p9h0-closeout',
  'P9H1     work-history-ui-h1-metric',
  'product/cross-site-quality-remediation-spec.md',
  'product/localization-spec.md',
])

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H0  complete PR #430',
  'P9H0 closeout active on work-p9h0-closeout',
  'work-history-ui-h1-metric',
  'Phase 13  localization foundation plus English/Japanese',
  'Phase 14  Spanish/pt-BR localization and staged launch',
  'No Phase 16 feature is approved.',
])
forbid('docs/product/current-roadmap.md', [
  'P8B: active',
  'Current branch: work-public-browser-audit',
  'No Phase 15 feature is approved',
])

need('docs/product/current-schedule.md', [
  'History P9H0 deterministic baseline      complete PR #430',
  'Current window: P9H0 documentation closeout',
  'Current branch: work-p9h0-closeout',
  'work-history-ui-h1-metric',
  'P9H1 has not been created.',
  'Phase 13  I13A–I13K',
  'Phase 14  I14A–I14C',
])
forbid('docs/product/current-schedule.md', [
  'Current window: P8B — public browser defect audit',
  'P8B is active.',
])

need('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.0',
  'Current window: P9H0 documentation closeout',
  'Current branch: `work-p9h0-closeout`',
  '| 9 | P9H0 | complete PR #430',
  'U10A defect ledger and ownership baseline',
  'O11D browser application strict-null migration',
  'I13A localization contract and route manifest',
  'I14A Spanish catalog and QA',
  'Phase 16 begins only after one candidate is separately approved',
])

need('docs/product/history-ui-repair-spec.md', [
  'Version: 1.1',
  'Viewer-minutes and Peak viewers do not update every metric-dependent surface.',
  'Architecture ownership contract',
  'no new global `window.fetch` replacement',
  'Localization boundary',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 1.4',
  'Completed window: P9H0 through PR #430',
  'Current branch: `work-p9h0-closeout`',
  'work-history-ui-h1-metric',
  'P9H0 completed baseline',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed predecessor: P9H0 through PR #430',
  'Current branch: `work-p9h0-closeout`',
  'work-history-ui-h1-metric',
  'P9H0 evidence',
  'P9H1 exact scope',
])

need('docs/product/cross-site-quality-remediation-spec.md', [
  'Status: approved future permanent specification',
  'Roadmap phases: Phase 10–11',
  'Architecture contract',
  'Type safety and CI',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'U10A work-quality-u10a-baseline',
  'U10H work-quality-u10h-acceptance',
  'O11A work-operations-o11a-matrix',
  'O11G work-operations-o11g-acceptance',
])
need('docs/product/localization-spec.md', [
  'en     English source language',
  'ja     Japanese',
  'es     Spanish',
  'pt-BR  Brazilian Portuguese',
  'Existing English URLs remain unchanged and canonical',
  'Do not translate or synthesize',
  'Arabic/RTL is not included',
])
need('docs/product/localization-implementation-plan.md', [
  'I13A work-i18n-i13a-contract',
  'I13K work-i18n-i13k-acceptance',
  'I14A work-i18n-i14a-spanish',
  'I14C work-i18n-i14c-acceptance',
])

need('docs/audits/P8B_SCOPE.md', [
  'Status: complete through PR #428',
  'Merge commit: `b2dd44dff6efd9da78a3ddd28f2ed26661bf9eb8`',
  'P8B was audit-only.',
])
need('docs/audits/history-ui-h0-findings.md', [
  'history-metric-summary-stale',
  'history-selected-day-context-stale',
  'history-metric-ranking-context-stale',
  'history-mobile-task-flow-too-long',
  'production/local discrepancy',
])

for (const path of ['AGENTS.md', 'CONTRIBUTING.md']) {
  need(path, [
    'docs/product/post-watchlist-program-plan.md',
    'work-p9h0-closeout',
    'work-history-ui-h1-metric',
  ])
}
need('.github/pull_request_template.md', [
  'Program plan:',
  'Predecessor merge and explicit continuation:',
  'Exact next branch after merge:',
  'Localization route/catalog/SEO changes:',
])

const pageSource = read('apps/web/src/live/watchlist-page.ts')
assert((pageSource.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist page must retain one generic request seam')
for (const fragment of [
  'dataController.initialLoad',
  'dataController.changePeriod',
  'dataController.refresh',
  'dataController.retryLatest',
  'dataController.retryHistory',
  'dataController.taskLocal',
  'Not confirmed offline',
  'No complete history is implied',
]) assert(pageSource.includes(fragment), `Watchlist page missing: ${fragment}`)
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) assert(!pageSource.includes(token), `Watchlist page contains forbidden behavior: ${token}`)

const channelAction = read('apps/web/src/live/channel-watchlist.ts')
for (const fragment of ['Save to Watchlist', 'Saved in Watchlist', 'No data request was made.', 'addStoredWatchlistEntry']) assert(channelAction.includes(fragment), `Channel Watchlist action missing: ${fragment}`)
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) assert(!channelAction.includes(token), `Channel Watchlist action contains forbidden behavior: ${token}`)

const concurrencyWorkflows = [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/history-ui-h0-baseline.yml',
  '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml',
  '.github/workflows/web-verification.yml',
  '.github/workflows/provider-coverage-contract.yml',
  '.github/workflows/history-browser-gate.yml',
  '.github/workflows/history-peak-archive.yml',
  '.github/workflows/history-peak-browser.yml',
  '.github/workflows/history-battle-archive.yml',
  '.github/workflows/history-battle-browser.yml',
  '.github/workflows/history-period-comparison.yml',
  '.github/workflows/history-period-comparison-browser.yml',
  '.github/workflows/shared-output-r1.yml',
  '.github/workflows/channel-profile.yml',
  '.github/workflows/channel-profile-browser.yml',
  '.github/workflows/data-status-page.yml',
  '.github/workflows/data-status-browser.yml',
  '.github/workflows/platform-naming.yml',
  '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
  '.github/workflows/watchlist-page.yml',
  '.github/workflows/watchlist-candidate.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/watchlist-hosted-preview.yml',
  '.github/workflows/watchlist-production-acceptance.yml',
]
for (const path of concurrencyWorkflows) {
  needFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  assert(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert(source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), `${path}: concurrency group incorrect`)
  assert(source.includes('cancel-in-progress: true'), `${path}: obsolete runs not cancelled`)
}

for (const serverRoot of ['apps/web/functions', 'workers']) {
  const absolute = resolve(root, serverRoot)
  if (!existsSync(absolute)) continue
  for (const file of walkFiles(absolute)) {
    const path = relative(root, file).replaceAll('\\', '/')
    assert(!/watchlist/i.test(path), `Watchlist-specific server file introduced: ${path}`)
    const source = readFileSync(file, 'utf8')
    assert(!source.includes('/api/watchlist'), `Watchlist endpoint introduced: ${path}`)
    assert(!source.includes('viewloom.watchlist.'), `Watchlist storage key leaked to server: ${path}`)
  }
}

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development, documentation, and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} required files present`)
console.log('- Phase 8 is complete through PR #428')
console.log('- P9H0 is complete through PR #430')
console.log('- work-p9h0-closeout is the active documentation window')
console.log('- work-history-ui-h1-metric is next only after closeout reporting and explicit continuation')
console.log('- Phase 10–14 quality and localization authorities are registered but not active')
console.log('- Phase 16 has no approved feature')
console.log(`- ${concurrencyWorkflows.length} workflows cancel obsolete runs`)

function walkFiles(directory) {
  const files = []
  for (const name of readdirSync(directory)) {
    if (['.git', 'node_modules', 'dist', '.wrangler'].includes(name)) continue
    const path = join(directory, name)
    const stats = statSync(path)
    if (stats.isDirectory()) files.push(...walkFiles(path))
    else if (stats.isFile() && /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|toml|md|html|css|sql|py)$/i.test(name)) files.push(path)
  }
  return files
}
