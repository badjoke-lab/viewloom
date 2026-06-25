import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }
const requireFile = (path) => assert(existsSync(join(root, path)), `Missing required file: ${path}`)
const requireFragments = (path, fragments) => {
  if (!existsSync(join(root, path))) {
    failures.push(`Missing required file: ${path}`)
    return
  }
  const source = read(path)
  for (const fragment of fragments) assert(source.includes(fragment), `${path}: missing required fragment: ${fragment}`)
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
  'docs/operations/production-smoke-runbook.md',
  'docs/operations/history-production-acceptance-2026-06-23.md',
  'docs/operations/channel-production-acceptance-2026-06-23.md',
  'docs/operations/report-export-consolidation-acceptance-2026-06-24.md',
  'docs/operations/watchlist-production-acceptance-2026-06-25.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/history-and-trends-spec.md',
  'docs/product/history-layout-rebuild-plan.md',
  'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/product/channel-and-streamer-spec.md',
  'docs/product/report-export-consolidation-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/local-watchlist-spec.md',
  'docs/product/watchlist-v1-implementation-plan.md',
  'apps/web/docs/watchlist-latest-w2a-contract.md',
  'apps/web/docs/watchlist-history-w2b-contract.md',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/scripts/watchlist-browser-acceptance.mjs',
  'apps/web/scripts/watchlist-cloudflare-preview.mjs',
  'apps/web/scripts/watchlist-production-acceptance.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml',
  '.github/workflows/watchlist-page.yml',
  '.github/workflows/watchlist-candidate.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/watchlist-hosted-preview.yml',
  '.github/workflows/watchlist-production-acceptance.yml',
  '.github/pull_request_template.md',
]

for (const path of requiredFiles) requireFile(path)
for (const path of retiredNotes) assert(!existsSync(join(root, path)), `Retired temporary note must remain deleted: ${path}`)

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

requireFragments('README.md', [
  'Phase 7  source-of-truth reset and repair-program lock',
  'Phase 8  all-public-surface inventory and browser defect audit',
  'Phase 9  P0/P1 repair, with History UI as the central approved track',
  'work-history-ui-repair-governance',
  'work-public-surface-inventory',
  'history-ui-repair-spec.md',
  'history-ui-repair-plan.md',
  'history-ui-repair-working-note.md',
])

const index = read('docs/README.md')
for (const path of [
  'product/current-roadmap.md',
  'product/current-schedule.md',
  'product/history-and-trends-spec.md',
  'product/history-layout-rebuild-plan.md',
  'product/history-ui-repair-spec.md',
  'product/history-ui-repair-plan.md',
  'work-in-progress/history-ui-repair-working-note.md',
  'product/local-watchlist-spec.md',
  'product/watchlist-v1-implementation-plan.md',
  'operations/watchlist-production-acceptance-2026-06-25.md',
]) assert(index.includes(path), `docs/README.md: missing canonical link: ${path}`)
for (const note of retiredNotes) assert(!index.includes(note.replace('docs/', '')), `docs/README.md: retired note remains linked: ${note}`)
for (const fragment of [
  'Phase 7  source-of-truth reset and repair-program lock    active',
  'P7A      work-history-ui-repair-governance                active',
  'Phase 9  P0/P1 repair; History UI central track           approved and queued',
  'work-public-surface-inventory',
  'The following are P1 defects',
]) assert(index.includes(fragment), `docs/README.md: missing active repair state: ${fragment}`)

requireFragments('docs/product/current-roadmap.md', [
  'History & Trends | production baseline accepted; public-quality P1 repair approved',
  'Phase 7 — source-of-truth reset and repair-program lock',
  'Branch: work-history-ui-repair-governance',
  'Phase 8   all-public-surface inventory and browser defect audit',
  'Phase 9   P0/P1 core repair, with History UI repair as the central approved track',
  'P9H1 metric execution repair',
  'P9H2 chart axes, scale, units, and day-interaction repair',
  'Additional reference screenshots may refine styling later.',
  'No Phase 15 feature is approved by this roadmap.',
])

requireFragments('docs/product/current-schedule.md', [
  'History public-quality repair            approved P1 program',
  'Phase 7 source reset                     active',
  'Window: P7A',
  'Branch: work-history-ui-repair-governance',
  'P8A  work-public-surface-inventory       next after P7A merge report',
  'P8B  work-public-browser-audit',
  'P9H0 work-history-ui-h0-baseline',
  'P9H1 work-history-ui-h1-metric',
  'P9H2 work-history-ui-h2-chart',
  'P9H7 work-history-ui-h7-acceptance',
  'No later branch exists yet.',
])

