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
  'apps/web/src/live/history-tasks-p9h4b.ts',
  'apps/web/src/history-tasks-p9h4b.css',
  'apps/web/scripts/history-ui-h4b-tasks-browser.mjs',
  'scripts/verify-history-ui-h4b-tasks.mjs',
  '.github/workflows/history-ui-h4b-tasks.yml',
  'docs/work-in-progress/p9h4b-activation.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
]) needFile(path)

need('apps/web/src/live/history-overview-p9h4a.ts', [
  "import '../history-tasks-p9h4b.css'",
  "import './history-tasks-p9h4b'",
])
need('apps/web/src/live/history-tasks-p9h4b.ts', [
  "description: 'Daily records, peaks, and matchups'",
  "description: 'Copy, share, and download this view'",
  'data-history-archives-intro',
  'data-history-archive-panel-intro',
  'data-history-publish-context-value',
  "publishGroup('Copy text'",
  "publishGroup('Share image'",
  "publishGroup('Download data'",
  'Observed ViewLoom data only; not a provider-wide total.',
  "window.addEventListener('popstate', schedule)",
  "window.addEventListener('viewloom:peak-archive-toggle', schedule)",
  "window.addEventListener('viewloom:battle-archive-toggle', schedule)",
  "reportField(report, 'Source')",
  "root.dataset.historyP9h4bReady = 'true'",
])
need('apps/web/src/history-tasks-p9h4b.css', [
  '#history-view-archives>.history-archive-view-tabs',
  'position:static;',
  '#history-archive-daily .history-archive-toolbar',
  '.history-task-intro',
  '.history-archive-panel-intro',
  '.history-publish-context',
  '.history-publish-group',
  'min-height:48px',
  '@media(max-width:760px)',
  '@media(max-width:520px)',
])
need('apps/web/scripts/history-ui-h4b-tasks-browser.mjs', [
  "schema: 'viewloom-history-ui-h4b-tasks-v1'",
  "phase: 'P9H4B'",
  "id: 'twitch-desktop-1440'",
  "id: 'kick-tablet-820'",
  "mobileScenario(browser, 'kick', 390)",
  "mobileScenario(browser, 'twitch', 360)",
  'archive switching refetched History',
  'Back/Forward refetched History',
  'direct archive state was not restored',
  'publishing actions are grouped incorrectly',
  'not a provider-wide total',
  'share preview refetched History',
])

need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H4B: PR #443',
  'Completed P9H4B canonical closeout: PR #444',
])
need('docs/work-in-progress/p9h4b-activation.md', [
  'Status: complete',
  'Implementation PR: #443',
  'Canonical closeout PR: #444',
  'work-history-ui-h5-responsive',
  'P9H5 branch created: no',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
])
need('apps/web/src/live/history-view-shell.ts', [
  "window.addEventListener('popstate'",
  'nativePushState(payload',
  "state = { view: 'archives', archive }",
  "moveArchive('daily'",
  "moveArchive('peaks'",
  "moveArchive('battles'",
  "move('report'",
])
need('apps/web/src/live/history-report-text-state.ts', [
  'Coverage note: observed ViewLoom data; not a provider-wide total.',
  'Data state:',
  'Source:',
  'Metric:',
])
need('apps/web/src/live/history-export-model.ts', [
  "schema: 'viewloom-history-export-v1'",
  'viewer_minutes:',
  'peak_viewers:',
])
need('apps/web/src/live/history-share-card.ts', [
  'const CARD_WIDTH = 1200',
  'const CARD_HEIGHT = 630',
  'canvas.width = CARD_WIDTH',
  'canvas.height = CARD_HEIGHT',
])

const moduleSource = read('apps/web/src/live/history-tasks-p9h4b.ts')
for (const forbidden of ['fetch(', 'MutationObserver', 'setInterval(', '/api/history', '/api/kick-history', ".data-strip__cell:nth-child(4)"]) {
  check(!moduleSource.includes(forbidden), `P9H4B module contains forbidden ${forbidden}`)
}
need('.github/workflows/history-ui-h4b-tasks.yml', [
  'name: History UI P9H4B Tasks',
  'Verify P9H4B repository contract',
  'Run P9H4B task hierarchy browser acceptance',
  'history-ui-h4b-tasks',
  'cancel-in-progress: true',
])

if (issues.length) {
  console.error('ViewLoom History P9H4B task hierarchy verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H4B task hierarchy verification passed.')
console.log('- P9H4B permanent implementation and closeout records remain exact')
console.log('- Archives hierarchy, publishing context, Back/Forward, and no-refetch behavior remain protected')
console.log('- current roadmap wording is not used as historical evidence')
