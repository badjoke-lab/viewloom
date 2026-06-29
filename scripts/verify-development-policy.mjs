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
  'docs/operations/history-production-acceptance-2026-06-28.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md', 'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/product/localization-spec.md', 'docs/product/localization-implementation-plan.md',
  'docs/work-in-progress/p9h5-activation.md', 'docs/work-in-progress/p9h6-candidate.md',
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

for (const path of [
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
]) check(!existsSync(join(root, path)), `completed temporary note still exists: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch',
  'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

for (const path of ['README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'Phase 9 History P1 repair',
  'P9H7 production acceptance',
  'PR #451',
  'work-quality-u10a-baseline',
])
need('README.md', [
  'P9H7 canonical closeout               complete PR #453',
  'Active implementation branch          none',
  'Accepted production SHA: 233a35ebe219c6be42723eb749e2bcc84ae7fc09',
  'Post-merge workflow/artifact: 28325951638 / 7935706617',
  'Phase 16 major feature                         not approved',
])
need('docs/README.md', [
  'P9H7 canonical closeout                         complete PR #453',
  'Active implementation branch                    none',
  'U10A branch created                             no',
  'operations/history-production-acceptance-2026-06-28.md',
])
for (const path of ['AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'P9H7 production acceptance complete through PR #451',
  'P9H7 canonical closeout complete through PR #453',
  'Active implementation branch: none',
  'U10A branch created: no',
])

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H7 production acceptance complete PR #451',
  'P9H7 canonical closeout complete PR #453',
  'Phase 9 History P1 repair complete',
  'Exact next implementation branch: work-quality-u10a-baseline',
  'U10A branch created: no',
  'Phase 10 cross-site quality remediation exact next',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H7 Hosted and production acceptance    complete PR #451',
  'P9H7 canonical closeout                  complete PR #453',
  'Phase 9 History P1 repair                complete',
  'Exact next branch                        work-quality-u10a-baseline',
  'Post-merge production workflow: 28325951638',
  'Post-merge artifact: 7935706617',
  '1440 / 820 / 390 / 360',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 3.4',
  'Current phase: Phase 10 — U10A defect and ownership baseline next',
  'Current implementation branch: none',
  'Exact next implementation branch after explicit continuation: `work-quality-u10a-baseline`',
  'Completed History production acceptance: PR #451',
  'Completed History canonical closeout: PR #453',
  'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-spec.md', [
  'Status: accepted and complete',
  'Phase 9 — History P1 repair complete',
  'the temporary working note is deleted',
])
need('docs/product/history-ui-repair-plan.md', [
  'Status: complete',
  'Version: 2.8',
  'Completed P9H7 production acceptance: PR #451',
  'Completed P9H7 canonical closeout: PR #453',
  'Exact next branch after explicit continuation: `work-quality-u10a-baseline`',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'Status: permanent acceptance record',
  'Implementation PR: #451',
  'Closeout PR: #453',
  'Accepted production commit: `233a35ebe219c6be42723eb749e2bcc84ae7fc09`',
  'Pre-merge production: workflow 28325492470, artifact 7935573120, pass',
  'Post-merge production: workflow 28325951638, artifact 7935706617, pass',
  'Twitch observed streams: 300',
  'Kick observed streams: 100',
  'History Phase 9 is accepted in production.',
  'work-quality-u10a-baseline',
])

need('docs/work-in-progress/p9h6-candidate.md', [
  'Status: complete', 'Implementation PR: #449', 'Canonical closeout PR: #450',
  'work-history-ui-h7-acceptance', 'P9H7 branch created: no',
])
need('scripts/verify-history-ui-h7-acceptance.mjs', [
  'History UI P9H7 repository verification passed.',
  'completed temporary notes are absent',
  'Phase 10 U10A is exact next and uncreated',
])
need('scripts/verify-history-ui-h7-evidence.mjs', [
  'viewloom-history-ui-h7-hosted-acceptance-v1',
  'assert.equal(evidence.scenarios.length, 5)',
])
need('apps/web/scripts/history-ui-h7-hosted-acceptance.mjs', [
  "schema: 'viewloom-history-ui-h7-hosted-acceptance-v1'",
  "phase: 'P9H7'", "payload?.source === 'real'",
  "binding: 'DB_TWITCH_HOT'", "binding: 'DB_KICK_HOT'",
])

need('docs/product/cross-site-quality-remediation-spec.md', [
  'Status: approved future permanent specification', 'Roadmap phases: Phase 10–11',
  'Entry condition: P9H7 History production acceptance complete',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'U10A work-quality-u10a-baseline', 'O11G work-operations-o11g-acceptance',
  'No product repair in U10A except proven P0 isolation.',
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
console.log('- Phase 9 History repair is permanently accepted and closed')
console.log('- completed temporary History notes are absent')
console.log('- Phase 10 U10A is exact next and uncreated')
console.log('- Phase 11–16 are not active')
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
