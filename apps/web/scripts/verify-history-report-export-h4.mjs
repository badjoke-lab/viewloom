import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const files = {
  contract: 'docs/history-report-export-h4-contract.md',
  render: 'src/live/history-report-text-render.ts',
  nativeShare: 'src/live/history-native-share.ts',
  share: 'src/live/history-share-card.ts',
  export: 'src/live/history-export.ts',
  entry: 'src/live/history-report-text.ts',
  registration: 'src/live/history-default-day.ts',
  style: 'src/history-report-text.css',
  shareStyle: 'src/history-share-card.css',
  browser: 'scripts/history-report-export-h4-browser.mjs',
  workflow: '../../.github/workflows/history-report-export-h4.yml',
  browserWorkflow: '../../.github/workflows/history-report-export-h4-browser.yml',
}
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbid = (path, source, label, pattern) => { if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`) }

Object.values(files).forEach((path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing`) })

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of [
    'One top-level `Report & Export` surface',
    'Copy, Share through device, Preview share card, Download PNG, Download CSV, Download JSON',
    'hidden when the Web Share API is unavailable',
    'must not issue another History API request',
    'viewloom-history-export-v1',
    'No History API, D1 schema, collector, cron, retention',
  ]) need(files.contract, source, fragment)
}

if (existsSync(join(root, files.render))) {
  const source = read(files.render)
  for (const fragment of [
    'Report &amp; Export',
    'data-history-report data-history-share data-history-export',
    'history-publish-actions',
    'data-history-share-toggle',
    'data-history-share-preview hidden',
    'data-history-export-csv',
    'data-history-export-json',
    'history-report-status',
    'history-share-status',
    'history-export-status',
  ]) need(files.render, source, fragment)
  const ordered = [
    'data-history-report-copy',
    'data-history-share-toggle',
    'data-history-share-download',
    'data-history-export-csv',
    'data-history-export-json',
  ]
  let position = -1
  for (const fragment of ordered) {
    const next = source.indexOf(fragment)
    if (next <= position) failures.push(`${files.render}: base action order is not Copy / Preview / PNG / CSV / JSON`)
    position = next
  }
}

if (existsSync(join(root, files.nativeShare))) {
  const source = read(files.nativeShare)
  for (const fragment of [
    'data-history-report-share-native',
    'copyButton.insertAdjacentElement(\'afterend\', button)',
    "typeof navigator.share === 'function'",
    'preview.textContent',
    'await navigator.share({',
    'Share completed.',
    'Sharing cancelled.',
    "button.setAttribute('aria-describedby', 'history-report-status')",
  ]) need(files.nativeShare, source, fragment)
  forbid(files.nativeShare, source, 'new API request', /\bfetch\s*\(/)
  forbid(files.nativeShare, source, 'obsolete share-opened status', /Share sheet opened\./)
}

if (existsSync(join(root, files.share))) {
  const source = read(files.share)
  for (const fragment of [
    'data-history-share-toggle',
    'data-history-share-preview',
    'Share card available on demand.',
    'canvas.dataset.shareRendered',
    'setOpen(mount.dataset.historyShareOpen',
    'canvas.toBlob',
    'shareCardDescription(model)',
    "event.key !== 'Escape'",
  ]) need(files.share, source, fragment)
  forbid(files.share, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.export))) {
  const source = read(files.export)
  for (const fragment of [
    'data-history-export-csv',
    'data-history-export-json',
    'historyExportCsv(model)',
    'historyExportJson(model)',
    'Preparing ${format.toUpperCase()}…',
    '${format.toUpperCase()} downloaded as ${filename}.',
  ]) need(files.export, source, fragment)
  forbid(files.export, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  for (const fragment of ['renderHistoryReport(payload)', 'renderHistoryShareCard(payload)', 'renderHistoryExport(payload)', 'installHistoryReportPayloadCapture(schedule)']) need(files.entry, source, fragment)
}

if (existsSync(join(root, files.registration))) {
  need(files.registration, read(files.registration), "import './history-native-share'")
}

if (existsSync(join(root, files.style))) {
  const source = read(files.style)
  for (const fragment of ['.history-publish-actions', 'grid-template-columns:repeat(6', '.history-publish-statuses', '.history-share__preview[hidden]', '@media(max-width:760px)']) need(files.style, source, fragment)
}

if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of [
    'one top-level workspace',
    'Share report',
    'Preview share card',
    'nativeShareHidden',
    'History API was fetched again',
    'horizontal overflow',
  ]) need(files.browser, source, fragment)
}

for (const path of [files.workflow, files.browserWorkflow]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of ['concurrency:', 'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}', 'cancel-in-progress: true']) need(path, source, fragment)
  need(path, source, 'apps/web/src/live/history-native-share.ts')
}

if (existsSync(join(root, files.browserWorkflow))) {
  const source = read(files.browserWorkflow)
  for (const fragment of [
    'node scripts/history-report-export-h4-browser.mjs',
    'node scripts/history-export-browser.mjs',
    'HISTORY_EXPORT_BASE_URL',
    'artifacts/history-report-export-h4/export-contract',
  ]) need(files.browserWorkflow, source, fragment)
}

if (failures.length) {
  console.error('History Report & Export H4 verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History Report & Export H4 verification passed with accessibility status contracts.')
