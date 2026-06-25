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
  'apps/web/src/watchlist-page.css',
  'apps/web/src/watchlist-touch.css',
  'apps/web/src/provider-home-shell.ts',
  'apps/web/src/provider-watchlist-link.css',
  'apps/web/twitch/watchlist/index.html',
  'apps/web/kick/watchlist/index.html',
  'apps/web/scripts/verify-watchlist-storage.mjs',
  'apps/web/scripts/verify-watchlist-latest.mjs',
  'apps/web/scripts/verify-watchlist-history.mjs',
  'apps/web/scripts/verify-watchlist-page.mjs',
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
    'W2B through PR #418',
    'W3A provider routes and the storage-first shell are the completion candidate in PR #419',
    'W3B evidence UI and approved entry points are next only after the PR #419 merge report',
  ]) assert(index.includes(fragment), `docs/README.md: missing current state: ${fragment}`)

  requireFragments('docs/product/current-roadmap.md', [
    'W2B complete PR #418; W3A completion candidate PR #419',
    'W3B evidence UI is next after merge report',
    'work-watchlist-w3b-ui',
    'apps/web/twitch/watchlist/index.html',
    'apps/web/src/live/watchlist-page.ts',
    'feature-data requests deliberately disabled until W3B',
    'no API, D1, binding, collector, cron, retention, or History visual change',
  ])
  requireFragments('docs/product/current-schedule.md', [
    'Local Watchlist W2B                      complete through PR #418',
    'Local Watchlist W3A                      completion candidate in PR #419',
    'Local Watchlist W3B                      next, not started',
    'W3B — evidence cards and approved entry points',
    'Branch: work-watchlist-w3b-ui',
    'populated W3A shell:    0 Heatmap + 0 History',
    'dedicated `Watchlist Page` workflow passed',
    'Do not begin W3B before the PR #419 merge report is issued.',
  ])
  requireFragments('docs/work-in-progress/watchlist-v1-working-note.md', [
    'Current branch: `work-watchlist-w3a-routes`',
    '#419 Add Local Watchlist provider route shells',
    'W2B History/combined foundation  complete PR #418',
    'W3A routes and shell             completion candidate PR #419',
    'W3B evidence UI/entry points     next, not started',
    'work-watchlist-w3b-ui',
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
    'readWatchlistStorage(storage, provider)',
    'addStoredWatchlistEntry',
    'removeStoredWatchlistEntry',
    'moveStoredWatchlistEntry',
    'clearStoredWatchlist',
    'resetStoredWatchlist',
    'readWatchlistStorageEvent',
    'window.history.pushState',
    "window.addEventListener('popstate'",
    "window.addEventListener('storage'",
    'Latest observation is not connected in the W3A storage-first shell.',
  ])
  const pageSource = read('apps/web/src/live/watchlist-page.ts')
  for (const forbidden of [
    '/api/twitch-heatmap',
    '/api/kick-heatmap',
    '/api/history',
    '/api/kick-history',
    'createWatchlistCombinedController',
    'setInterval(',
    'serviceWorker',
  ]) assert(!pageSource.includes(forbidden), `W3A page contains forbidden behavior: ${forbidden}`)
  assert(!/\bfetch\s*\(/.test(pageSource), 'W3A page must not issue feature-data requests')
  assert(!pageSource.includes('gtag('), 'W3A page must not send saved ids to analytics')

  requireFragments('apps/web/twitch/watchlist/index.html', [
    '<title>Twitch Local Watchlist — ViewLoom</title>',
    '<meta name="robots" content="noindex,follow" />',
    'https://vl.badjoke-lab.com/twitch/watchlist/',
    'TWITCH DATA · LOCAL WATCHLIST',
    'Saved only in this browser',
  ])
  requireFragments('apps/web/kick/watchlist/index.html', [
    '<title>Kick Local Watchlist — ViewLoom</title>',
    '<meta name="robots" content="noindex,follow" />',
    'https://vl.badjoke-lab.com/kick/watchlist/',
    'KICK DATA · LOCAL WATCHLIST',
    'Saved only in this browser',
  ])
  requireFragments('apps/web/scripts/verify-watchlist-page.mjs', [
    'Watchlist W3A route and storage-first shell verification passed.',
    'W3A controller must not issue feature-data requests.',
    'Watchlist was inserted into primary tabs.',
  ])
  requireFragments('.github/workflows/watchlist-page.yml', [
    'name: Watchlist Page',
    'Verify Watchlist route contract',
    'Verify desktop storage shell',
    'Verify narrow responsive shell',
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
console.log('- Watchlist W1, W2A, W2B, and W3A foundations are governed')
console.log('- Watchlist W3B is next only after PR #419 merge reporting')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)
