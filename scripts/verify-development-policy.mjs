import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const verify = (path, parts) => {
  const file = join(root, path)
  if (!existsSync(file)) {
    issues.push(`missing ${path}`)
    return
  }
  const text = readFileSync(file, 'utf8')
  for (const part of parts) if (!text.includes(part)) issues.push(`${path}: missing ${part}`)
}

verify('docs/operations/development-and-deployment-policy.md', ['Status: source of truth', '`work-*`', '`preview-*`', 'Twitch and Kick remain separate'])
verify('docs/operations/documentation-governance.md', ['Implementation must not begin from chat memory'])
verify('docs/product/current-roadmap.md', ['Phase 9 P9H2  active', 'work-history-ui-h2-chart', 'work-history-ui-h3-overview'])
verify('docs/product/current-schedule.md', ['P9H2 active', 'Active branch: work-history-ui-h2-chart', 'Next branch: work-history-ui-h3-overview'])
verify('docs/product/history-ui-repair-plan.md', ['Version: 1.8', 'work-history-ui-h2-chart'])
verify('docs/work-in-progress/history-ui-repair-working-note.md', ['history-chart-p9h2.ts', 'work-history-ui-h3-overview'])
verify('docs/product/history-ui-repair-spec.md', ['pointer/keyboard/touch inspection', 'non-color-only legend', 'no new global `window.fetch` replacement'])
verify('.github/workflows/history-ui-h2-chart.yml', ['concurrency:', 'cancel-in-progress: true'])
verify('apps/web/src/live/watchlist-page.ts', ['fetch(endpoint'])

const watchlist = readFileSync(join(root, 'apps/web/src/live/watchlist-page.ts'), 'utf8')
if (watchlist.includes('/api/watchlist')) issues.push('Watchlist API path introduced')
const chart = readFileSync(join(root, 'apps/web/src/live/history-chart-p9h2.ts'), 'utf8')
if (chart.includes('window.fetch =')) issues.push('P9H2 fetch wrapper introduced')
if (chart.includes('document.documentElement')) issues.push('P9H2 observer escaped chart scope')

if (issues.length) {
  console.error('Development policy verification failed')
  issues.forEach((issue) => console.error(`- ${issue}`))
  process.exit(1)
}
console.log('Development policy verification passed for P9H2.')
