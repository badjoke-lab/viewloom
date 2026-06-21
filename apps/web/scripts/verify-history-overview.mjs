import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const files = {
  style: 'src/history-overview.css',
  module: 'src/live/history-overview.ts',
  entry: 'src/live/history-usability-pass.ts',
  shell: 'src/live/history-view-shell.ts',
  browser: 'scripts/history-overview-browser.mjs',
  workflow: '../../.github/workflows/history-overview.yml',
  browserWorkflow: '../../.github/workflows/history-overview-browser.yml',
}
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }

Object.values(files).forEach(requireFile)

if (existsSync(join(root, files.style))) {
  const source = read(files.style)
  for (const fragment of [
    '#history-view-overview',
    'grid-template-areas:',
    '"ranking-title insights"',
    '[data-history-columns]',
    '.history-overview-insights',
    'max-width:1440px',
    '@media(max-width:760px)',
  ]) requireFragment(files.style, source, fragment)
}

if (existsSync(join(root, files.module))) {
  const source = read(files.module)
  for (const fragment of [
    "url.pathname === '/api/history' || url.pathname === '/api/kick-history'",
    'Biggest supported rise',
    'Audience vs previous',
    'Peak vs previous',
    'Withheld',
    'data-history-overview-insights',
    'history-overview-ranking-title',
    'history-overview-coverage-title',
  ]) requireFragment(files.module, source, fragment)
  if (/\/api\/(?!history|kick-history)/.test(source)) failures.push(`${files.module}: unexpected API path`)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  requireFragment(files.entry, source, "import '../history-overview.css'")
  requireFragment(files.entry, source, "import './history-overview'")
  if (source.indexOf("import './history-overview'") < source.indexOf("import './history-view-shell'")) failures.push(`${files.entry}: Overview enhancement must install after the task shell`)
}

if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of [
    'historyOverviewReady',
    'data-history-overview-insights-ready',
    'comparison no longer follows the summary before the chart',
    'full archive content is visible in Overview',
    'Report content is visible in Overview',
    'crossed provider endpoints',
  ]) requireFragment(files.browser, source, fragment)
}

for (const path of [files.workflow, files.browserWorkflow]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of ['concurrency:', 'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}', 'cancel-in-progress: true']) requireFragment(path, source, fragment)
}

if (failures.length) {
  console.error('History Overview verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('History Overview verification passed.')
