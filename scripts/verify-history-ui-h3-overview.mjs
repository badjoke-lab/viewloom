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
  'apps/web/src/history-overview-p9h3-grid-fix.css',
  'apps/web/scripts/history-ui-h3-overview-browser.mjs',
  'scripts/verify-history-ui-h3-overview.mjs',
  '.github/workflows/history-ui-h3-overview.yml',
]
for (const path of files) needFile(path)

need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-chart-p9h2.css'",
  "import './history-chart-p9h2'",
  "import '../history-overview-p9h3.css'",
  "import '../history-overview-p9h3-grid-fix.css'",
  "import './history-overview-p9h3'",
])

need('apps/web/src/live/history-overview-p9h3.ts', [
  "type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'",
  'data-history-mobile-analysis-toggle',
  'data-history-secondary-group',
  'aria-expanded',
  'historyOverviewP9h3Ready',
  "scrollIntoView({ block: 'start'",
])

need('apps/web/src/history-overview-p9h3.css', [
  '@media(max-width:760px)',
  '[data-history-secondary-group]:not(.is-mobile-open){display:none!important}',
  '.history-summary{grid-template-columns:1fr 1fr!important}',
  '.history-selected-top li:nth-child(n+4){display:none}',
  '@media(forced-colors:active)',
])

need('apps/web/src/history-overview-p9h3-grid-fix.css', [
  '#history-view-overview{display:block;min-width:0}',
  '#history-view-overview>*{width:100%;min-width:0}',
  '#history-view-overview>.history-summary{display:grid;grid-template-columns:1fr 1fr!important}',
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

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/work-in-progress/history-ui-repair-working-note.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
]) need(path, [
  'work-history-ui-h3-overview',
  'work-history-ui-h4-tasks',
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

if (issues.length) {
  console.error('ViewLoom History P9H3 Overview verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H3 Overview verification passed.')
console.log('- P9H3 is active on work-history-ui-h3-overview')
console.log('- mobile secondary analysis is explicit and collapsed by default')
console.log('- mobile Overview width is protected by a permanent grid regression gate')
console.log('- accepted P9H1/P9H2 request and observer seams are unchanged')
console.log('- Twitch and Kick History endpoints remain separate')