import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }
const requireFile = (path) => assert(existsSync(join(root, path)), `Missing required file: ${path}`)
const requireFragments = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) {
    assert(source.includes(fragment), `${path}: missing required fragment: ${fragment}`)
  }
}

const retiredNotes = [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
  'docs/work-in-progress/phase5-data-capability-audit.md',
]

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'README.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/history-production-acceptance-2026-06-23.md',
  'docs/operations/channel-production-acceptance-2026-06-23.md',
  'docs/operations/report-export-consolidation-acceptance-2026-06-24.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  'docs/product/channel-and-streamer-spec.md',
  'docs/product/channel-v1-implementation-plan.md',
  'docs/product/report-export-consolidation-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/local-watchlist-spec.md',
  'docs/product/watchlist-v1-implementation-plan.md',
  'docs/work-in-progress/watchlist-v1-working-note.md',
  'apps/web/docs/shared-output-r1-contract.md',
  'apps/web/docs/history-output-r2-contract.md',
  'apps/web/docs/channel-output-r3-contract.md',
  'apps/web/src/live/watchlist/model.ts',
  'apps/web/src/live/watchlist/storage.ts',
  'apps/web/src/live/watchlist/url-state.ts',
  'apps/web/scripts/verify-watchlist-storage.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/watchlist-storage.yml',
  '.github/pull_request_template.md',
]

for (const path of requiredFiles) requireFile(path)
for (const path of retiredNotes) {
  assert(!existsSync(join(root, path)), `Completed temporary note must remain deleted: ${path}`)
}

if (failures.length === 0) {
  requireFragments('docs/operations/development-and-deployment-policy.md', [
    'Status: source of truth',
    '`work-*`',
    '`preview-*`',
    '`main` is the production branch',
    'Twitch and Kick remain separate',
  ])

  requireFragments('docs/operations/development-policy-addendum.md', [
    'Status: source of truth for documentation-first execution',
    'Preview custom include preview-*',
    'Production deployment identity and smoke: verified',
    'Active working note, if any:',
  ])

  requireFragments('docs/operations/documentation-governance.md', [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
  ])

  const index = read('docs/README.md')
  for (const path of [
    'product/current-roadmap.md',
    'product/current-schedule.md',
    'product/history-and-trends-spec.md',
    'product/channel-and-streamer-spec.md',
    'product/report-export-consolidation-plan.md',
    'product/next-feature-data-capability-audit.md',
    'product/local-watchlist-spec.md',
    'product/watchlist-v1-implementation-plan.md',
    'work-in-progress/watchlist-v1-working-note.md',
  ]) assert(index.includes(path), `docs/README.md: missing canonical document link: ${path}`)
  for (const note of retiredNotes) {
    assert(!index.includes(note.replace('docs/', '')), `docs/README.md: retired note is still linked: ${note}`)
  }
  for (const fragment of [
    'active Local Watchlist implementation ledger',
    'W1 storage foundation is the completion candidate in PR #416',
    'W2A latest adapter is next only after the PR #416 merge report',
    'pending History UI appearance revision',
  ]) assert(index.includes(fragment), `docs/README.md: missing current-state fragment: ${fragment}`)

  requireFragments('docs/product/current-roadmap.md', [
    'History & Trends | functional and production acceptance complete',
    'Channel / Streamer | v1 and production acceptance complete',
    'Report/export shared layer | R0–R4 complete through PR #413',
    'Phase 5 capability audit | complete through PR #414',
    'W0 complete through PR #415; W1 completion candidate in PR #416',
    'W2A latest adapter is next after merge report',
    'work-watchlist-w2a-latest',
    'apps/web/src/live/watchlist/model.ts',
    'exact versioned provider keys',
    'no direct browser-global, DOM, fetch, API, or style dependency',
    'History UI appearance work remains pending',
  ])

  requireFragments('docs/product/current-schedule.md', [
    'Local Watchlist W0                       complete through PR #415',
    'Local Watchlist W1                       completion candidate in PR #416',
    'Local Watchlist W2A                      next, not started',
    'W2A — latest Heatmap adapter and request foundation',
    'Branch: work-watchlist-w2a-latest',
    'viewloom.watchlist.twitch.v1',
    'write-failure rollback to the last persisted document',
    'dedicated Watchlist Storage source and runtime contract passed',
    'Do not begin W2A before the PR #416 merge report is issued.',
  ])

  requireFragments('docs/product/local-watchlist-spec.md', [
    'Status: active permanent product specification',
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    'Not in latest observed set',
    'Not confirmed offline',
    'No complete history is implied',
    'no per-channel request loop',
  ])

  requireFragments('docs/product/watchlist-v1-implementation-plan.md', [
    'Status: active implementation plan',
    'work-watchlist-w1-storage',
    'work-watchlist-w2a-latest',
    'work-watchlist-w2b-history',
    'work-watchlist-w3a-routes',
    'work-watchlist-w3b-ui',
    'work-watchlist-w3c-candidate',
    'work-watchlist-w4-contracts',
    'work-watchlist-w4-browser',
    'preview-watchlist-v1',
    'work-watchlist-w5-production',
    'No public Watchlist route is added in W1.',
    'no fetch or DOM dependency in the model/storage layer',
  ])

  requireFragments('docs/work-in-progress/watchlist-v1-working-note.md', [
    'Status: active implementation ledger',
    'Current branch: `work-watchlist-w1-storage`',
    '#416 Add Local Watchlist storage foundation',
    'W1  storage foundation           completion candidate PR #416',
    'W2A latest adapter               next, not started',
    'work-watchlist-w2a-latest',
    'Do not create the next branch until the user explicitly instructs continuation.',
  ])

  requireFragments('apps/web/src/live/watchlist/model.ts', [
    "WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
    'WATCHLIST_MAX_ENTRIES = 50',
    'WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
    'normalizeWatchlistChannelInput',
    'wrong-provider-url',
    'addWatchlistEntry',
    'moveWatchlistEntry',
  ])

  requireFragments('apps/web/src/live/watchlist/storage.ts', [
    'viewloom.watchlist.${provider}.v1',
    'parseWatchlistDocument',
    'readWatchlistStorage',
    'readWatchlistStorageEvent',
    'addStoredWatchlistEntry',
    'clearStoredWatchlist',
    'resetStoredWatchlist',
  ])

  requireFragments('apps/web/src/live/watchlist/url-state.ts', [
    'periodValue',
    "period: isWatchlistPeriod(periodValue) ? periodValue : '30d'",
    "url.searchParams.delete('period')",
    'sameWatchlistHistoryScope',
  ])

  requireFragments('apps/web/scripts/verify-watchlist-storage.mjs', [
    'Watchlist W1 storage verification passed.',
    'network dependency found',
    'direct browser-global dependency found',
    'limit-reached',
    'storage-corrupted',
    'write-failed',
    'sameWatchlistHistoryScope',
  ])

  requireFragments('docs/operations/history-production-acceptance-2026-06-23.md', [
    '3cde59cceb09a0c60f48794d6391cf5c356a1b31',
  ])
  requireFragments('docs/operations/channel-production-acceptance-2026-06-23.md', [
    'efc14295f0a372b96afac740d6a01571f7582210',
  ])
  requireFragments('docs/operations/report-export-consolidation-acceptance-2026-06-24.md', [
    'Closure PR: #413',
    'viewloom-history-export-v1',
    'viewloom-channel-v1',
  ])
  requireFragments('docs/product/next-feature-data-capability-audit.md', [
    'Closure PR: #414',
    'Local Watchlist v1 is approved',
    'No per-channel server request is required.',
  ])

  for (const entryPath of ['AGENTS.md', 'CONTRIBUTING.md']) {
    const source = read(entryPath)
    for (const path of [
      'docs/operations/development-and-deployment-policy.md',
      'docs/operations/documentation-governance.md',
      'docs/README.md',
      'docs/product/current-roadmap.md',
      'docs/product/current-schedule.md',
    ]) assert(source.includes(path), `${entryPath}: canonical document link is missing: ${path}`)
  }

  requireFragments('.github/pull_request_template.md', [
    '## Governing documents',
    'Roadmap phase:',
    'Schedule window:',
    'Active working note, if any:',
    'Unnecessary Cloudflare Preview deployments were not requested',
  ])
}

