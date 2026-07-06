import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (ok, message) => { if (!ok) issues.push(message) }
const need = (path, fragments = []) => {
  check(existsSync(join(root, path)), `missing file: ${path}`)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}

const routes = [
  'apps/web/twitch/heatmap/index.html', 'apps/web/kick/heatmap/index.html',
  'apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html',
  'apps/web/twitch/battle-lines/index.html', 'apps/web/kick/battle-lines/index.html',
  'apps/web/twitch/history/index.html', 'apps/web/kick/history/index.html',
]
for (const path of routes) need(path, ['/src/mock-site.ts'])
for (const path of [
  'apps/web/src/visualization-grammar.ts',
  'apps/web/src/visualization-grammar.css',
  'apps/web/src/visualization-grammar-entry.ts',
  'apps/web/scripts/quality-u10c-visualization-browser.mjs',
  'apps/web/scripts/quality-u10c-state-settle-browser.mjs',
  'scripts/verify-quality-u10c-browser-evidence.mjs',
  'scripts/verify-quality-u10c-state-evidence.mjs',
  '.github/workflows/quality-u10c-visualization.yml',
  'docs/audits/cross-site-quality-u10c-visualization.json',
]) need(path)

check(!existsSync(join(root, 'docs/work-in-progress/u10c-visualization.md')), 'completed U10C working note still exists')

need('apps/web/src/visualization-grammar.ts', [
  "export type VisualizationFeature = 'heatmap' | 'day-flow' | 'battle-lines' | 'history'",
  'export function installVisualizationGrammar',
  'export function updateVisualizationMetric',
  'export function updateVisualizationState',
  'export function normalizeVisualizationState',
  "guideCell('scale', 'Scale'",
  "guideCell('time', 'Time'",
  "guideCell('selection', 'Selection'",
  "guideCell('detail', 'Detail'",
  "guideCell('state', 'State'",
])
need('apps/web/src/visualization-grammar-entry.ts', [
  "if (path.includes('/heatmap/')) return 'heatmap'",
  "if (path.includes('/day-flow/')) return 'day-flow'",
  "if (path.includes('/battle-lines/')) return 'battle-lines'",
  "if (path.includes('/history/')) return 'history'",
  'observer.observe(source',
  'observer.observe(stage',
])
need('apps/web/src/visualization-grammar.css', [
  '.visualization-guide',
  '.visualization-guide__cells',
  '.visualization-state-mark',
  '@media(max-width:1100px)',
  '@media(max-width:760px)',
  '@media(max-width:420px)',
  '@media(forced-colors:active)',
])
need('apps/web/scripts/quality-u10c-visualization-browser.mjs', [
  "schema: 'viewloom-quality-u10c-visualization-browser-v1'",
  'const viewports = [1440, 820, 390, 360]',
  'assertMetricSynchronization',
])
need('apps/web/scripts/quality-u10c-state-settle-browser.mjs', [
  "schema: 'viewloom-quality-u10c-state-settle-v1'",
  'checks.length === 32',
])
need('.github/workflows/quality-u10c-visualization.yml', [
  'Run U10C visualization browser acceptance',
  'Run U10C settled-state browser acceptance',
])

const record = JSON.parse(read('docs/audits/cross-site-quality-u10c-visualization.json'))
check(record.schema === 'viewloom-cross-site-quality-u10c-visualization-v1', 'schema changed')
check(record.status === 'complete', 'status changed')
check(record.implementation_pr === 458, 'implementation PR changed')
check(record.implementation_head === '77f8ef5747c59e41cd08ff6e9b73825b88270f06', 'implementation head changed')
check(record.merge_commit === 'a1b8c52304bc72977cc0f62ce8f90f832a4ad28e', 'merge commit changed')
check(record.canonical_closeout_pr === 459, 'closeout PR changed')
check(record.scope?.routes === 8, 'route count changed')
check(record.scope?.grammar_scenarios === 32, 'grammar scenarios changed')
check(record.scope?.settled_state_checks === 32, 'settled-state checks changed')
check(record.scope?.total_browser_checks === 64, 'browser total changed')
check(record.browser_evidence?.run_id === 28380920832, 'workflow evidence changed')
check(record.browser_evidence?.artifact_id === 7955560879, 'artifact evidence changed')
check(record.browser_evidence?.result === 'pass', 'browser result changed')
check(record.browser_evidence?.loading_residue === 0, 'loading residue changed')
check(record.browser_evidence?.state_mismatches === 0, 'state mismatch count changed')
check(record.browser_evidence?.busy_residue === 0, 'busy residue changed')
check(record.browser_evidence?.horizontal_overflow === 0, 'overflow result changed')
check(record.boundary?.provider_separation_required === true, 'provider boundary changed')
check(record.boundary?.analysis_meaning_change_authorized === false, 'analysis boundary changed')
check(record.boundary?.api_change_authorized === false, 'API boundary changed')
check(record.boundary?.storage_change_authorized === false, 'storage boundary changed')
check(record.boundary?.collector_change_authorized === false, 'collector boundary changed')
check(record.boundary?.provider_combination_authorized === false, 'provider combination boundary changed')
check(record.exact_next_branch === 'work-quality-u10d-analysis-coherence', 'handoff changed')
check(record.next_branch_created === false, 'next branch snapshot changed')

if (issues.length) {
  console.error('Completed U10C verification failed:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}
console.log('Completed U10C verification passed.')
console.log('- permanent evidence is exact')
console.log('- temporary note is removed')
console.log('- retained U10C gate is independent of the active roadmap phase')
