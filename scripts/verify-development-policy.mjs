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
  'docs/operations/documentation-governance.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md', 'docs/product/history-ui-repair-spec.md',
  'docs/product/history-ui-repair-plan.md', 'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h5-activation.md', 'docs/work-in-progress/p9h6-candidate.md',
  'scripts/verify-history-ui-h0-baseline.mjs', 'scripts/verify-history-ui-h1-metric.mjs',
  'scripts/verify-history-ui-h2-chart.mjs', 'scripts/verify-history-ui-h3-overview.mjs',
  'scripts/verify-history-ui-h4a-overview.mjs', 'scripts/verify-history-ui-h4b-tasks.mjs',
  'scripts/verify-history-ui-h5-responsive.mjs', 'scripts/verify-history-ui-h6-candidate.mjs',
  'apps/web/scripts/history-ui-h6-candidate-manifest.mjs',
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
  'PR #447', 'PR #448', 'work-history-ui-h6-candidate',
])

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H5 complete PR #447',
  'P9H5 canonical closeout complete PR #448',
  'Exact next implementation branch: work-history-ui-h6-candidate',
  'No Phase 16 feature is approved.',
])
need('docs/product/current-schedule.md', [
  'P9H5 Responsive and accessibility        complete PR #447',
  'P9H5 canonical closeout                  complete PR #448',
  'P9H6 Local candidate                     active',
  'Active implementation branch             work-history-ui-h6-candidate',
  'Exact next branch                        work-history-ui-h7-acceptance',
  'P9H7 branch created                      no',
  'Workflow run: 28293856405',
  'Artifact ID: 7925847144',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Version: 3.1', 'Current phase: Phase 9 — P9H5 complete; P9H6 next',
  'P9H6  work-history-ui-h6-candidate', 'Phase 16 begins only after one candidate is separately approved',
])
need('docs/product/history-ui-repair-plan.md', [
  'Version: 2.5', 'Completed P9H5: PR #447', 'P9H6  work-history-ui-h6-candidate',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H5: PR #447', 'Workflow run: 28293856405', 'Artifact ID: 7925847144',
])
need('docs/work-in-progress/p9h6-candidate.md', [
  'Status: active', 'work-history-ui-h6-candidate', 'work-history-ui-h7-acceptance', 'P9H7 branch created: no',
])

const workflows = [
  '.github/workflows/development-policy.yml', '.github/workflows/public-surface-inventory.yml',
  '.github/workflows/public-browser-audit.yml', '.github/workflows/history-ui-h0-baseline.yml',
  '.github/workflows/history-ui-h1-metric.yml', '.github/workflows/history-ui-h2-chart.yml',
  '.github/workflows/history-ui-h3-overview.yml', '.github/workflows/history-ui-h4a-overview.yml',
  '.github/workflows/history-ui-h4b-tasks.yml', '.github/workflows/history-ui-h5-responsive.yml',
  '.github/workflows/history-ui-h6-candidate.yml', '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml', '.github/workflows/web-verification.yml',
  '.github/workflows/history-browser-gate.yml', '.github/workflows/history-peak-browser.yml',
  '.github/workflows/history-battle-browser.yml', '.github/workflows/history-period-comparison-browser.yml',
  '.github/workflows/shared-output-r1.yml', '.github/workflows/data-status-browser.yml',
  '.github/workflows/watchlist-contracts.yml', '.github/workflows/watchlist-browser.yml',
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

const watchlistPage = read('apps/web/src/live/watchlist-page.ts')
check((watchlistPage.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist request seam changed')
for (const token of ['setInterval(', 'serviceWorker', '/api/watchlist']) check(!watchlistPage.includes(token), `Watchlist page contains ${token}`)

for (const serverRoot of ['apps/web/functions', 'workers']) {
  const absolute = resolve(root, serverRoot)
  if (!existsSync(absolute)) continue
  for (const file of walkFiles(absolute)) {
    const path = relative(root, file).replaceAll('\\', '/')
    const source = readFileSync(file, 'utf8')
    check(!/watchlist/i.test(path), `Watchlist server file introduced: ${path}`)
    check(!source.includes('/api/watchlist'), `Watchlist endpoint introduced: ${path}`)
  }
}

if (issues.length) {
  console.error('ViewLoom development and documentation verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom development and documentation verification passed.')
console.log('- P9H6 local candidate is active on work-history-ui-h6-candidate')
console.log('- work-history-ui-h7-acceptance is next and not created')
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
