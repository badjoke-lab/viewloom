import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing required calendar heat file`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbidPattern = (path, source, label, pattern) => { if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`) }

const contractPath = 'docs/history-calendar-heat-contract.md'
const statePath = 'src/live/history-calendar-heat-state.ts'
const renderPath = 'src/live/history-calendar-heat-render.ts'
const entryPath = 'src/live/history-calendar-heat.ts'
const stylePath = 'src/history-calendar-heat.css'
const registrationPath = 'src/live/history-default-day.ts'
const browserPath = 'scripts/history-calendar-heat-browser.mjs'

for (const path of [contractPath, statePath, renderPath, entryPath, stylePath, registrationPath, browserPath]) requireFile(path)

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'existing History endpoint',
    'render at most 186 UTC days',
    'Missing dates have no inferred metric value',
    'must not make another browser request',
    'Twitch/Kick combined totals',
  ]) requireFragment(contractPath, source, fragment)
}

if (existsSync(join(root, statePath))) {
  const source = read(statePath)
  for (const fragment of [
    "url.pathname === '/api/history' || url.pathname === '/api/kick-history'",
    'response.clone().json()',
    "payload.metric === 'peak_viewers'",
    'utcDays(from, to, 186)',
    "coverageState: 'missing'",
    'observed: false',
  ]) requireFragment(statePath, source, fragment)
  forbidPattern(statePath, source, 'network call outside captured History fetch', /fetch\(['"]\/api\//)
}

if (existsSync(join(root, renderPath))) {
  const source = read(renderPath)
  for (const fragment of [
    'Calendar heat',
    'UTC days · coverage-aware',
    'data-history-calendar-grid',
    'data-history-calendar-day',
    'role="gridcell"',
    'aria-selected',
    'Partial or poor coverage is outlined',
    '.history-day-column[data-history-day=',
    '[data-history-day-card=',
    'Viewer-minutes',
    'Peak viewers',
  ]) requireFragment(renderPath, source, fragment)
  forbidPattern(renderPath, source, 'calendar-owned API request', /fetch\s*\(/)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "import '../history-calendar-heat.css'",
    'installHistoryCalendarPayloadCapture(schedule)',
    'syncHistoryCalendarSelection',
  ]) requireFragment(entryPath, source, fragment)
}

if (existsSync(join(root, registrationPath))) {
  requireFragment(registrationPath, read(registrationPath), "import './history-calendar-heat'")
}

if (existsSync(join(root, stylePath))) {
  const source = read(stylePath)
  for (const fragment of [
    '.history-calendar__weekdays,.history-calendar__grid',
    'grid-template-columns:repeat(7',
    '.history-calendar__cell--missing',
    '.history-calendar__cell.is-selected',
    '@media(max-width:760px)',
  ]) requireFragment(stylePath, source, fragment)
}

if (failures.length) {
  console.error('ViewLoom History calendar heat verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom History calendar heat verification passed.')
