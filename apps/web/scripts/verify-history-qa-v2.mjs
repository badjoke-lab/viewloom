import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }

const pages = ['twitch/history/index.html', 'kick/history/index.html']
for (const path of pages) {
  if (!existsSync(join(root, path))) { failures.push(`${path}: missing`); continue }
  const source = read(path)
  const title = path.startsWith('twitch/') ? 'History & Trends for Twitch live streams | ViewLoom' : 'History & Trends for Kick live streams | ViewLoom'
  for (const fragment of [`<title>${title}</title>`, '<small>Source</small>', 'data-history-period="7d"', 'data-history-period="30d"', 'data-history-period="custom"', 'data-history-metric="viewer_minutes"', 'data-history-metric="peak_viewers"', 'data-history-selected-day', 'data-history-daily-archive', 'data-history-columns']) requireFragment(path, source, fragment)
}

for (const path of ['functions/api/history.ts', 'functions/api/kick-history.ts']) {
  const source = read(path)
  for (const fragment of ['validateRequestedRange(', 'isCalendarDay(', "'invalid_range'", 'History custom range is limited to 90 days in v1.']) requireFragment(path, source, fragment)
}

const model = read('functions/_history/model.ts')
for (const fragment of ["source: allDemo ? 'demo' : 'real'", "coverage.state === 'good' ? 'fresh' : 'partial'", "comparisonState: 'comparable' | 'new' | 'insufficient'"]) requireFragment('functions/_history/model.ts', model, fragment)

const style = read('src/history-page.css')
for (const fragment of ['[data-history-columns]{grid-template-columns:1fr}', '.history-stage{position:relative', '.history-stage svg{display:block;width:100%', '.history-day-column.is-selected']) requireFragment('src/history-page.css', style, fragment)

if (failures.length) {
  console.error('History repair QA failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History repair QA passed.')
