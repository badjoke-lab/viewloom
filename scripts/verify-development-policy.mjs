import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const errors = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (condition, message) => { if (!condition) errors.push(message) }
const needFile = (path) => check(existsSync(join(root, path)), `missing file: ${path}`)
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}
const forbid = (path, fragments) => {
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(!source.includes(fragment), `${path}: stale ${fragment}`)
}

const requiredFiles = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-and-trends-spec.md', 'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/localization-spec.md', 'docs/product/localization-implementation-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/audits/P8A_SCOPE.md', 'docs/audits/P8B_SCOPE.md',
  'docs/audits/public-browser-defects.json', 'docs/audits/history-ui-h0-owner-map.json',
  'scripts/verify-public-surface-inventory.mjs', 'scripts/verify-public-browser-audit.mjs',
  'scripts/verify-history-ui-h0-baseline.mjs', 'scripts/verify-history-ui-h1-metric.mjs',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/src/live/watchlist-page.ts', 'apps/web/src/live/channel-watchlist.ts',
  '.github/workflows/development-policy.yml', '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml', '.github/workflows/history-ui-h0-baseline.yml',
  '.github/workflows/history-ui-h1-metric.yml', '.github/pull_request_template.md',
]
for (const path of requiredFiles) needFile(path)

for (const path of [
  'docs/work-in-progress/history-layout-rebuild-working-note.md',
  'docs/work-in-progress/channel-v1-audit.md',
  'docs/work-in-progress/report-export-r0-audit.md',
  'docs/work-in-progress/phase5-data-capability-audit.md',
  'docs/work-in-progress/watchlist-v1-working-note.md',
  'docs/work-in-progress/watchlist-w5a-hosted-preview-note.md',
  'docs/work-in-progress/watchlist-w5b-production-note.md',
]) check(!existsSync(join(root, path)), `retired note remains: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch',
  'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

for (const path of ['README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'PR #430', 'PR #432', 'PR #433', 'work-history-ui-h1-metric', 'work-history-ui-h2-chart',
])
need('README.md', ['Active implementation branch        work-history-ui-h1-metric', 'P9H2 branch created                 no'])
need('docs/README.md', ['Active implementation branch                              work-history-ui-h1-metric', 'P9H1     metric execution repair                           active'])
need('AGENTS.md', ['Active implementation branch: work-history-ui-h1-metric', 'P9H2 branch created: no'])
need('CONTRIBUTING.md', ['Active implementation branch: work-history-ui-h1-metric', 'P9H2 branch created: no'])

need('docs/product/current-roadmap.md', [
  'Final-state correction complete PR #433', 'Phase 9 P9H1  active',
  'Active implementation branch: work-history-ui-h1-metric', 'P9H2 has not been created.',
  'Phase 13  localization foundation plus English/Japanese',
  'Phase 14  Spanish/pt-BR localization and staged launch', 'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'Final-state correction                  complete PR #433',
  'Active implementation branch            work-history-ui-h1-metric',
  'Exact next branch                       work-history-ui-h2-chart', 'P9H2 branch created                     no',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.2', 'Current implementation branch: `work-history-ui-h1-metric`',
  'Completed final-state correction: PR #433', '| 9 | P9H1 | active',
  'P9H2 work-history-ui-h2-chart      exact next after P9H1 merge and explicit continuation',
  'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-spec.md', [
  'Version: 1.1', 'Viewer-minutes and Peak viewers do not update every metric-dependent surface.',
  'Architecture ownership contract', 'no new global `window.fetch` replacement', 'Localization boundary',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 1.6', 'Current implementation branch: `work-history-ui-h1-metric`',
  'P9H1 work-history-ui-h1-metric           active', 'work-history-ui-h2-chart',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Current implementation branch: `work-history-ui-h1-metric`',
  'The three metric-context expected failures must become passing assertions.', 'work-history-ui-h2-chart',
])

need('docs/product/cross-site-quality-remediation-spec.md', ['Status: approved future permanent specification', 'Roadmap phases: Phase 10–11'])
need('docs/product/cross-site-quality-remediation-plan.md', ['U10A work-quality-u10a-baseline', 'O11G work-operations-o11g-acceptance'])
need('docs/product/localization-spec.md', [
  'en     English source language', 'ja     Japanese', 'es     Spanish', 'pt-BR  Brazilian Portuguese',
  'Existing English URLs remain unchanged and canonical', 'Arabic/RTL is not included',
])
need('docs/product/localization-implementation-plan.md', ['I13A work-i18n-i13a-contract', 'I14C work-i18n-i14c-acceptance'])

for (const path of [
  'README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md', 'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
]) forbid(path, [
  'Active implementation branch: none', 'Active implementation branch        none',
  'Active implementation branch            none', 'Current implementation branch: none',
  'P9H1 branch created: no', 'P9H1 branch created                 no', 'exact next; not created',
])

const page = read('apps/web/src/live/watchlist-page.ts')
check((page.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist page request seam changed')
for (const fragment of ['dataController.initialLoad', 'dataController.changePeriod', 'dataController.refresh', 'dataController.retryLatest', 'dataController.retryHistory', 'dataController.taskLocal', 'Not confirmed offline', 'No complete history is implied']) {
  check(page.includes(fragment), `Watchlist page missing ${fragment}`)
}
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) check(!page.includes(token), `Watchlist page contains ${token}`)

const channel = read('apps/web/src/live/channel-watchlist.ts')
for (const fragment of ['Save to Watchlist', 'Saved in Watchlist', 'No data request was made.', 'addStoredWatchlistEntry']) check(channel.includes(fragment), `Channel Watchlist missing ${fragment}`)
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) check(!channel.includes(token), `Channel Watchlist contains ${token}`)

const workflows = [
  '.github/workflows/development-policy.yml', '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml', '.github/workflows/history-ui-h0-baseline.yml',
  '.github/workflows/history-ui-h1-metric.yml', '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml', '.github/workflows/web-verification.yml',
  '.github/workflows/provider-coverage-contract.yml', '.github/workflows/history-browser-gate.yml',
  '.github/workflows/history-peak-archive.yml', '.github/workflows/history-peak-browser.yml',
  '.github/workflows/history-battle-archive.yml', '.github/workflows/history-battle-browser.yml',
  '.github/workflows/history-period-comparison.yml', '.github/workflows/history-period-comparison-browser.yml',
  '.github/workflows/shared-output-r1.yml', '.github/workflows/channel-profile.yml',
  '.github/workflows/channel-profile-browser.yml', '.github/workflows/data-status-page.yml',
  '.github/workflows/data-status-browser.yml', '.github/workflows/platform-naming.yml',
  '.github/workflows/watchlist-storage.yml', '.github/workflows/watchlist-latest.yml',
  '.github/workflows/watchlist-history.yml', '.github/workflows/watchlist-page.yml',
  '.github/workflows/watchlist-candidate.yml', '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml', '.github/workflows/watchlist-hosted-preview.yml',
  '.github/workflows/watchlist-production-acceptance.yml',
]
for (const path of workflows) {
  needFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  check(source.includes('concurrency:'), `${path}: concurrency missing`)
  check(source.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), `${path}: concurrency group changed`)
  check(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

for (const serverRoot of ['apps/web/functions', 'workers']) {
  const absolute = resolve(root, serverRoot)
  if (!existsSync(absolute)) continue
  for (const file of walkFiles(absolute)) {
    const path = relative(root, file).replaceAll('\\', '/')
    const source = readFileSync(file, 'utf8')
    check(!/watchlist/i.test(path), `Watchlist server file introduced: ${path}`)
    check(!source.includes('/api/watchlist'), `Watchlist endpoint introduced: ${path}`)
    check(!source.includes('viewloom.watchlist.'), `Watchlist storage key leaked: ${path}`)
  }
}

if (errors.length) {
  console.error('ViewLoom development policy verification did not pass:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('ViewLoom development and documentation policy verification passed.')
console.log('- P9H1 is active on work-history-ui-h1-metric')
console.log('- work-history-ui-h2-chart is next but not created')
console.log('- Phase 10–14 authorities remain queued')
console.log('- Phase 16 remains unapproved')
console.log(`- ${workflows.length} workflows cancel obsolete runs`)

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