const concurrencyWorkflows = [
  '.github/workflows/development-policy.yml',
  '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml',
  '.github/workflows/web-verification.yml',
  '.github/workflows/provider-coverage-contract.yml',
  '.github/workflows/twitch-feature-coverage-audit.yml',
  '.github/workflows/kick-coverage-ui-checks.yml',
  '.github/workflows/history-browser-gate.yml',
  '.github/workflows/history-streamer-daily-stats.yml',
  '.github/workflows/history-additional-rankings.yml',
  '.github/workflows/history-peak-archive.yml',
  '.github/workflows/history-peak-browser.yml',
  '.github/workflows/history-battle-archive.yml',
  '.github/workflows/history-battle-browser.yml',
  '.github/workflows/history-period-comparison.yml',
  '.github/workflows/history-period-comparison-browser.yml',
  '.github/workflows/history-export.yml',
  '.github/workflows/history-export-browser.yml',
  '.github/workflows/history-report-export-h4.yml',
  '.github/workflows/history-report-export-h4-browser.yml',
  '.github/workflows/shared-output-r1.yml',
  '.github/workflows/channel-profile.yml',
  '.github/workflows/channel-profile-browser.yml',
  '.github/workflows/data-status-page.yml',
  '.github/workflows/data-status-browser.yml',
  '.github/workflows/platform-naming.yml',
  '.github/workflows/history-calendar-heat.yml',
  '.github/workflows/history-calendar-browser.yml',
  '.github/workflows/history-report-text.yml',
  '.github/workflows/history-report-browser.yml',
  '.github/workflows/history-view-shell.yml',
  '.github/workflows/history-view-shell-browser.yml',
  '.github/workflows/watchlist-storage.yml',
]

for (const path of concurrencyWorkflows) {
  requireFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  assert(source.includes('concurrency:'), `${path}: concurrency block is missing.`)
  assert(source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), `${path}: concurrency group is incorrect.`)
  assert(source.includes('cancel-in-progress: true'), `${path}: obsolete runs are not cancelled.`)
}

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development, documentation, and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} required files present`)
console.log('- completed temporary notes remain retired')
console.log('- Watchlist W1 foundation and provider separation are governed')
console.log('- Watchlist W2A is next only after PR #416 merge reporting')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
