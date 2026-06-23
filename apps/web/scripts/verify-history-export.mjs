import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing required export file`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbidFetch = (path, source) => { if (/\bfetch\s*\(/.test(source)) failures.push(`${path}: export must not issue another request`) }

const files = {
  contract: 'docs/history-export-contract.md',
  r2Contract: 'docs/history-output-r2-contract.md',
  model: 'src/live/history-export-model.ts',
  serialize: 'src/live/history-export-serialize.ts',
  render: 'src/live/history-export.ts',
  sharedCsv: 'src/shared/output/csv.ts',
  sharedValues: 'src/shared/output/values.ts',
  sharedFilename: 'src/shared/output/filename.ts',
  style: 'src/history-export.css',
  entry: 'src/live/history-report-text.ts',
  browser: 'scripts/history-export-browser.mjs',
  workflow: '../../.github/workflows/history-export.yml',
  browserWorkflow: '../../.github/workflows/history-export-browser.yml',
}

for (const path of Object.values(files)) requireFile(path)

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of ['CSV daily rows and structured JSON', 'explicit missing rows', 'not provider-wide totals', 'at most 186 UTC days', 'does not make another History API request']) requireFragment(files.contract, source, fragment)
}

if (existsSync(join(root, files.r2Contract))) {
  const source = read(files.r2Contract)
  for (const fragment of ['viewloom-history-export-v1', 'CSV CRLF line endings', 'always-quoted non-null CSV cells', '1000 ms object-URL revoke delay', 'report copy fallback behavior']) requireFragment(files.r2Contract, source, fragment)
}

if (existsSync(join(root, files.model))) {
  const source = read(files.model)
  for (const fragment of ["schema: 'viewloom-history-export-v1'", 'utcDays(from, to, 186)', "coverage !== 'missing'", "coverage_state: observed ? coverage : 'missing'", "limitation: 'Observed ViewLoom data; not a provider-wide total.'", 'topStreamers.slice(0, 100)', 'finiteNumberOrNull']) requireFragment(files.model, source, fragment)
  forbidFetch(files.model, source)
}

if (existsSync(join(root, files.serialize))) {
  const source = read(files.serialize)
  for (const fragment of ["'provider'", "'coverage_state'", 'csvCell', "quote: 'always'", "spreadsheetSafety: 'apostrophe'", 'JSON.stringify(model, null, 2)']) requireFragment(files.serialize, source, fragment)
  if (/function\s+safeSpreadsheetText\s*\(/.test(source)) failures.push(`${files.serialize}: local spreadsheet helper must remain replaced by the shared CSV contract`)
}

if (existsSync(join(root, files.sharedCsv))) {
  const source = read(files.sharedCsv)
  for (const fragment of ['export function csvCell', 'export function spreadsheetSafeText', "spreadsheetSafety === 'apostrophe'", "quote === 'always'"]) requireFragment(files.sharedCsv, source, fragment)
}

if (existsSync(join(root, files.sharedValues))) {
  requireFragment(files.sharedValues, read(files.sharedValues), 'export function finiteNumberOrNull')
}

if (existsSync(join(root, files.sharedFilename))) {
  requireFragment(files.sharedFilename, read(files.sharedFilename), 'export function buildOutputFilename')
}

if (existsSync(join(root, files.render))) {
  const source = read(files.render)
  for (const fragment of ['data-history-export', 'data-history-export-csv', 'data-history-export-json', 'historyExportCsv(model)', 'historyExportJson(model)', 'historyExportFilename(', 'buildOutputFilename', 'URL.createObjectURL(blob)', 'window.setTimeout(() => URL.revokeObjectURL(url), 1000)']) requireFragment(files.render, source, fragment)
  forbidFetch(files.render, source)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  for (const fragment of ["import '../history-export.css'", "import { renderHistoryExport } from './history-export'", 'renderHistoryExport(payload)']) requireFragment(files.entry, source, fragment)
}

if (failures.length) {
  console.error('History export verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History export verification passed.')
