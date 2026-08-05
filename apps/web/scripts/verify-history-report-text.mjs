import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing required report text file`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbidPattern = (path, source, label, pattern) => { if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`) }

const contractPath = 'docs/history-report-text-contract.md'
const statePath = 'src/live/history-report-text-state.ts'
const socialPath = 'src/live/history-report-social.ts'
const renderPath = 'src/live/history-report-text-render.ts'
const nativeSharePath = 'src/live/history-native-share.ts'
const shareCardPath = 'src/live/history-share-card.ts'
const exportPath = 'src/live/history-export.ts'
const highlightsPath = 'src/live/history-period-highlights.ts'
const entryPath = 'src/live/history-report-text.ts'
const stylePath = 'src/history-report-text.css'
const highlightsStylePath = 'src/history-period-highlights.css'
const registrationPath = 'src/live/history-default-day.ts'
const browserPath = 'scripts/history-report-text-browser.mjs'
const workflowPath = '../../.github/workflows/history-report-text.yml'
const browserWorkflowPath = '../../.github/workflows/history-report-browser.yml'

for (const path of [
  contractPath,
  statePath,
  socialPath,
  renderPath,
  nativeSharePath,
  shareCardPath,
  exportPath,
  highlightsPath,
  entryPath,
  stylePath,
  highlightsStylePath,
  registrationPath,
  browserPath,
  workflowPath,
  browserWorkflowPath,
]) requireFile(path)

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'reuse the current History response',
    'not provider-wide totals',
    'coverageState: missing',
    'compact short-post mode',
    '280 Unicode code points',
    'Copying, native sharing, switching text mode, rendering Period highlights, previewing or downloading PNG, and downloading CSV or JSON must not make another API request',
    'hide the native share action when the browser does not expose the Web Share API',
    'Arrow Left, Arrow Right, Arrow Up, Arrow Down, Home, and End',
    'separate atomic polite status regions',
    'allow Escape from the focused share-card preview',
    'current canonical `www.viewloom.net` origin',
    'Period highlights',
    'retained-period highlight feed',
    'Twitch/Kick combined totals',
  ]) requireFragment(contractPath, source, fragment)
}

