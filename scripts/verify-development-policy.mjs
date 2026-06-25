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
  'docs/product/channel-and-streamer-spec.md',
  'docs/product/report-export-consolidation-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/local-watchlist-spec.md',
  'docs/product/watchlist-v1-implementation-plan.md',
  'docs/work-in-progress/watchlist-v1-working-note.md',
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
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/watchlist-move-focus.ts',
  'apps/web/src/live/channel-watchlist.ts',
  'apps/web/src/watchlist-page.css',
  'apps/web/src/watchlist-touch.css',
  'apps/web/src/watchlist-evidence.css',
  'apps/web/src/channel-watchlist.css',
  'apps/web/src/provider-home-shell.ts',
  'apps/web/src/provider-watchlist-link.css',
  'apps/web/twitch/watchlist/index.html',
  'apps/web/kick/watchlist/index.html',
  'apps/web/twitch/channel/index.html',
  'apps/web/kick/channel/index.html',
  'apps/web/scripts/verify-watchlist-storage.mjs',
  'apps/web/scripts/verify-watchlist-latest.mjs',
  'apps/web/scripts/verify-watchlist-history.mjs',
  'apps/web/scripts/verify-watchlist-page.mjs',
  'apps/web/scripts/watchlist-shell-browser-fixture.mjs',
  'apps/web/scripts/watchlist-shell-browser-core.mjs',
  'apps/web/scripts/watchlist-shell-browser-narrow.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
  '.github/workflows/watchlist-page.yml',
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
  requireFragments('docs/operations/documentation-governance.md', [
    'Implementation must not begin from chat memory',
    'Temporary-note lifecycle',
    'delete the temporary note',
  ])

  const index = read('docs/README.md')
  for (const path of [
    'product/current-roadmap.md',
    'product/current-schedule.md',
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
    'W3A through PR #419',
    'W3B evidence cards and the approved Channel save entry point are the completion candidate in PR #420',
    'W3C responsive and accessibility candidate polish is next only after the PR #420 merge report',
  ]) assert(index.includes(fragment), `docs/README.md: missing current state: ${fragment}`)

  requireFragments('docs/product/current-roadmap.md', [
    'W3A PR #419; W3B completion candidate PR #420',
    'W3C candidate polish is next after merge report',
    'work-watchlist-w3b-ui',
    'work-watchlist-w3c-candidate',
    'Retry latest = 1 Heatmap + 0 History',
    'Retry History = 0 Heatmap + 1 History',
    'Channel save = 0 additional requests',
    'apps/web/src/live/channel-watchlist.ts',
    'no API, D1, binding, collector, cron, retention, rollup, or History visual change',
  ])
  requireFragments('docs/product/current-schedule.md', [
    'Local Watchlist W3A                      complete through PR #419',
    'Local Watchlist W3B                      completion candidate in PR #420',
    'Local Watchlist W3C                      next after merge report',
    'Branch: work-watchlist-w3b-ui',
    'PR: #420',
    'Retry latest:                   1 Heatmap + 0 History',
    'Retry History:                  0 Heatmap + 1 History',
    'Channel save:                   0 additional requests',
    'Do not begin W3C before the PR #420 merge report is issued.',
  ])
  requireFragments('docs/work-in-progress/watchlist-v1-working-note.md', [
    'Current branch: `work-watchlist-w3b-ui`',
    'Current PR: `#420 Connect Local Watchlist evidence and Channel save`',
    'W3A routes and shell             complete PR #419',
    'W3B evidence UI/entry points     completion candidate PR #420',
    'W3C candidate polish             next after merge report',
    'work-watchlist-w3c-candidate',
  ])

  requireFragments('docs/product/local-watchlist-spec.md', [
    '/twitch/watchlist/',
    '/kick/watchlist/',
    'viewloom.watchlist.twitch.v1',
    'viewloom.watchlist.kick.v1',
    'maximum entries: 50 per provider',
    'initial visible entries: 12',
    'Not confirmed offline',
    'No complete history is implied',
    'no per-channel request loop',
  ])
  requireFragments('docs/product/watchlist-v1-implementation-plan.md', [
    'work-watchlist-w3a-routes',
    'work-watchlist-w3b-ui',
    'work-watchlist-w3c-candidate',
    'W3A completion criteria',
    'W3B completion criteria',
  ])

  requireFragments('apps/web/docs/watchlist-latest-w2a-contract.md', [
    'viewloom-watchlist-latest-v1',
    'zero valid saved entries -> zero requests',
    'one through fifty saved entries -> exactly one provider request',
  ])
  requireFragments('apps/web/docs/watchlist-history-w2b-contract.md', [
    'viewloom-watchlist-history-v1',
    'present_retained',
    'history_partial',
    'period restore from page memory',
    'A latest failure must not remove retained evidence.',
  ])

  requireFragments('apps/web/src/live/watchlist-page.ts', [
    'createWatchlistCombinedController',
    'dataController.initialLoad',
    'dataController.changePeriod',
    'dataController.refresh',
    'dataController.retryLatest',
    'dataController.retryHistory',
    'dataController.taskLocal',
    'In latest observed set',
    'Not confirmed offline',
    'No complete history is implied',
    'Retained History unavailable',
    'Open Channel',
    'Open History',
    'Open Heatmap',
  ])
  const pageSource = read('apps/web/src/live/watchlist-page.ts')
  assert((pageSource.match(/\bfetch\s*\(/g) ?? []).length === 1, 'W3B page must expose exactly one generic request seam')
  for (const forbidden of ['setInterval(', 'serviceWorker', 'gtag(']) {
    assert(!pageSource.includes(forbidden), `W3B page contains forbidden behavior: ${forbidden}`)
  }

  requireFragments('apps/web/src/live/watchlist/combined-controller.ts', [
    "| 'retry_latest'",
    "| 'retry_history'",
    'retryLatest(',
    'retryHistory(',
  ])
  requireFragments('apps/web/src/live/channel-watchlist.ts', [
    'Save to Watchlist',
    'Saved in Watchlist',
    'No data request was made.',
    'addStoredWatchlistEntry',
    'readWatchlistStorageEvent',
  ])
  const channelAction = read('apps/web/src/live/channel-watchlist.ts')
  for (const forbidden of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
    assert(!channelAction.includes(forbidden), `Channel Watchlist action contains forbidden behavior: ${forbidden}`)
  }

  requireFragments('apps/web/twitch/watchlist/index.html', [
    '<title>Twitch Local Watchlist — ViewLoom</title>',
    '<meta name="robots" content="noindex,follow" />',
    'data-watchlist-retry-latest',
    'data-watchlist-retry-history',
    'data-watchlist-request-fact',
  ])
  requireFragments('apps/web/kick/watchlist/index.html', [
    '<title>Kick Local Watchlist — ViewLoom</title>',
    '<meta name="robots" content="noindex,follow" />',
    'data-watchlist-retry-latest',
    'data-watchlist-retry-history',
    'data-watchlist-request-fact',
  ])
  requireFragments('apps/web/twitch/channel/index.html', ['/src/live/channel-watchlist.ts'])
  requireFragments('apps/web/kick/channel/index.html', ['/src/live/channel-watchlist.ts'])
  requireFragments('apps/web/scripts/verify-watchlist-page.mjs', [
    'Watchlist W3B evidence UI and Channel entry-point verification passed.',
    'W3B page must have exactly one generic request seam.',
    'Watchlist was inserted into primary tabs.',
  ])
  requireFragments('.github/workflows/watchlist-page.yml', [
    'name: Watchlist Page',
    'Verify Watchlist route and evidence contract',
    'Verify desktop evidence and Channel save',
    'Verify narrow responsive evidence',
    'watchlist-page-artifacts',
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
console.log('- Watchlist W1, W2A, W2B, W3A, and W3B foundations are governed')
console.log('- Watchlist W3C is next only after PR #420 merge reporting')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
