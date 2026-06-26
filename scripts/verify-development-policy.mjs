import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (condition, message) => { if (!condition) issues.push(message) }
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

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch',
  'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

for (const path of ['README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'PR #430', 'PR #432', 'PR #433', 'PR #434', 'work-history-ui-h2-chart',
])
need('README.md', [
  'P9H1 metric synchronization         complete PR #434',
  'Active implementation branch        none',
  'P9H2 branch created                 no',
  '28232602651', '7903212809',
])
need('docs/README.md', [
  'P9H1 completed through PR #434',
  'Active implementation branch                              none',
  'P9H2     work-history-ui-h2-chart',
])
need('AGENTS.md', [
  'P9H1 complete through PR #434',
  'Active implementation branch: none',
  'P9H2 branch created: no',
])
need('CONTRIBUTING.md', [
  'P9H1 complete through PR #434',
  'Active implementation branch: none',
  'P9H2 branch created: no',
])

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H1  complete PR #434',
  'Active implementation branch: none',
  'Exact next implementation branch: work-history-ui-h2-chart',
  'Workflow run: 28232602651',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H1 History metric synchronization      complete PR #434',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h2-chart',
  'P9H2 branch created                      no',
  'Workflow run: 28232602651',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.3',
  'Current implementation branch: none',
  'Completed metric synchronization: PR #434',
  '| 9 | P9H1 | complete PR #434',
  'P9H2 work-history-ui-h2-chart      exact next after explicit continuation; not created',
  'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 1.7',
  'Completed P9H1: PR #434',
  'Current implementation branch: none',
  'P9H2 work-history-ui-h2-chart      exact next; not created',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H1: PR #434',
  'Current implementation branch: none',
  'P9H2 work-history-ui-h2-chart',
  'Workflow run: 28232602651',
])

for (const path of [
  'README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md', 'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
]) forbid(path, [
  'Active implementation branch: work-history-ui-h1-metric',
  'Active implementation branch        work-history-ui-h1-metric',
  'Active implementation branch            work-history-ui-h1-metric',
  'Current implementation branch: `work-history-ui-h1-metric`',
  'P9H1 work-history-ui-h1-metric           active',
])

need('docs/product/cross-site-quality-remediation-spec.md', [
  'Status: approved future permanent specification', 'Roadmap phases: Phase 10–11',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'U10A work-quality-u10a-baseline', 'O11G work-operations-o11g-acceptance',
])
need('docs/product/localization-spec.md', [
  'en     English source language', 'ja     Japanese', 'es     Spanish',
  'pt-BR  Brazilian Portuguese', 'Arabic/RTL is not included',
])
need('docs/product/localization-implementation-plan.md', [
  'I13A work-i18n-i13a-contract', 'I14C work-i18n-i14c-acceptance',
])

const watchlistPage = read('apps/web/src/live/watchlist-page.ts')
check((watchlistPage.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist request seam changed')
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) {
  check(!watchlistPage.includes(token), `Watchlist page contains ${token}`)
}
const channelAction = read('apps/web/src/live/channel-watchlist.ts')
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) {
  check(!channelAction.includes(token), `Channel Watchlist contains ${token}`)
}

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

if (issues.length) {
  console.error('ViewLoom development and documentation verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom development and documentation verification passed.')
console.log('- P9H1 is complete through PR #434')
console.log('- there is no active implementation branch')
console.log('- work-history-ui-h2-chart is next and not created')
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
