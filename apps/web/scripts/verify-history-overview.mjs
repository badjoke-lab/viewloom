import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const required = [
  'src/history-overview.css',
  'src/live/history-overview.ts',
  'src/live/history-usability-pass.ts',
  'scripts/history-overview-browser.mjs',
  '../../.github/workflows/history-overview.yml',
  '../../.github/workflows/history-overview-browser.yml',
]
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }

required.forEach((path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing`) })

if (existsSync(join(root, required[0]))) {
  const source = read(required[0])
  for (const fragment of ['#history-view-overview','grid-template-areas:','"ranking-title insights"','[data-history-columns]','.history-overview-insights','max-width:1440px','@media(max-width:760px)']) need(required[0], source, fragment)
}
if (existsSync(join(root, required[1]))) {
  const source = read(required[1])
  for (const fragment of ["url.pathname === '/api/history' || url.pathname === '/api/kick-history'",'Audience vs previous','Peak vs previous','Biggest supported rise','Withheld','history-overview-ranking-title','history-overview-coverage-title']) need(required[1], source, fragment)
}
if (existsSync(join(root, required[2]))) {
  const source = read(required[2])
  need(required[2], source, "import '../history-overview.css'")
  need(required[2], source, "import './history-overview'")
}
if (existsSync(join(root, required[3]))) {
  const source = read(required[3])
  for (const fragment of ['historyOverviewReady','historyOverviewInsightsReady','comparison no longer follows the summary before the chart','full archive content is visible in Overview','Report content is visible in Overview','crossed provider endpoints']) need(required[3], source, fragment)
}
for (const path of required.slice(4)) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of ['concurrency:','group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}','cancel-in-progress: true']) need(path, source, fragment)
}

if (failures.length) {
  console.error('History Overview verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History Overview verification passed.')
