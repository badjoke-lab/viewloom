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

for (const path of [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
  'docs/product/current-roadmap.md', 'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-spec.md',
  'docs/product/cross-site-quality-remediation-plan.md',
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/audits/cross-site-quality-u10c-visualization.json',
  'apps/web/src/shared-shell.ts', 'apps/web/src/shared-shell.css',
  'apps/web/src/visualization-grammar.ts',
  'apps/web/src/visualization-grammar.css',
  'apps/web/src/visualization-grammar-entry.ts',
  'apps/web/scripts/quality-u10c-visualization-browser.mjs',
  'apps/web/scripts/quality-u10c-state-settle-browser.mjs',
  'scripts/verify-quality-u10c-browser-evidence.mjs',
  'scripts/verify-quality-u10c-state-evidence.mjs',
  '.github/workflows/quality-u10c-visualization.yml',
  'apps/web/src/live/watchlist-page.ts',
  'apps/web/src/live/channel-watchlist.ts',
]) needFile(path)

for (const path of [
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'docs/work-in-progress/p9h7-acceptance.md',
  'docs/work-in-progress/u10a-quality-baseline.md',
  'docs/work-in-progress/u10b-shared-shell.md',
  'docs/work-in-progress/u10c-visualization.md',
  'docs/audits/u10a-closeout-marker.md',
  'docs/audits/u10a-closeout-marker-2.md',
  'docs/audits/u10b-closeout-marker.md',
]) check(!existsSync(join(root, path)), `completed temporary file still exists: ${path}`)

need('docs/operations/development-and-deployment-policy.md', [
  'Status: source of truth', '`work-*`', '`preview-*`', '`main` is the production branch', 'Twitch and Kick remain separate',
])
need('docs/operations/documentation-governance.md', [
  'Implementation must not begin from chat memory', 'Temporary-note lifecycle', 'delete the temporary note',
])

