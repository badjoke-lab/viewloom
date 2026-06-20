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
const renderPath = 'src/live/history-report-text-render.ts'
const entryPath = 'src/live/history-report-text.ts'
const stylePath = 'src/history-report-text.css'
const registrationPath = 'src/live/history-default-day.ts'
const browserPath = 'scripts/history-report-text-browser.mjs'
const workflowPath = '../../.github/workflows/history-report-text.yml'
const browserWorkflowPath = '../../.github/workflows/history-report-browser.yml'

for (const path of [
  contractPath,
  statePath,
  renderPath,
  entryPath,
  stylePath,
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
    'Copying must not make another API request',
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

if (existsSync(join(root, renderPath))) {
  const source = read(renderPath)
  for (const fragment of [
    'data-history-report',
    'data-history-report-preview',
    'data-history-report-copy',
    'navigator.clipboard?.writeText',
    'selectPreview(preview)',
    'Current provider view',
  ]) requireFragment(renderPath, source, fragment)
  forbidPattern(renderPath, source, 'new API request', /\bfetch\s*\(/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "import '../history-report-text.css'",
    'installHistoryReportPayloadCapture(schedule)',
    'renderHistoryReport(payload)',
  ]) requireFragment(entryPath, source, fragment)
}

if (existsSync(join(root, registrationPath))) {
  requireFragment(registrationPath, read(registrationPath), "import './history-report-text'")
}

if (failures.length) {
  console.error('History report text verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History report text verification passed.')
