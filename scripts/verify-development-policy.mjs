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
  'apps/web/docs/watchlist-latest-w2a-contract.md',
  'apps/web/docs/watchlist-history-w2b-contract.md',
  'apps/web/src/live/watchlist/model.ts',
  'apps/web/src/live/watchlist/storage.ts',
  'apps/web/src/live/watchlist/url-state.ts',
  'apps/web/src/live/watchlist/latest-model.ts',
  'apps/web/src/live/watchlist/latest-adapter.ts',
  'apps/web/src/live/watchlist/latest-controller.ts',
  'apps/web/src/live/watchlist/history-model.ts',
  'apps/web/src/live/watchlist/history-adapter.ts',
  'apps/web/src/live/watchlist/history-controller.ts',
  'apps/web/src/live/watchlist/combined-model.ts',
  'apps/web/src/live/watchlist/combined-controller.ts',
  'apps/web/scripts/verify-watchlist-storage.mjs',
  'apps/web/scripts/verify-watchlist-latest.mjs',
  'apps/web/scripts/verify-watchlist-history.mjs',
  'apps/web/scripts/watchlist-latest-adapter-cases.mjs',
  'apps/web/scripts/watchlist-latest-controller-cases.mjs',
  'apps/web/scripts/watchlist-history-fixtures.mjs',
  'apps/web/scripts/watchlist-history-adapter-core-cases.mjs',
  'apps/web/scripts/watchlist-history-adapter-error-cases.mjs',
  'apps/web/scripts/watchlist-history-evidence-cases.mjs',
  'apps/web/scripts/watchlist-history-controller-core-cases.mjs',
  'apps/web/scripts/watchlist-history-controller-error-cases.mjs',
  'apps/web/scripts/watchlist-combined-model-cases.mjs',
  'apps/web/scripts/watchlist-combined-controller-core-cases.mjs',
  'apps/web/scripts/watchlist-combined-controller-error-cases.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
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
    '../apps/web/docs/watchlist-latest-w2a-contract.md',
    '../apps/web/docs/watchlist-history-w2b-contract.md',
    'work-in-progress/watchlist-v1-working-note.md',
  ]) assert(index.includes(path), `docs/README.md: missing canonical link: ${path}`)
  for (const note of retiredNotes) {
    assert(!index.includes(note.replace('docs/', '')), `docs/README.md: retired note linked: ${note}`)
  }
  for (const fragment of [
    'active Local Watchlist implementation ledger',
    'W2A through PR #417',
    'W2B History/combined foundation is the completion candidate in PR #418',
    'W3A provider routes are next only after the PR #418 merge report',
    'pending History UI appearance revision',
  ]) assert(index.includes(fragment), `docs/README.md: missing current state: ${fragment}`)

  requireFragments('docs/product/current-roadmap.md', [
    'History & Trends | functional and production acceptance complete',
    'Channel / Streamer | v1 and production acceptance complete',
    'Report/export shared layer | R0–R4 complete through PR #413',
    'Phase 5 capability audit | complete through PR #414',
    'W0 complete PR #415; W1 complete PR #416; W2A complete PR #417; W2B completion candidate PR #418',
    'W3A provider routes are next after merge report',
    'work-watchlist-w3a-routes',
    'apps/web/docs/watchlist-history-w2b-contract.md',
    'apps/web/src/live/watchlist/history-model.ts',
    'apps/web/src/live/watchlist/combined-controller.ts',
    'cached Back/Forward period restore makes no request',
    'combined entries keep `stored`, `latest`, and `retained` axes independent',
    'no route, UI, API implementation, per-channel request, polling, or History visual change',
    'History UI appearance work remains pending',
  ])

  requireFragments('docs/product/current-schedule.md', [
    'Local Watchlist W0                       complete through PR #415',
    'Local Watchlist W1                       complete through PR #416',
    'Local Watchlist W2A                      complete through PR #417',
    'Local Watchlist W2B                      completion candidate in PR #418',
    'Local Watchlist W3A                      next, not started',
    'W3A — provider routes and storage-first shell',
    'Branch: work-watchlist-w3a-routes',
    'viewloom-watchlist-history-v1',
    'cached period restore:       0 Heatmap + 0 History',
    'dedicated `Watchlist History` workflow passed',
    'Do not begin W3A before the PR #418 merge report is issued.',
  ])

  requireFragments('docs/product/local-watchlist-spec.md', [
    'Status: active permanent product specification',
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    '/api/twitch-heatmap',
    '/api/kick-heatmap',
    '/api/history?period=<7d|30d>&metric=viewer_minutes',
    '/api/kick-history?period=<7d|30d>&metric=viewer_minutes',
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
    'present_retained',
    'history_partial',
    'history_unavailable',
    'Back/Forward period restore',
    'No public Watchlist route is added in W2B.',
  ])

  requireFragments('docs/work-in-progress/watchlist-v1-working-note.md', [
    'Status: active implementation ledger',
    'Current branch: `work-watchlist-w2b-history`',
    '#418 Add Watchlist retained History foundation',
    'W2A latest adapter               complete PR #417',
    'W2B History/combined foundation  completion candidate PR #418',
    'W3A routes and shell             next, not started',
    'work-watchlist-w3a-routes',
    'Do not create the next branch until the user explicitly instructs continuation.',
  ])

  requireFragments('apps/web/docs/watchlist-latest-w2a-contract.md', [
    'Status: active Phase 6 W2A contract',
    'viewloom-watchlist-latest-v1',
    'present_fresh',
    'present_stale',
    'latest_unavailable',
    'zero valid saved entries -> zero requests',
    'one through fifty saved entries -> exactly one provider request',
  ])
  requireFragments('apps/web/docs/watchlist-history-w2b-contract.md', [
    'Status: active Phase 6 W2B contract',
    'viewloom-watchlist-history-v1',
    'present_retained',
    'history_partial',
    'history_unavailable',
    'period restore from page memory',
    '0 Heatmap + 0 History',
    'A latest failure must not remove retained evidence.',
    'request functions are injected by the caller',
  ])

  requireFragments('apps/web/src/live/watchlist/model.ts', [
    "WATCHLIST_SCHEMA = 'viewloom-watchlist-v1'",
    'WATCHLIST_MAX_ENTRIES = 50',
    'WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12',
    'normalizeWatchlistChannelInput',
  ])
  requireFragments('apps/web/src/live/watchlist/storage.ts', [
    'viewloom.watchlist.${provider}.v1',
    'parseWatchlistDocument',
    'readWatchlistStorageEvent',
  ])
  requireFragments('apps/web/src/live/watchlist/url-state.ts', [
    "period: isWatchlistPeriod(periodValue) ? periodValue : '30d'",
    'sameWatchlistHistoryScope',
  ])
  requireFragments('apps/web/src/live/watchlist/latest-model.ts', [
    "WATCHLIST_LATEST_SCHEMA = 'viewloom-watchlist-latest-v1'",
    'present_fresh',
    'present_stale',
    'latest_unavailable',
    'latestEvidenceForEntries',
  ])
  requireFragments('apps/web/src/live/watchlist/latest-adapter.ts', [
    'normalizeTwitchHeatmapResponse',
    'normalizeKickHeatmapResponse',
    'normalizeProviderHeatmapResponse',
    'new Map<string, WatchlistLatestItem>()',
  ])
  requireFragments('apps/web/src/live/watchlist/latest-controller.ts', [
    'createWatchlistLatestController',
    'skipped_empty',
    'in_flight',
    'request-failed',
    'http-error',
    'json-error',
  ])
  requireFragments('apps/web/src/live/watchlist/history-model.ts', [
    "WATCHLIST_HISTORY_SCHEMA = 'viewloom-watchlist-history-v1'",
    'present_retained',
    'history_partial',
    'history_unavailable',
    'retainedById',
    'dailyAppearancesById',
    'retainedEvidenceForEntries',
  ])
  requireFragments('apps/web/src/live/watchlist/history-adapter.ts', [
    'normalizeTwitchHistoryResponse',
    'normalizeKickHistoryResponse',
    'normalizeProviderHistoryResponse',
    'normalizeTopRows',
    'normalizeDailyRows',
    'buildRetainedIndex',
    'mostRecentAppearance',
    'topSummaryPresent',
    'dailyAppearancePresent',
  ])
  requireFragments('apps/web/src/live/watchlist/history-controller.ts', [
    'createWatchlistHistoryController',
    'new Map<WatchlistPeriod, WatchlistHistorySnapshot>()',
    'new Map<WatchlistPeriod, Promise<WatchlistHistorySnapshot>>()',
    'skipped_empty',
    'in_flight',
    'request-failed',
    'http-error',
    'json-error',
  ])
  requireFragments('apps/web/src/live/watchlist/combined-model.ts', [
    'WatchlistCombinedEntry',
    'stored: WatchlistEntry',
    'latest: WatchlistLatestEvidence',
    'retained: WatchlistRetainedEvidence',
    'combineWatchlistEvidence',
  ])
  requireFragments('apps/web/src/live/watchlist/combined-controller.ts', [
    'createWatchlistCombinedController',
    'initial_load',
    'period_change',
    'refresh',
    'task_local',
    'Promise.all',
    'latestRequested',
    'historyRequested',
  ])

  requireFragments('apps/web/scripts/verify-watchlist-storage.mjs', [
    'Watchlist W1 storage verification passed.',
  ])
  requireFragments('apps/web/scripts/verify-watchlist-latest.mjs', [
    'Watchlist W2A latest verification passed.',
  ])
  requireFragments('apps/web/scripts/verify-watchlist-history.mjs', [
    'Watchlist W2B History verification passed.',
    'verifyHistoryAdapterCore',
    'verifyHistoryAdapterErrors',
    'verifyRetainedEvidence',
    'verifyHistoryControllerCore',
    'verifyHistoryControllerErrors',
    'verifyCombinedModel',
    'verifyCombinedControllerCore',
    'verifyCombinedControllerErrors',
    'global fetch dependency found',
    'forbidden browser dependency found',
  ])
  requireFragments('apps/web/scripts/watchlist-history-adapter-core-cases.mjs', [
    'daily_only',
    'top_only',
    'mostRecentAppearance',
    'partial',
    'demo',
  ])
  requireFragments('apps/web/scripts/watchlist-history-controller-core-cases.mjs', [
    '/api/history?period=7d&metric=viewer_minutes',
    '/api/history?period=30d&metric=viewer_minutes',
    '/api/kick-history?period=30d&metric=viewer_minutes',
    "new Set(['network', 'in_flight'])",
  ])
  requireFragments('apps/web/scripts/watchlist-combined-controller-core-cases.mjs', [
    'initial_load',
    'period_change',
    'task_local',
    'refresh',
    'fiftyLatest.calls.length',
    'fiftyHistory.calls.length',
  ])
  requireFragments('apps/web/scripts/watchlist-combined-controller-error-cases.mjs', [
    'latest_unavailable',
    'present_retained',
    'present_fresh',
    'history_unavailable',
    "new Set(['network', 'in_flight'])",
    'memory_only',
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
    ]) assert(source.includes(path), `${entryPath}: canonical link missing: ${path}`)
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
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
]

for (const path of concurrencyWorkflows) {
  requireFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  assert(source.includes('concurrency:'), `${path}: concurrency block missing`)
  assert(
    source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'),
    `${path}: concurrency group incorrect`,
  )
  assert(source.includes('cancel-in-progress: true'), `${path}: obsolete runs not cancelled`)
}

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development, documentation, and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} required files present`)
console.log('- completed temporary notes remain retired')
console.log('- Watchlist W1 storage, W2A latest, and W2B History foundations are governed')
console.log('- Watchlist W3A is next only after PR #418 merge reporting')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