const stateChecks = [
  ['README.md', ['Phase 10 U10C visualization           complete PR #458', 'U10C canonical closeout               active PR #459', 'Active implementation branch          none', 'Exact next branch                     work-quality-u10d-analysis-coherence', 'U10D branch created                   no']],
  ['docs/README.md', ['Phase 10 U10C visualization                      complete PR #458', 'U10C canonical closeout                          active PR #459', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10d-analysis-coherence', 'U10D branch created                             no']],
  ['AGENTS.md', ['U10C implementation complete PR #458', 'U10C canonical closeout PR #459', 'Active implementation branch: none', 'Exact next branch: work-quality-u10d-analysis-coherence', 'U10D branch created: no']],
  ['CONTRIBUTING.md', ['Phase 10 U10C visualization complete through PR #458', 'U10C canonical closeout active through PR #459', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-u10d-analysis-coherence', 'U10D branch created: no']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10C visualization complete PR #458', 'U10C canonical closeout PR #459', 'Active implementation branch: none', 'Exact next branch: work-quality-u10d-analysis-coherence', 'Phase 16 major feature not approved']],
  ['docs/product/current-schedule.md', ['U10C complete PR #458', 'U10C closeout PR #459', 'Active branch: none', 'Next branch: work-quality-u10d-analysis-coherence', 'U10C total browser checks: 64']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10C closeout', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-u10d-analysis-coherence`', 'Completed U10C implementation: PR #458']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed phase: U10C through PR #458', 'Canonical closeout: PR #459', 'Exact next branch: `work-quality-u10d-analysis-coherence`']],
]
for (const [path, fragments] of stateChecks) need(path, fragments)

const u10a = JSON.parse(read('docs/audits/cross-site-quality-u10a-baseline.json'))
check(u10a.schema === 'viewloom-cross-site-quality-u10a-baseline-v1', 'U10A baseline schema changed')
check(u10a.status === 'complete' && u10a.implementation_pr === 454, 'U10A completion changed')
check(u10a.implementation_head === '51c8883ebdc31334828cc345f6a938f17c20a29b', 'U10A evidence head changed')
check(u10a.merge_commit === '7665c5244d2fa71539ce9d69b3f5b55c47463075', 'U10A merge commit changed')
check(u10a.boundary?.provider_separation_required === true, 'U10A provider boundary changed')
check(u10a.counts?.total === 8 && u10a.counts?.browser_measurement_required === 0, 'U10A finding ledger changed')

const ownerMap = JSON.parse(read('docs/audits/cross-site-quality-u10a-owner-map.json'))
check(ownerMap.schema === 'viewloom-cross-site-quality-u10a-owner-map-v1', 'U10A owner-map schema changed')
check(ownerMap.status === 'complete' && ownerMap.exact_next_branch === 'work-quality-u10b-shell', 'U10A handoff changed')

const u10b = JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json'))
check(u10b.schema === 'viewloom-cross-site-quality-u10b-shared-shell-v1', 'U10B record schema changed')
check(u10b.status === 'complete' && u10b.implementation_pr === 456 && u10b.canonical_closeout_pr === 457, 'U10B completion changed')
check(u10b.implementation_head === '654833f70fc0776babbbfe9a9fab6829643f228a', 'U10B evidence head changed')
check(u10b.merge_commit === '95ad125c05aed32408b1ee79915a4b7ac910ba6c', 'U10B merge commit changed')
check(u10b.scope?.built_routes === 20 && u10b.scope?.browser_scenarios === 40, 'U10B browser matrix changed')
check(u10b.browser_evidence?.run_id === 28369803589 && u10b.browser_evidence?.artifact_id === 7950954207, 'U10B artifact evidence changed')

const u10c = JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json'))
check(u10c.schema === 'viewloom-cross-site-quality-u10c-visualization-v1', 'U10C record schema changed')
check(u10c.phase === 'U10C' && u10c.status === 'complete', 'U10C completion changed')
check(u10c.implementation_pr === 458 && u10c.canonical_closeout_pr === 459, 'U10C PR ownership changed')
check(u10c.implementation_head === '77f8ef5747c59e41cd08ff6e9b73825b88270f06', 'U10C implementation head changed')
check(u10c.merge_commit === 'a1b8c52304bc72977cc0f62ce8f90f832a4ad28e', 'U10C merge commit changed')
check(u10c.scope?.routes === 8 && u10c.scope?.grammar_scenarios === 32 && u10c.scope?.settled_state_checks === 32 && u10c.scope?.total_browser_checks === 64, 'U10C browser matrix changed')
check(u10c.browser_evidence?.run_id === 28380920832 && u10c.browser_evidence?.artifact_id === 7955560879 && u10c.browser_evidence?.result === 'pass', 'U10C browser evidence changed')
check(u10c.browser_evidence?.loading_residue === 0 && u10c.browser_evidence?.state_mismatches === 0 && u10c.browser_evidence?.busy_residue === 0 && u10c.browser_evidence?.horizontal_overflow === 0, 'U10C browser residue changed')
check(u10c.boundary?.provider_separation_required === true, 'U10C provider boundary changed')
for (const key of ['analysis_meaning_change_authorized', 'api_change_authorized', 'storage_change_authorized', 'collector_change_authorized', 'provider_combination_authorized']) check(u10c.boundary?.[key] === false, `U10C boundary changed: ${key}`)
check(u10c.exact_next_branch === 'work-quality-u10d-analysis-coherence' && u10c.next_branch_created === false, 'U10C handoff changed')

need('apps/web/src/shared-shell.ts', ['export function installSharedShell()', "nav.id = 'viewloom-global-navigation'", 'normalizeMobileNavigation', 'normalizeFooter'])
need('apps/web/src/visualization-grammar.ts', ['export function installVisualizationGrammar', 'export function normalizeVisualizationState', "guideCell('scale', 'Scale'", "guideCell('state', 'State'"])
need('apps/web/src/visualization-grammar-entry.ts', ['observer.observe(source', 'observer.observe(stage'])
check(!read('apps/web/src/visualization-grammar-entry.ts').includes('observer.observe(document.body'), 'U10C introduced a document-wide state observer')
check(!read('apps/web/src/visualization-grammar-entry.ts').includes('window.fetch ='), 'U10C replaced global fetch')

const watchlist = read('apps/web/src/live/watchlist-page.ts')
check((watchlist.match(/\bfetch\s*\(/g) ?? []).length === 1, 'Watchlist request seam changed')
for (const token of ['setInterval(', 'serviceWorker', 'gtag(', '/api/watchlist']) check(!watchlist.includes(token), `Watchlist page contains ${token}`)
const channel = read('apps/web/src/live/channel-watchlist.ts')
for (const token of ['fetch(', 'removeStoredWatchlistEntry', 'setInterval(', 'serviceWorker', 'gtag(']) check(!channel.includes(token), `Channel Watchlist contains ${token}`)

for (const path of [
  '.github/workflows/development-policy.yml', '.github/workflows/public-browser-audit.yml',
  '.github/workflows/history-ui-h7-acceptance.yml', '.github/workflows/web-build.yml',
  '.github/workflows/web-checks.yml', '.github/workflows/watchlist-contracts.yml',
  '.github/workflows/watchlist-browser.yml', '.github/workflows/quality-u10a-baseline.yml',
  '.github/workflows/quality-u10b-shell.yml', '.github/workflows/quality-u10c-visualization.yml',
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
console.log('- U10A, U10B, and U10C remain permanently recorded')
console.log('- active implementation branch is none')
console.log('- U10D is exact next and uncreated')
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
