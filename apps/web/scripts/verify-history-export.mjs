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
  model: 'src/live/history-export-model.ts',
  serialize: 'src/live/history-export-serialize.ts',
  render: 'src/live/history-export.ts',
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

if (existsSync(join(root, files.model))) {
  const source = read(files.model)
  for (const fragment of ["schema: 'viewloom-history-export-v1'", 'utcDays(from, to, 186)', "coverage !== 'missing'", "coverage_state: observed ? coverage : 'missing'", "limitation: 'Observed ViewLoom data; not a provider-wide total.'", 'topStreamers.slice(0, 100)']) requireFragment(files.model, source, fragment)
  forbidFetch(files.model, source)
}

if (existsSync(join(root, files.serialize))) {
  const source = read(files.serialize)
  for (const fragment of ["'provider'", "'coverage_state'", 'safeSpreadsheetText', 'JSON.stringify(model, null, 2)']) requireFragment(files.serialize, source, fragment)
}

if (existsSync(join(root, files.render))) {
  const source = read(files.render)
  for (const fragment of ['data-history-export', 'data-history-export-csv', 'data-history-export-json', 'historyExportCsv(model)', 'historyExportJson(model)', 'URL.createObjectURL(blob)']) requireFragment(files.render, source, fragment)
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
