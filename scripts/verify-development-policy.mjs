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
  'docs/operations/history-production-acceptance-2026-06-28.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/work-in-progress/u10a-quality-baseline.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'apps/web/scripts/quality-u10a-baseline-browser.mjs',
  'scripts/verify-quality-u10a-baseline.mjs',
  '.github/workflows/quality-u10a-baseline.yml',
  'scripts/verify-history-ui-h7-acceptance.mjs',
  'apps/web/scripts/verify-watchlist-contracts.mjs',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
]
for (const path of requiredFiles) needFile(path)

for (const path of [
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
]) check(!existsSync(join(root, path)), `completed History note still exists: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch', 'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

for (const path of ['README.md', 'docs/README.md', 'AGENTS.md', 'CONTRIBUTING.md']) need(path, [
  'Phase 10 U10A', 'work-quality-u10a-baseline', 'work-quality-u10b-shell',
])
need('README.md', [
  'Phase 9 History P1 repair             complete',
  'Active implementation branch          work-quality-u10a-baseline',
  'U10B branch created                   no',
])
need('docs/README.md', [
  'Phase 10 U10A quality baseline                   active',
  'Active implementation branch                    work-quality-u10a-baseline',
  'U10B branch created                             no',
])
need('AGENTS.md', [
  'Phase 10 U10A quality baseline active',
  'Active implementation branch: work-quality-u10a-baseline',
  'U10B branch created: no',
])
need('CONTRIBUTING.md', [
  'Phase 10 U10A quality baseline active',
  'Active implementation branch: work-quality-u10a-baseline',
  'U10B branch created: no',
])

need('docs/product/current-roadmap.md', [
  'Phase 10 U10A active',
  'Active implementation branch: work-quality-u10a-baseline',
  'Exact next implementation branch after U10A: work-quality-u10b-shell',
  'Phase 16 major feature not approved',
])
need('docs/product/current-schedule.md', [
  'U10A defect and ownership baseline       active',
  'Active implementation branch             work-quality-u10a-baseline',
  'Exact next branch after U10A              work-quality-u10b-shell',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 10 — U10A defect and ownership baseline active',
  'Current implementation branch: `work-quality-u10a-baseline`',
  'Exact next implementation branch after U10A: `work-quality-u10b-shell`',
])
need('docs/product/cross-site-quality-remediation-spec.md', [
  'Roadmap phases: Phase 10–11', 'Reproduction and failing assertions before repair',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'Status: active implementation plan',
  'Current branch: `work-quality-u10a-baseline`',
  'Exact next branch after U10A: `work-quality-u10b-shell`',
  'No product repair in U10A except proven P0 isolation.',
])
need('docs/work-in-progress/u10a-quality-baseline.md', [
  'Status: active', 'Branch: `work-quality-u10a-baseline`', 'work-quality-u10b-shell',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'Status: permanent acceptance record',
  'Accepted production commit: `233a35ebe219c6be42723eb749e2bcc84ae7fc09`',
  'History Phase 9 is accepted in production.',
])

const baseline = existsSync(join(root, 'docs/audits/cross-site-quality-u10a-baseline.json'))
  ? JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json')) : null
check(baseline?.schema === 'viewloom-cross-site-quality-u10a-baseline-v1', 'U10A baseline schema changed')
check(baseline?.phase === 'U10A', 'U10A baseline phase changed')
check(baseline?.boundary?.product_repair_authorized === false, 'U10A repair boundary changed')
check(baseline?.boundary?.provider_separation_required === true, 'U10A provider boundary changed')

const ownerMap = existsSync(join(root, 'docs/audits/cross-site-quality-u10a-owner-map.json'))
  ? JSON.parse(read('docs/audits/cross-site-quality-u10a-owner-map.json')) : null
check(ownerMap?.schema === 'viewloom-cross-site-quality-u10a-owner-map-v1', 'U10A owner-map schema changed')
check(ownerMap?.owners?.length >= 8, 'U10A owner map is incomplete')

const watchlistPage = read('apps/web/src/live/watchlist-page.ts')
check((watchlistPage.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist request seam changed')
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) check(!watchlistPage.includes(token), `Watchlist page contains ${token}`)
const channelAction = read('apps/web/src/live/channel-watchlist.ts')
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) check(!channelAction.includes(token), `Channel Watchlist contains ${token}`)

const workflows = [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/history-ui-h7-acceptance.yml',
  '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml',
  '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml',
  '.github/workflows/quality-u10a-baseline.yml',
]
for (const path of workflows) {
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
console.log('- Phase 9 remains permanently accepted')
console.log('- Phase 10 U10A is active and baseline-only')
console.log('- Twitch and Kick remain separate')
console.log('- U10B is exact next and uncreated')

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
