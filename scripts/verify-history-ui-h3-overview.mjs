import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

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

const files = [
  'apps/web/src/live/history-overview-p9h3.ts',
  'apps/web/src/history-overview-p9h3.css',
  'apps/web/scripts/history-ui-h3-overview-browser.mjs',
  'scripts/verify-history-ui-h3-overview.mjs',
  '.github/workflows/history-ui-h3-overview.yml',
  'docs/operations/history-production-acceptance-2026-06-28.md',
]
for (const path of files) needFile(path)

need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-chart-p9h2.css'",
  "import './history-chart-p9h2'",
  "import '../history-overview-p9h3.css'",
  "import './history-overview-p9h3'",
])

need('apps/web/src/live/history-overview-p9h3.ts', [
  "type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'",
  "panel.dataset.historyOverviewReady !== 'true'",
  'data-history-mobile-analysis-toggle',
  'data-history-secondary-group',
  'historyMobileAnalysisBound',
  'aria-expanded',
  'historyOverviewP9h3Ready',
  "scrollIntoView({ block: 'start'",
])

need('apps/web/src/history-overview-p9h3.css', [
  '@media(max-width:760px)',
  '#history-view-overview{display:flex;flex-direction:column;min-width:0}',
  '#history-view-overview>*{width:100%;min-width:0}',
  '#history-view-overview>[data-history-summary]{order:1}',
  '#history-view-overview>[data-history-columns]{order:3',
  '#history-view-overview>.history-overview-mobile-analysis{order:4',
  '#history-view-overview>[data-history-secondary-group]:not(.is-mobile-open){display:none!important}',
  '#history-view-overview>.history-summary{display:grid;grid-template-columns:1fr 1fr!important}',
  '.history-selected-top li:nth-child(n+4){display:none}',
  '@media(forced-colors:active)',
])

need('apps/web/scripts/history-ui-h3-overview-browser.mjs', [
  "{ width: 1440, height: 1000 }",
  "{ width: 390, height: 844 }",
  "context.route('**/api/kick-history*'",
  "context.route('**/api/history*'",
  'mobile Overview remains too long',
  'Overview width collapsed',
  'primary width collapsed',
  'data-history-mobile-analysis-toggle="ranking"',
  'data-history-mobile-analysis-toggle="coverage"',
  'assert.equal(calls.length, before)',
])

need('docs/product/current-roadmap.md', [
  'Phase 9 P9H3 complete PR #439',
  'Phase 9 History P1 repair complete',
])
need('docs/product/current-schedule.md', [
  'P9H3 History Overview hierarchy          complete PR #439',
  'Phase 9 History P1 repair                complete',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Completed Overview hierarchy: PR #439',
  'Completed History production acceptance: PR #451',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H3: PR #439',
  'Completed P9H7 production acceptance: PR #451',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
  'No console or page diagnostics remained.',
])

const moduleSource = read('apps/web/src/live/history-overview-p9h3.ts')
for (const forbidden of ['fetch(', 'MutationObserver', 'setInterval(', '/api/history', '/api/kick-history']) {
  check(!moduleSource.includes(forbidden), `P9H3 module contains forbidden ${forbidden}`)
}
const acceptedOverview = read('apps/web/src/live/history-overview.ts')
check((acceptedOverview.match(/window\.fetch\s*=/g) ?? []).length === 1, 'accepted History fetch capture count changed')
check((acceptedOverview.match(/new MutationObserver/g) ?? []).length === 1, 'accepted History observer count changed')

const imports = read('apps/web/src/live/history-usability-pass.ts')
check(imports.indexOf("import './history-chart-p9h2'") < imports.indexOf("import './history-overview-p9h3'"), 'P9H3 must load after accepted P9H2 chart')
check(!imports.includes('history-overview-p9h3-grid-fix.css'), 'obsolete P9H3 grid-fix stylesheet import remains')

if (issues.length) {
  console.error('ViewLoom History P9H3 Overview verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H3 Overview verification passed.')
console.log('- task-first Overview hierarchy remains protected')
console.log('- accepted request and observer seams remain unchanged')
console.log('- Phase 9 production acceptance is permanent')
