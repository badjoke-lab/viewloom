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

need('docs/product/current-schedule.md', [
  'P9H4B Archives and publishing hierarchy  active',
  'Active implementation branch             work-history-ui-h4b-tasks',
  'P9H4B Archives and publishing hierarchy  complete PR #443',
  'P9H4B canonical closeout                 complete PR #444',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h5-responsive',
  'P9H5 branch created                      no',
  'Workflow run: 28289223184',
  'Artifact ID: 7924451682',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H4B complete PR #443',
  'P9H4B canonical closeout complete PR #444',
  'Active implementation branch: none',
  'Exact next implementation branch: work-history-ui-h5-responsive',
  'P9H5 branch created: no',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Completed Archives and publishing hierarchy: PR #443',
  'Completed P9H4B canonical closeout: PR #444',
  'Exact next implementation branch after explicit continuation: `work-history-ui-h5-responsive`',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H4B: PR #443',
  'Completed P9H4B canonical closeout: PR #444',
  'Exact next branch after explicit continuation: `work-history-ui-h5-responsive`',
])
need('docs/work-in-progress/p9h4b-activation.md', [
  'Status: complete',
  'Implementation PR: #443',
  'Canonical closeout PR: #444',
  'work-history-ui-h5-responsive',
  'P9H5 branch created: no',
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
console.log('- P9H4B is complete through PR #443 and canonically closed through PR #444')
console.log('- Archives hierarchy and non-sticky controls are protected')
console.log('- Report & Export context and action groups are protected')
console.log('- State/source context is derived from the accepted Report source line')
console.log('- Back/Forward and no-refetch task switching remain protected')
console.log('- work-history-ui-h5-responsive is next and not created')