requireFragments('docs/product/history-and-trends-spec.md', [
  'Status: accepted production product specification',
  'Viewer-minutes and Peak viewers metrics',
  'Overview',
  'Archives',
  'Report & Export',
  'Future changes must be classified as defect repair',
])
requireFragments('docs/product/history-layout-rebuild-plan.md', [
  'Status: completed implementation plan and permanent milestone record',
  'Future History changes must not be added to this completed milestone unless they are verified defects',
  'Maintenance changes must:',
])
requireFragments('docs/product/history-ui-repair-spec.md', [
  'Status: approved active repair specification',
  'Viewer-minutes and Peak viewers controls do not produce a sufficiently observable',
  'a readable X-axis with UTC date ticks',
  'a readable Y-axis or equivalent numeric scale',
  'A chart containing bars or lines without a readable scale',
  'A large empty container with no clear task or explanation is not acceptable.',
  'Additional reference screenshots',
  'This repair does not authorize another primary metric.',
  'production acceptance',
])
requireFragments('docs/product/history-ui-repair-plan.md', [
  'Status: active implementation plan',
  'P7A  work-history-ui-repair-governance',
  'P8A  work-public-surface-inventory',
  'P8B  work-public-browser-audit',
  'P9H0 work-history-ui-h0-baseline',
  'P9H1 work-history-ui-h1-metric',
  'P9H2 work-history-ui-h2-chart',
  'P9H3 work-history-ui-h3-overview',
  'P9H4 work-history-ui-h4-tasks',
  'P9H5 work-history-ui-h5-responsive',
  'P9H6 work-history-ui-h6-candidate',
  'P9H7 work-history-ui-h7-acceptance',
  'Checking only `aria-pressed` or button styling is insufficient.',
  'After each PR merge:',
])
requireFragments('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Status: active',
  'Current branch: `work-history-ui-repair-governance`',
  'Current window: P7A',
  'approved P1 defects',
  'Which module is authoritative for metric URL state?',
  'P8A  work-public-surface-inventory',
  'P9H7 work-history-ui-h7-acceptance',
  'Delete when: P9H7 production acceptance',
])

requireFragments('docs/product/local-watchlist-spec.md', [
  'Status: accepted permanent product specification',
  'Version: 1.1',
  '/twitch/watchlist/',
  '/kick/watchlist/',
  'production acceptance run: 28166806560',
])
requireFragments('docs/product/watchlist-v1-implementation-plan.md', [
  'Status: completed implementation record',
  'Version: 2.1',
  'work-watchlist-w5-production         completion PR #425',
  'No additional Local Watchlist branch is scheduled.',
])
requireFragments('docs/operations/watchlist-production-acceptance-2026-06-25.md', [
  'Status: completed permanent record',
  'viewloom-watchlist-production-acceptance-v1',
  '28166806560',
  '6 / 6 pass',
])

const pageSource = read('apps/web/src/live/watchlist-page.ts')
assert((pageSource.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist page must retain exactly one generic request seam')
for (const fragment of [
  'dataController.initialLoad',
  'dataController.changePeriod',
  'dataController.refresh',
  'dataController.retryLatest',
  'dataController.retryHistory',
  'dataController.taskLocal',
  'Not confirmed offline',
  'No complete history is implied',
]) assert(pageSource.includes(fragment), `Watchlist page missing permanent contract: ${fragment}`)
for (const forbidden of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) {
  assert(!pageSource.includes(forbidden), `Watchlist page contains forbidden behavior: ${forbidden}`)
}

const channelAction = read('apps/web/src/live/channel-watchlist.ts')
for (const fragment of ['Save to Watchlist', 'Saved in Watchlist', 'No data request was made.', 'addStoredWatchlistEntry']) {
  assert(channelAction.includes(fragment), `Channel Watchlist action missing: ${fragment}`)
}
for (const forbidden of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
  assert(!channelAction.includes(forbidden), `Channel Watchlist action contains forbidden behavior: ${forbidden}`)
}

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
  '.github/workflows/watchlist-candidate.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/watchlist-hosted-preview.yml',
  '.github/workflows/watchlist-production-acceptance.yml',
]

for (const path of concurrencyWorkflows) {
  requireFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  assert(source.includes('concurrency:'), `${path}: concurrency block missing`)
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
    assert(!source.includes('/api/watchlist'), `Watchlist-specific server endpoint introduced: ${path}`)
    assert(!source.includes('viewloom.watchlist.'), `browser-local Watchlist key leaked to server code: ${path}`)
  }
}

if (failures.length) {
  console.error('ViewLoom development policy verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom development, documentation, and deployment policy verification passed.')
console.log(`- ${requiredFiles.length} required files present`)
console.log('- completed temporary notes remain retired')
console.log('- Local Watchlist W0 through W5B remains governed as a completed production phase')
console.log('- History UI repair P7A is the only active work window')
console.log('- P8A public surface inventory is next only after P7A merge reporting and explicit continuation')
console.log(`- ${concurrencyWorkflows.length} active workflows cancel obsolete runs`)

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
