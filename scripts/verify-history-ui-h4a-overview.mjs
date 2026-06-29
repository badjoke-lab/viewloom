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

for (const path of [
  'apps/web/src/live/history-overview-p9h4a.ts',
  'apps/web/src/history-overview-p9h4a.css',
  'apps/web/scripts/history-ui-h4a-overview-browser.mjs',
  'scripts/verify-history-ui-h4a-overview.mjs',
  '.github/workflows/history-ui-h4a-overview.yml',
  'docs/product/history-ui-repair-plan.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
]) needFile(path)

need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-overview-p9h3.css'",
  "import './history-overview-p9h3'",
  "import '../history-overview-p9h4a.css'",
  "import './history-overview-p9h4a'",
])
need('apps/web/src/live/history-overview-p9h4a.ts', [
  'historyOverviewP9h3Ready',
  'historyOverviewP9h4aReady',
  'Current vs previous retained period',
  'Daily intensity and coverage',
  'Top streamers and supported movement',
  'Partial, missing and in-progress days',
  'data-history-mobile-analysis-copy',
])
need('apps/web/src/history-overview-p9h4a.css', [
  '#history-view-overview>.history-summary>div:nth-child(5){',
  'grid-column:1/-1;',
  '#history-view-overview>.history-overview-insights{',
  'position:static;',
  'grid-auto-rows:clamp(56px,4.5vw,72px)',
  'aspect-ratio:auto;',
  '@media(max-width:1320px)',
  'grid-template-columns:repeat(2,minmax(0,1fr))!important',
  'height:clamp(460px,126vw,510px)',
  '.history-comparison-status--partial',
])
need('apps/web/scripts/history-ui-h4a-overview-browser.mjs', [
  'viewloom-history-ui-h4a-overview-balance-v1',
  "desktopScenario(browser, 'twitch', 1440)",
  "desktopScenario(browser, 'kick', 1280)",
  "desktopScenario(browser, 'twitch', 1024)",
  "desktopScenario(browser, 'kick', 820)",
  "mobileScenario(browser, 'kick', 390)",
  "mobileScenario(browser, 'twitch', 360)",
  "initial.keyPosition !== 'sticky'",
  'Calendar height',
  'visiblePrimarySummaryCards, 4',
  'visibleSummaryCards, 5',
  "coverageBandDisplay, 'grid'",
  'coverageOverlap',
  'assert.equal(calls.length, before',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H4A: PR #441',
  'Completed P9H4A canonical closeout: PR #442',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
  'All passed with zero horizontal overflow.',
])

const moduleSource = read('apps/web/src/live/history-overview-p9h4a.ts')
for (const forbidden of ['fetch(', 'setInterval(', '/api/history', '/api/kick-history', 'MutationObserver']) {
  check(!moduleSource.includes(forbidden), `P9H4A module contains forbidden ${forbidden}`)
}
const imports = read('apps/web/src/live/history-usability-pass.ts')
check(imports.indexOf("import './history-overview-p9h3'") < imports.indexOf("import './history-overview-p9h4a'"), 'P9H4A must load after accepted P9H3 hierarchy')
check(imports.indexOf("import '../history-overview-p9h4a.css'") < imports.indexOf("import './history-overview-p9h4a'"), 'P9H4A stylesheet must load before its behavior module')
const acceptedOverview = read('apps/web/src/live/history-overview.ts')
check((acceptedOverview.match(/window\.fetch\s*=/g) ?? []).length === 1, 'accepted History fetch capture count changed')
check((acceptedOverview.match(/new MutationObserver/g) ?? []).length === 1, 'accepted History observer count changed')
const workflow = read('.github/workflows/history-ui-h4a-overview.yml')
check(workflow.includes('concurrency:'), 'P9H4A workflow concurrency is missing')
check(workflow.includes('group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}'), 'P9H4A workflow concurrency group changed')
check(workflow.includes('cancel-in-progress: true'), 'P9H4A workflow does not cancel obsolete runs')

if (issues.length) {
  console.error('ViewLoom History P9H4A Overview balance verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H4A Overview balance verification passed.')
console.log('- accepted Overview geometry and hierarchy remain protected')
console.log('- provider, request, API, storage, and output seams remain unchanged')
console.log('- permanent acceptance, not current roadmap wording, owns Phase 9 completion')
