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

const requiredFiles = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/development-policy-addendum.md',
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md', 'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md', 'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h5-activation.md', 'docs/work-in-progress/p9h6-candidate.md',
  'docs/work-in-progress/p9h7-acceptance.md',
  'scripts/verify-history-ui-h0-baseline.mjs', 'scripts/verify-history-ui-h1-metric.mjs',
  'scripts/verify-history-ui-h2-chart.mjs', 'scripts/verify-history-ui-h3-overview.mjs',
  'scripts/verify-history-ui-h4a-overview.mjs', 'scripts/verify-history-ui-h4b-tasks.mjs',
  'scripts/verify-history-ui-h5-responsive.mjs', 'scripts/verify-history-ui-h6-candidate.mjs',
  'scripts/verify-history-ui-h7-acceptance.mjs', 'scripts/verify-history-ui-h7-evidence.mjs',
  'apps/web/scripts/history-ui-h6-candidate-manifest.mjs',
  'apps/web/scripts/history-ui-h7-hosted-acceptance.mjs',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/src/live/watchlist-page.ts', 'apps/web/src/live/channel-watchlist.ts',
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
  'PR #430', 'PR #434', 'PR #439', 'PR #441', 'PR #443', 'PR #447', 'PR #449', 'PR #450',
  'work-history-ui-h3-overview', 'work-history-ui-h4-tasks', 'work-history-ui-h5-responsive',
  'work-history-ui-h6-candidate', 'work-history-ui-h7-acceptance', 'preview-history-ui-h7-acceptance',
])
need('README.md', [
  'P9H6 local candidate               complete PR #449',
  'P9H6 canonical closeout             complete PR #450',
  'P9H7 hosted/production acceptance  active',
  'Active implementation branch        work-history-ui-h7-acceptance',
  'Preview branch                      preview-history-ui-h7-acceptance',
  '28308389704', '7930159988',
])
need('docs/README.md', [
  'P9H6     work-history-ui-h6-candidate                    complete PR #449',
  'P9H6 canonical closeout complete PR #450',
  'P9H7     work-history-ui-h7-acceptance                   active',
  'Active implementation branch                            work-history-ui-h7-acceptance',
  'Preview branch                                          preview-history-ui-h7-acceptance',
])
for (const path of ['AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'P9H6 complete through PR #449',
  'P9H6 canonical closeout complete through PR #450',
  'P9H7 active on work-history-ui-h7-acceptance',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Preview branch: preview-history-ui-h7-acceptance',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H6 complete PR #449', 'P9H6 canonical closeout complete PR #450',
  'Phase 9 P9H7 active',
  'Active implementation branch: work-history-ui-h7-acceptance',
  'Preview branch: preview-history-ui-h7-acceptance',
  'Phase 10 cross-site repair blocked until P9H7 closure',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H6 Local candidate                     complete PR #449',
  'P9H6 canonical closeout                  complete PR #450',
  'P9H7 Hosted and production acceptance    active',
  'Active implementation branch             work-history-ui-h7-acceptance',
  'Preview branch                           preview-history-ui-h7-acceptance',
  'Workflow run: 28308389704', 'Artifact ID: 7930159988',
  'viewloom-history-ui-h6-candidate-v1', '1440 / 820 / 390 / 360',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 3.3', 'Current phase: Phase 9 — P9H7 hosted and production acceptance',
  'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Completed local candidate: PR #449', 'Completed P9H6 canonical closeout: PR #450',
  'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 2.7', 'Completed P9H6: PR #449',
  'Completed P9H6 canonical closeout: PR #450',
  'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Active P9H7 — Hosted and production acceptance',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H6: PR #449', 'Completed P9H6 canonical closeout: PR #450',
  'P9H7 active', 'Current implementation branch: `work-history-ui-h7-acceptance`',
  'Current Preview branch: `preview-history-ui-h7-acceptance`',
  'Workflow run: 28308389704', 'Artifact ID: 7930159988',
])
need('docs/work-in-progress/p9h6-candidate.md', [
  'Status: complete', 'Implementation PR: #449', 'Canonical closeout PR: #450',
  'work-history-ui-h7-acceptance', 'P9H7 branch created: no',
])
need('docs/work-in-progress/p9h7-acceptance.md', [
  'Status: active', 'Implementation branch: `work-history-ui-h7-acceptance`',
  'Preview branch: `preview-history-ui-h7-acceptance`', 'Preview sequencing exception',
  'only the exact final work-branch HEAD may be moved to the Preview ref',
])
need('scripts/verify-history-ui-h7-acceptance.mjs', [
  'History UI P9H7 repository verification passed.',
  'Phase 10 remains blocked until P9H7 closure',
])
need('scripts/verify-history-ui-h7-evidence.mjs', [
  'viewloom-history-ui-h7-hosted-acceptance-v1',
  "assert.equal(evidence.scenarios.length, 5)",
])
need('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs', [
  "schema: 'viewloom-history-ui-h7-hosted-acceptance-v1'",
  "phase: 'P9H7'", "payload?.source === 'real'",
  "binding: 'DB_TWITCH_HOT'", "binding: 'DB_KICK_HOT'",
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
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) check(!watchlistPage.includes(token), `Watchlist page contains ${token}`)
const channelAction = read('apps/web/src/live/channel-watchlist.ts')
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) check(!channelAction.includes(token), `Channel Watchlist contains ${token}`)

const workflows = [
  '.github/workflows/development-policy.yml', '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml', '.github/workflows/history-ui-h0-baseline.yml',
  '.github/workflows/history-ui-h1-metric.yml', '.github/workflows/history-ui-h2-chart.yml',
  '.github/workflows/history-ui-h3-overview.yml', '.github/workflows/history-ui-h4a-overview.yml',
  '.github/workflows/history-ui-h4b-tasks.yml', '.github/workflows/history-ui-h5-responsive.yml',
  '.github/workflows/history-ui-h6-candidate.yml', '.github/workflows/history-ui-h7-acceptance.yml',
  '.github/workflows/web-build.yml', '.github/workflows/web-checks.yml',
  '.github/workflows/web-verification.yml', '.github/workflows/provider-coverage-contract.yml',
  '.github/workflows/history-browser-gate.yml', '.github/workflows/history-peak-archive.yml',
  '.github/workflows/history-peak-browser.yml', '.github/workflows/history-battle-archive.yml',
  '.github/workflows/history-battle-browser.yml', '.github/workflows/history-period-comparison.yml',
  '.github/workflows/history-period-comparison-browser.yml', '.github/workflows/shared-output-r1.yml',
  '.github/workflows/channel-profile.yml', '.github/workflows/channel-profile-browser.yml',
  '.github/workflows/data-status-page.yml', '.github/workflows/data-status-browser.yml',
  '.github/workflows/platform-naming.yml', '.github/workflows/watchlist-storage.yml',
  '.github/workflows/watchlist-latest.yml', '.github/workflows/watchlist-history.yml',
  '.github/workflows/watchlist-page.yml', '.github/workflows/watchlist-candidate.yml',
  '.github/workflows/watchlist-contracts.yml', '.github/workflows/watchlist-browser.yml',
  '.github/workflows/watchlist-hosted-preview.yml', '.github/workflows/watchlist-production-acceptance.yml',
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
console.log('- P9H6 is complete through PR #449 and canonically closed through PR #450')
console.log('- P9H7 is active on work-history-ui-h7-acceptance')
console.log('- exact Preview and production identity remain mandatory')
console.log('- Phase 10 remains blocked until P9H7 closure')
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
