import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (ok, message) => { if (!ok) issues.push(message) }
const needFile = (path) => check(existsSync(join(root, path)), `missing file: ${path}`)
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}

const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/u10b-shared-shell.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'apps/web/src/shared-shell.ts', 'apps/web/src/shared-shell.css',
  'apps/web/scripts/quality-u10b-shell-browser.mjs',
  'scripts/verify-quality-u10b-shell.mjs',
  'scripts/verify-quality-u10b-browser-evidence.mjs',
  '.github/workflows/quality-u10b-shell.yml',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
]
for (const path of required) needFile(path)

for (const path of [
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
  'docs/work-in-progress/u10a-quality-baseline.md',
]) check(!existsSync(join(root, path)), `completed temporary file still exists: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch', 'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

const stateChecks = [
  ['README.md', ['Phase 10 U10B shared shell            active', 'Active implementation branch          work-quality-u10b-shell', 'work-quality-u10c-visualization']],
  ['docs/README.md', ['Phase 10 U10B shared shell                       active', 'Active implementation branch                    work-quality-u10b-shell', 'work-quality-u10c-visualization']],
  ['AGENTS.md', ['Phase 10 U10B shared shell active', 'Active implementation branch: work-quality-u10b-shell', 'work-quality-u10c-visualization']],
  ['CONTRIBUTING.md', ['Phase 10 U10B shared shell active', 'Active implementation branch: work-quality-u10b-shell', 'work-quality-u10c-visualization']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10B shared shell active', 'Active implementation branch: work-quality-u10b-shell', 'Phase 16 major feature not approved']],
  ['docs/product/current-schedule.md', ['U10B shared shell                         active', 'Active implementation branch             work-quality-u10b-shell', 'work-quality-u10c-visualization']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10B shared shell active', 'Current implementation branch: `work-quality-u10b-shell`', 'work-quality-u10c-visualization']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10b-shell`', 'Active phase: U10B shared shell', 'work-quality-u10c-visualization']],
  ['docs/work-in-progress/u10b-shared-shell.md', ['Status: active', 'Phase: U10B', 'Branch: `work-quality-u10b-shell`']],
]
for (const [path, fragments] of stateChecks) need(path, fragments)

const baseline = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
check(baseline.schema === 'viewloom-cross-site-quality-u10a-baseline-v1', 'U10A baseline schema changed')
check(baseline.status === 'complete' && baseline.implementation_pr === 454, 'U10A completion changed')
check(baseline.implementation_head === '51c8883ebdc31334828cc345f6a938f17c20a29b', 'U10A evidence head changed')
check(baseline.merge_commit === '7665c5244d2fa71539ce9d69b3f5b55c47463075', 'U10A merge commit changed')
check(baseline.boundary?.provider_separation_required === true, 'U10A provider boundary changed')
check(baseline.counts?.total === 8 && baseline.counts?.browser_measurement_required === 0, 'U10A finding ledger changed')

const ownerMap = JSON.parse(read('docs/audits/cross-site-quality-u10a-owner-map.json'))
check(ownerMap.schema === 'viewloom-cross-site-quality-u10a-owner-map-v1', 'U10A owner-map schema changed')
check(ownerMap.status === 'complete' && ownerMap.exact_next_branch === 'work-quality-u10b-shell', 'U10A handoff changed')

need('apps/web/src/shared-shell.ts', [
  'export function installSharedShell()',
  "nav.id = 'viewloom-global-navigation'",
  'normalizeMobileNavigation',
  'normalizeFooter',
])
need('apps/web/scripts/quality-u10b-shell-browser.mjs', [
  "schema: 'viewloom-quality-u10b-shell-browser-v1'",
  'viewports: [1440, 390]',
])

const watchlist = read('apps/web/src/live/watchlist-page.ts')
check((watchlist.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist request seam changed')
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) check(!watchlist.includes(token), `Watchlist page contains ${token}`)
const channel = read('apps/web/src/live/channel-watchlist.ts')
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) check(!channel.includes(token), `Channel Watchlist contains ${token}`)

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/history-ui-h7-acceptance.yml',
  '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/quality-u10a-baseline.yml',
  '.github/workflows/quality-u10b-shell.yml',
]) {
  needFile(path)
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  check(source.includes('concurrency:'), `${path}: concurrency missing`)
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
console.log('- U10A remains permanent and U10B is active')
console.log('- Twitch and Kick remain separate')

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
