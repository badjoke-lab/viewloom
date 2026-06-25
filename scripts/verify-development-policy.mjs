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
  'docs/product/post-watchlist-program-plan.md',
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
  'docs/audits/P8A_SCOPE.md',
  'docs/audits/P8B_SCOPE.md',
  'docs/audits/README.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-inventory.md',
  'docs/audits/public-surface-gaps.json',
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
  'docs/audits/public-surface-profiles-core.json',
  'docs/audits/public-surface-profiles-analysis.json',
  'docs/audits/public-surface-profiles-history.json',
  'docs/audits/public-surface-profiles-utility.json',
  'docs/audits/public-surface-schema-note.md',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit.mjs',
  'apps/web/scripts/public-browser-audit.mjs',
  'apps/web/docs/watchlist-latest-w2a-contract.md',
  'apps/web/docs/watchlist-history-w2b-contract.md',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/scripts/watchlist-browser-acceptance.mjs',
  'apps/web/scripts/watchlist-cloudflare-preview.mjs',
  'apps/web/scripts/watchlist-production-acceptance.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml',
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
  'Phase 7  source-of-truth reset',
  'Phase 8  public inventory and browser defect audit        P8B active',
  'work-public-browser-audit',
  'work-history-ui-h0-baseline',
  'docs/audits/P8B_SCOPE.md',
  'public-browser-audit.mjs',
  'post-watchlist-program-plan.md',
  'history-ui-repair-spec.md',
])

const index = read('docs/README.md')
for (const path of [
  'product/current-roadmap.md',
  'product/current-schedule.md',
  'product/post-watchlist-program-plan.md',
  'product/history-and-trends-spec.md',
  'product/history-layout-rebuild-plan.md',
  'product/history-ui-repair-spec.md',
  'product/history-ui-repair-plan.md',
  'work-in-progress/history-ui-repair-working-note.md',
  'audits/P8A_SCOPE.md',
  'audits/P8B_SCOPE.md',
  'audits/public-surface-inventory.json',
  'audits/public-surface-inventory.md',
  'audits/public-surface-gaps.json',
  'product/local-watchlist-spec.md',
  'product/watchlist-v1-implementation-plan.md',
  'operations/watchlist-production-acceptance-2026-06-25.md',
]) assert(index.includes(path), `docs/README.md: missing canonical link: ${path}`)
for (const note of retiredNotes) assert(!index.includes(note.replace('docs/', '')), `docs/README.md: retired note remains linked: ${note}`)
for (const fragment of [
  'Phase 7  source-of-truth reset',
  'P8A      work-public-surface-inventory                     complete PR #427',
  'P8B      work-public-browser-audit                         active',
  'P9H0     work-history-ui-h0-baseline                       exact next after P8B',
  'P8B scope summary',
  'Repository-comparison rule',
]) assert(index.includes(fragment), `docs/README.md: missing active P8B state: ${fragment}`)

requireFragments('docs/product/current-roadmap.md', [
  'P8B: active',
  'Current branch: work-public-browser-audit',
  'Exact next branch: work-history-ui-h0-baseline',
  'Phase 8   P8A inventory complete PR #427; P8B browser audit active',
  '21 owned routes × 4 required viewports',
  'Known History defects remain P1',
  'No Phase 15 feature is approved by this roadmap.',
])

requireFragments('docs/product/current-schedule.md', [
  'Phase 8 P8A inventory                    complete through PR #427',
  'Phase 8 P8B browser audit                active',
  'Current window: P8B — public browser defect audit',
  'Current branch: work-public-browser-audit',
  'Exact next branch after completion: work-history-ui-h0-baseline',
  'P8B  work-public-browser-audit           active',
  'P9H0 work-history-ui-h0-baseline         exact next after P8B unless P0 interrupts',
  'P8B evidence package',
  'P8B is active.',
])

requireFragments('docs/product/post-watchlist-program-plan.md', [
  'Status: active source-of-truth program plan',
  'Version: 1.2',
  'Current window: P8B',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
  '| 8 | P8A | complete PR #427',
  '| 8 | P8B | active | `work-public-browser-audit`',
  'P8B — active public browser defect audit',
  'U10A design tokens and component audit',
  'O11A unified acceptance matrix',
  'R12A Contact, Terms, Privacy, Refund Policy, Commercial Disclosure',
  'Phase 15 has no approved implementation branch.',
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
  'This repair does not authorize another primary metric.',
  'production acceptance',
])
requireFragments('docs/product/history-ui-repair-plan.md', [
  'Status: active implementation subplan',
  'Version: 1.3',
  'Current window: Phase 8 P8B',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
  'P8B  work-public-browser-audit           active',
  'P9H0 work-history-ui-h0-baseline         exact next after P8B unless P0 interrupts',
  'Checking only `aria-pressed`, selected styling, or button text is insufficient.',
  'P9H7 — hosted and production acceptance',
])
requireFragments('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Status: active',
  'Current window: P8B — public browser defect audit',
  'Current branch: `work-public-browser-audit`',
  'Exact next branch after P8B: `work-history-ui-h0-baseline`',
  'Approved P1 defects',
  'Active P8B package',
  'Current source observations to verify in browser',
  'P8B  work-public-browser-audit           active',
  'Delete when: P9H7 production acceptance',
])

requireFragments('docs/audits/P8A_SCOPE.md', [
  'Status: completed through PR #427',
  'did not repair product UI',
  'work-public-browser-audit',
])
requireFragments('docs/audits/P8B_SCOPE.md', [
  'Status: active',
  'Branch: `work-public-browser-audit`',
  'P8B is an audit branch.',
  'work-history-ui-h0-baseline',
])
requireFragments('docs/audits/README.md', [
  'Active Phase 8 P8B public browser defect audit',
  'P8B_SCOPE.md',
  'public-browser-defects.json',
  'public-browser-audit.md',
  'node scripts/verify-public-browser-audit.mjs',
])
requireFragments('docs/audits/public-surface-inventory.md', [
  'Status: completed Phase 8 P8A inventory',
  'Vite HTML inputs                 20',
  'Owned inventory entries          21',
  'History remains a known P1 surface',
  'work-public-browser-audit',
])
requireFragments('scripts/verify-public-surface-inventory.mjs', [
  "manifest.schema === 'viewloom-public-surface-inventory-v1'",
  "manifest.next_branch === 'work-public-browser-audit'",
  "history?.assessment === 'known_p1_defects'",
  "watchlist?.assessment === 'complete_for_v1_contract'",
  "'/commercial-disclosure/'",
])
requireFragments('scripts/verify-public-browser-audit.mjs', [
  'ViewLoom P8B repository verification passed.',
  'work-public-browser-audit',
  'work-history-ui-h0-baseline',
])
requireFragments('apps/web/scripts/public-browser-audit.mjs', [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  'productionMatrix',
  'historyScenarios',
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
])
requireFragments('.github/workflows/public-browser-audit.yml', [
  'name: Public Browser Audit',
  'Verify P8B repository state',
  'Run P8B public browser audit',
  'public-browser-audit-p8b',
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
  '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml',
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
console.log('- Local Watchlist W0 through W5B remains governed as completed production work')
console.log('- Phase 7 P7A is complete through PR #426')
console.log('- Phase 8 P8A is complete through PR #427')
console.log('- Phase 8 P8B work-public-browser-audit is the active audit window')
console.log('- work-history-ui-h0-baseline is next only after P8B merge reporting and explicit continuation')
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
