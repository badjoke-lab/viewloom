import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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

const routes = [
  'apps/web/twitch/heatmap/index.html',
  'apps/web/kick/heatmap/index.html',
  'apps/web/twitch/day-flow/index.html',
  'apps/web/kick/day-flow/index.html',
  'apps/web/twitch/battle-lines/index.html',
  'apps/web/kick/battle-lines/index.html',
  'apps/web/twitch/history/index.html',
  'apps/web/kick/history/index.html',
]

for (const path of [
  ...routes,
  'apps/web/src/visualization-grammar.ts',
  'apps/web/src/visualization-grammar.css',
  'apps/web/src/visualization-grammar-entry.ts',
  'apps/web/src/mock-site.ts',
  'apps/web/scripts/quality-u10c-visualization-browser.mjs',
  'scripts/verify-quality-u10c-browser-evidence.mjs',
  '.github/workflows/quality-u10c-visualization.yml',
  'docs/work-in-progress/u10c-visualization.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-plan.md',
]) needFile(path)

for (const path of routes) need(path, [
  '/src/mock-site.ts',
])

need('apps/web/src/visualization-grammar.ts', [
  "export type VisualizationFeature = 'heatmap' | 'day-flow' | 'battle-lines' | 'history'",
  "export type VisualizationState = 'loading' | 'fresh' | 'partial' | 'stale' | 'missing' | 'empty' | 'demo' | 'error' | 'unknown'",
  'export function installVisualizationGrammar',
  'export function updateVisualizationMetric',
  'export function updateVisualizationState',
  'export function normalizeVisualizationState',
  "title: 'Current field'",
  "title: 'Observed day terrain'",
  "title: 'Observed rivalry timeline'",
  "title: 'Retained daily trend'",
  "guideCell('scale', 'Scale'",
  "guideCell('time', 'Time'",
  "guideCell('selection', 'Selection'",
  "guideCell('detail', 'Detail'",
  "guideCell('state', 'State'",
  "stage.setAttribute('aria-describedby'",
  "stage.dataset.visualizationSurface = feature",
  "stage.dataset.visualizationState = 'loading'",
  "stage.setAttribute('aria-busy', 'true')",
  "metricSelector: '[data-dayflow-metric]'",
  "metricSelector: '[data-battle-metric]'",
  "metricSelector: '[data-history-metric]'",
  "unit: 'Tile area = viewers · color = momentum'",
  "unit: 'Observed viewers'",
  "unit: 'Percent of selected scope'",
  "unit: 'Index from 0 to 100'",
  "unit: 'Viewer-minutes per UTC day'",
  "unit: 'Peak observed viewers per UTC day'",
])

const grammar = read('apps/web/src/visualization-grammar.ts')
for (const state of ['loading', 'fresh', 'partial', 'stale', 'missing', 'empty', 'demo', 'error', 'unknown']) {
  check(grammar.includes(`${state}: {`), `visualization grammar is missing ${state} presentation`)
}
for (const forbidden of ['window.fetch =', 'globalThis.fetch =', 'document.body.observe', 'observer.observe(document.body']) {
  check(!grammar.includes(forbidden), `visualization grammar contains forbidden global coordination: ${forbidden}`)
}

need('apps/web/src/visualization-grammar-entry.ts', [
  "if (path.includes('/heatmap/')) return 'heatmap'",
  "if (path.includes('/day-flow/')) return 'day-flow'",
  "if (path.includes('/battle-lines/')) return 'battle-lines'",
  "if (path.includes('/history/')) return 'history'",
  'const observer = new MutationObserver(sync)',
  'observer.observe(source',
  "window.addEventListener('pagehide'",
])
const entry = read('apps/web/src/visualization-grammar-entry.ts')
check(!entry.includes('observer.observe(document.body'), 'U10C entry uses a document-wide MutationObserver')
check(!entry.includes('window.fetch =') && !entry.includes('globalThis.fetch ='), 'U10C entry replaces global fetch')

need('apps/web/src/visualization-grammar.css', [
  '.visualization-guide',
  '.visualization-guide__cells',
  '.visualization-state-mark',
  '[data-visualization-surface]:focus-within',
  '[data-visualization-state="partial"]',
  '[data-visualization-state="stale"]',
  '[data-visualization-state="missing"]',
  '[data-visualization-state="empty"]',
  '[data-visualization-state="demo"]',
  '[data-visualization-state="error"]',
  '@media(max-width:1100px)',
  '@media(max-width:760px)',
  '@media(max-width:420px)',
  '@media(forced-colors:active)',
])
need('apps/web/src/mock-site.ts', ["import './visualization-grammar-entry'"])

need('apps/web/scripts/quality-u10c-visualization-browser.mjs', [
  "schema: 'viewloom-quality-u10c-visualization-browser-v1'",
  "phase: 'U10C'",
  'viewports: [1440, 820, 390, 360]',
  'routes: routes.length',
  'assertGuide',
  'assertMetricSynchronization',
  'horizontalOverflow',
])
need('scripts/verify-quality-u10c-browser-evidence.mjs', [
  'viewloom-quality-u10c-visualization-browser-v1',
  'assert.equal(evidence.routes, 8)',
  'assert.equal(evidence.scenarios.length, 32)',
])
need('.github/workflows/quality-u10c-visualization.yml', [
  'name: Quality U10C Visualization',
  'Verify U10C repository contract',
  'Run U10C visualization browser acceptance',
  'quality-u10c-visualization',
  'cancel-in-progress: true',
])

need('docs/work-in-progress/u10c-visualization.md', [
  'Status: active',
  'Phase: U10C',
  'Branch: `work-quality-u10c-visualization`',
  'work-quality-u10d-analysis-coherence',
  'Visualization routes: 8',
])
need('docs/product/current-roadmap.md', [
  'Phase 10 U10C visualization active',
  'Active implementation branch: work-quality-u10c-visualization',
  'Exact next implementation branch after U10C: work-quality-u10d-analysis-coherence',
])
need('docs/product/current-schedule.md', [
  'U10C visualization                       active',
  'Active implementation branch             work-quality-u10c-visualization',
  'Browser scenarios: 32',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 10 — U10C visualization active',
  'Current implementation branch: `work-quality-u10c-visualization`',
  'work-quality-u10d-analysis-coherence',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'Current branch: `work-quality-u10c-visualization`',
  'Active phase: U10C visualization',
  'work-quality-u10d-analysis-coherence',
])

for (const path of routes) {
  const provider = path.includes('/twitch/') ? 'twitch' : 'kick'
  check(read(path).includes(`data-provider="${provider}"`), `${path}: provider identity changed`)
}

if (issues.length) {
  console.error('ViewLoom U10C visualization verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom U10C visualization verification passed.')
console.log('- eight provider-separated visualization routes share one reading grammar')
console.log('- metric, UTC context, selection, detail, and state semantics are explicit')
console.log('- U10D analysis ownership remains out of scope')