if (existsSync(join(root, statePath))) {
  const source = read(statePath)
  for (const fragment of [
    "url.pathname === '/api/history' || url.pathname === '/api/kick-history'",
    'response.clone().json()',
    "coverage === 'missing'",
    'observed ViewLoom data; not a provider-wide total.',
    'historyReportCoverage',
    'historyReportText',
  ]) requireFragment(statePath, source, fragment)
  forbidPattern(statePath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, socialPath))) {
  const source = read(socialPath)
  for (const fragment of [
    'const MAX_POST_LENGTH = 280',
    'historyShortPostText',
    'historyShortPostLength',
    "['period', 'from', 'to', 'metric']",
    'not provider-wide.',
    'Required short-post fields exceed the length contract.',
  ]) requireFragment(socialPath, source, fragment)
  for (const forbidden of ['day', 'sort', 'limit']) {
    forbidPattern(socialPath, source, `retained ${forbidden} share parameter`, new RegExp(`\\[.*['\"]${forbidden}['\"]`))
  }
  forbidPattern(socialPath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(socialPath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, renderPath))) {
  const source = read(renderPath)
  for (const fragment of [
    'data-history-report',
    'data-history-report-preview',
    'data-history-report-copy',
    'data-history-report-mode',
    'data-history-report-count',
    'historyShortPostText',
    'historyShortPostLength',
    'navigator.clipboard?.writeText',
    'selectPreview(preview)',
    'Current provider view',
    'installModeKeyboardNavigation',
    "event.key === 'ArrowRight'",
    "event.key === 'ArrowLeft'",
    "event.key === 'Home'",
    "event.key === 'End'",
    'aria-controls="history-report-preview"',
    'role="status" aria-live="polite" aria-atomic="true"',
    'aria-describedby="history-report-status"',
    'aria-describedby="history-share-status"',
    'aria-describedby="history-export-status"',
  ]) requireFragment(renderPath, source, fragment)
  forbidPattern(renderPath, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, nativeSharePath))) {
  const source = read(nativeSharePath)
  for (const fragment of [
    'data-history-report-share-native',
    "typeof navigator.share === 'function'",
    'await navigator.share({',
    'preview.textContent',
    'Share completed.',
    'Sharing cancelled.',
    "button.setAttribute('aria-describedby', 'history-report-status')",
    'MutationObserver',
    'insertAdjacentElement',
  ]) requireFragment(nativeSharePath, source, fragment)
  forbidPattern(nativeSharePath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(nativeSharePath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, shareCardPath))) {
  const source = read(shareCardPath)
  for (const fragment of [
    'shareCardDescription(model)',
    "canvas.setAttribute('role', 'img')",
    "canvas.setAttribute('aria-label', description)",
    'canvas.textContent = description',
    'canvas.tabIndex = 0',
    "event.key !== 'Escape'",
    'toggle.focus()',
    'www.viewloom.net/${provider}/history/',
    'Observed ViewLoom data, not provider-wide.',
    'aria-describedby="history-share-status"',
    'role="status" aria-live="polite" aria-atomic="true"',
  ]) requireFragment(shareCardPath, source, fragment)
  forbidPattern(shareCardPath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(shareCardPath, source, 'retired share-card origin', /vl\.badjoke-lab\.com/)
  forbidPattern(shareCardPath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, exportPath))) {
  const source = read(exportPath)
  for (const fragment of [
    'runDownload(',
    'Preparing ${format.toUpperCase()}…',
    '${format.toUpperCase()} downloaded as ${filename}.',
    '${format.toUpperCase()} download failed in this browser.',
    'aria-describedby="history-export-status"',
    'role="status" aria-live="polite" aria-atomic="true"',
  ]) requireFragment(exportPath, source, fragment)
  forbidPattern(exportPath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(exportPath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, highlightsPath))) {
  const source = read(highlightsPath)
  for (const fragment of [
    'renderHistoryPeriodHighlights',
    'data-history-period-highlights',
    'data-history-period-highlight="',
    'historyReportCoverage(payload)',
    'topMetricDay(payload, metric)',
    'metricTopStreamer(payload, metric)',
    "metric === 'viewer_minutes'",
    "['period', 'from', 'to', 'metric']",
    'Missing values are not inferred.',
    'href="/${provider}/day-flow/${suffix}"',
    'href="/${provider}/battle-lines/${suffix}"',
  ]) requireFragment(highlightsPath, source, fragment)
  forbidPattern(highlightsPath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(highlightsPath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
  forbidPattern(highlightsPath, source, 'category implementation', /category(Id|Name|Key)|category[_-](id|name|key)/i)
}

if (existsSync(join(root, stylePath))) {
  requireFragment(stylePath, read(stylePath), 'grid-template-columns:repeat(6,minmax(0,1fr))')
}

if (existsSync(join(root, highlightsStylePath))) {
  const source = read(highlightsStylePath)
  for (const fragment of [
    '.history-period-highlights__grid',
    'grid-template-columns:repeat(4,minmax(0,1fr))',
    '@media(max-width:760px)',
    'grid-template-columns:1fr',
  ]) requireFragment(highlightsStylePath, source, fragment)
}

if (existsSync(join(root, browserPath))) {
  const source = read(browserPath)
  for (const fragment of [
    '__viewloomSharedData',
    'data-history-report-share-native',
    'Share completed.',
    'native sharing caused another History request',
    'browser fixture did not expose the Web Share API',
    'ArrowRight',
    'history report mode keyboard focus did not move',
    'role=status semantics are incomplete',
    'share-card accessible description is incomplete',
    'share-card Escape did not return focus',
    'CSV export caused another History request',
    'JSON export caused another History request',
    'data-history-period-highlights',
    'period highlights caused another History request',
    'period highlights crossed provider endpoints',
  ]) requireFragment(browserPath, source, fragment)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "import '../history-report-text.css'",
    "import { renderHistoryPeriodHighlights } from './history-period-highlights'",
    'installHistoryReportPayloadCapture(schedule)',
    'renderHistoryPeriodHighlights(payload)',
    'renderHistoryReport(payload)',
  ]) requireFragment(entryPath, source, fragment)
}

if (existsSync(join(root, registrationPath))) {
  const source = read(registrationPath)
  requireFragment(registrationPath, source, "import './history-report-text'")
  requireFragment(registrationPath, source, "import './history-native-share'")
}

for (const [path, fragments] of [
  [workflowPath, ["'apps/web/src/live/history-share-card.ts'", "'apps/web/src/live/history-export*.ts'"]],
  [browserWorkflowPath, ["'apps/web/src/live/history-share-card.ts'", "'apps/web/src/live/history-export*.ts'"]],
]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of fragments) requireFragment(path, source, fragment)
}

if (failures.length) {
  console.error('History report text verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History report text verification passed with output accessibility contracts.')
