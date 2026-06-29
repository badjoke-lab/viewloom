import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (condition, message) => { if (!condition) issues.push(message) }
const need = (path, fragments) => {
  const file = join(root, path)
  if (!existsSync(file)) { issues.push(`missing file: ${path}`); return }
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}

need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H3: PR #439',
  'Completed P9H7 production acceptance: PR #451',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
  'No console or page diagnostics remained.',
])
need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-chart-p9h2.css'",
  "import './history-chart-p9h2'",
  "import '../history-overview-p9h3.css'",
  "import './history-overview-p9h3'",
])
need('apps/web/src/live/history-overview-p9h3.ts', [
  "type SecondaryGroup = 'comparison' | 'calendar' | 'ranking' | 'coverage'",
  'data-history-mobile-analysis-toggle',
  'data-history-secondary-group',
  'historyMobileAnalysisBound',
  'aria-expanded',
  'historyOverviewP9h3Ready',
])
need('apps/web/src/history-overview-p9h3.css', [
  '@media(max-width:760px)',
  '#history-view-overview{display:flex;flex-direction:column;min-width:0}',
  '#history-view-overview>*{width:100%;min-width:0}',
  '#history-view-overview>[data-history-summary]{order:1}',
  '#history-view-overview>[data-history-columns]{order:3',
  '#history-view-overview>.history-overview-mobile-analysis{order:4',
  '@media(forced-colors:active)',
])
need('apps/web/scripts/history-ui-h3-overview-browser.mjs', [
  "{ width: 1440, height: 1000 }",
  "{ width: 390, height: 844 }",
  "context.route('**/api/kick-history*'",
  "context.route('**/api/history*'",
  'mobile Overview remains too long',
  'assert.equal(calls.length, before)',
])
need('.github/workflows/history-ui-h3-overview.yml', [
  'name: History UI P9H3 Overview',
  'Run P9H3 Overview browser acceptance',
  'cancel-in-progress: true',
])

const moduleSource = read('apps/web/src/live/history-overview-p9h3.ts')
for (const forbidden of ['fetch(', 'MutationObserver', 'setInterval(', '/api/history', '/api/kick-history']) {
  check(!moduleSource.includes(forbidden), `P9H3 module contains forbidden ${forbidden}`)
}
const acceptedOverview = read('apps/web/src/live/history-overview.ts')
check((acceptedOverview.match(/window\.fetch\s*=/g) ?? []).length === 1, 'accepted History fetch capture count changed')
check((acceptedOverview.match(/new MutationObserver/g) ?? []).length === 1, 'accepted History observer count changed')

if (issues.length) {
  console.error('ViewLoom History P9H3 permanent verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H3 permanent verification passed.')
console.log('- task-first Overview hierarchy and provider boundaries remain protected')
console.log('- permanent acceptance owns Phase 9 completion')
