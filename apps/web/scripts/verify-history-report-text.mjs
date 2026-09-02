import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbid = (path, source, label, pattern) => { if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`) }

const files = {
  contract: 'docs/history-report-text-contract.md',
  state: 'src/live/history-report-text-state.ts',
  social: 'src/live/history-report-social.ts',
  render: 'src/live/history-report-text-render.ts',
  nativeShare: 'src/live/history-native-share.ts',
  shareCard: 'src/live/history-share-card.ts',
  export: 'src/live/history-export.ts',
  highlights: 'src/live/history-period-highlights.ts',
  entry: 'src/live/history-report-text.ts',
  registration: 'src/live/history-default-day.ts',
  browser: 'scripts/history-report-text-browser.mjs',
}

for (const path of Object.values(files)) if (!existsSync(join(root, path))) failures.push(`${path}: missing required report file`)

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of [
    'reuse the current History response',
    'not provider-wide totals',
    '280 Unicode code points',
    'must not make another API request',
    'hide the native share action when the browser does not expose the Web Share API',
    'separate atomic polite status regions',
    'current canonical `www.viewloom.net` origin',
    'Period highlights',
    'Twitch/Kick combined totals',
  ]) need(files.contract, source, fragment)
}

if (existsSync(join(root, files.state))) {
  const source = read(files.state)
  need(files.state, source, "url.pathname === '/api/history' || url.pathname === '/api/kick-history'")
  need(files.state, source, 'response.clone().json()')
  need(files.state, source, 'observed ViewLoom data; not a provider-wide total.')
  forbid(files.state, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, files.social))) {
  const source = read(files.social)
  for (const fragment of ['const MAX_POST_LENGTH = 280', 'historyShortPostText', "['period', 'from', 'to', 'metric']", 'not provider-wide.']) need(files.social, source, fragment)
  forbid(files.social, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.render))) {
  const source = read(files.render)
  for (const fragment of ['data-history-report','data-history-report-copy','data-history-report-mode','navigator.clipboard?.writeText','role="status" aria-live="polite" aria-atomic="true"','history-report-status','history-share-status','history-export-status']) need(files.render, source, fragment)
  forbid(files.render, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.nativeShare))) {
  const source = read(files.nativeShare)
  for (const fragment of ['data-history-report-share-native', "typeof navigator.share === 'function'", 'await navigator.share({', 'Share completed.', 'Sharing cancelled.']) need(files.nativeShare, source, fragment)
  forbid(files.nativeShare, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.shareCard))) {
  const source = read(files.shareCard)
  for (const fragment of ["canvas.setAttribute('role', 'img')", "canvas.setAttribute('aria-label', description)", 'www.viewloom.net/${provider}/history/', 'Observed ViewLoom data, not provider-wide.']) need(files.shareCard, source, fragment)
  forbid(files.shareCard, source, 'new API request', /\bfetch\s*\(/)
  forbid(files.shareCard, source, 'retired origin', /vl\.badjoke-lab\.com/)
}

if (existsSync(join(root, files.export))) {
  const source = read(files.export)
  for (const fragment of ['data-history-export-csv','data-history-export-json','Preparing ${format.toUpperCase()}…','${format.toUpperCase()} downloaded as ${filename}.']) need(files.export, source, fragment)
  forbid(files.export, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.highlights))) {
  const source = read(files.highlights)
  for (const fragment of ['renderHistoryPeriodHighlights','data-history-period-highlights','historyReportCoverage(payload)',"['period', 'from', 'to', 'metric']",'Missing values are not inferred.']) need(files.highlights, source, fragment)
  forbid(files.highlights, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  for (const fragment of ['installHistoryReportPayloadCapture(schedule)','renderHistoryPeriodHighlights(payload)','renderHistoryReport(payload)']) need(files.entry, source, fragment)
}
if (existsSync(join(root, files.registration))) {
  const source = read(files.registration)
  need(files.registration, source, "import './history-report-text'")
  need(files.registration, source, "import './history-native-share'")
}
if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of ['native sharing caused another History request','CSV export caused another History request','JSON export caused another History request','period highlights caused another History request','period highlights crossed provider endpoints']) need(files.browser, source, fragment)
}

if (failures.length) {
  console.error('History report text verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('History report text verification passed with product accessibility and no-refetch contracts.')
