import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const files = {
  contract: 'docs/history-archives-h3-contract.md',
  style: 'src/history-archives.css',
  module: 'src/live/history-archives.ts',
  entry: 'src/live/history-usability-pass.ts',
  peak: 'src/live/history-peak-archive-render.ts',
  battle: 'src/live/history-battle-archive-render.ts',
  browser: 'scripts/history-archives-browser.mjs',
  workflow: '../../.github/workflows/history-archives.yml',
  browserWorkflow: '../../.github/workflows/history-archives-browser.yml',
}
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }

Object.values(files).forEach((path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing`) })

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of ['Latest matching day', 'Highest peak', 'Closest daily matchup', 'No reversal or exact event time is inferred', 'Archive switching does not issue another History API request']) need(files.contract, source, fragment)
}

if (existsSync(join(root, files.style))) {
  const source = read(files.style)
  for (const fragment of [
    '#history-archive-daily .day-card.is-featured',
    '.history-peak-event.is-featured',
    '.history-battle-card.is-featured',
    '.history-archive-event-type',
    'background:var(--surface-raised)',
    '@media(max-width:760px)',
  ]) need(files.style, source, fragment)
  for (const forbidden of ['var(--paper)', 'rgba(255,255,255,.72)']) {
    if (source.includes(forbidden)) failures.push(`${files.style}: placeholder-light archive surface remains (${forbidden})`)
  }
}

if (existsSync(join(root, files.module))) {
  const source = read(files.module)
  for (const fragment of ['Latest matching day', 'Observed day', 'is-featured', 'historyDailyHierarchyReady', 'data-history-archive-filter']) need(files.module, source, fragment)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  need(files.entry, source, "import '../history-archives.css'")
  need(files.entry, source, "import './history-archives'")
  if (source.indexOf("import '../history-archives.css'") < source.indexOf("import './history-default-day'")) failures.push(`${files.entry}: archive overrides must load after legacy archive modules`)
}

if (existsSync(join(root, files.peak))) {
  const source = read(files.peak)
  for (const fragment of ['Highest peak', 'Observed peak', 'data-history-peak-featured', 'entries.slice(0, 10)', 'Show all']) need(files.peak, source, fragment)
}

if (existsSync(join(root, files.battle))) {
  const source = read(files.battle)
  for (const fragment of ['Closest daily matchup', 'Very close day', 'Close day', 'Competitive day', 'data-history-battle-featured', 'No reversal or exact event time inferred.', 'entries.slice(0, 10)']) need(files.battle, source, fragment)
  if (source.includes('Reversal event')) failures.push(`${files.battle}: unsupported reversal event label introduced`)
}

if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of ['Latest matching day', 'Highest peak', 'Closest daily matchup', 'Very close day', 'History API was fetched again', 'horizontal overflow']) need(files.browser, source, fragment)
}

for (const path of [files.workflow, files.browserWorkflow]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of ['concurrency:', 'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}', 'cancel-in-progress: true']) need(path, source, fragment)
}

if (failures.length) {
  console.error('History Archives verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History Archives verification passed.')
