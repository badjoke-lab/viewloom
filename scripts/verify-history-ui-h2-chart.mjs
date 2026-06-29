import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const check = (path, parts) => {
  const file = join(root, path)
  if (!existsSync(file)) {
    failures.push(`missing ${path}`)
    return
  }
  const source = readFileSync(file, 'utf8')
  for (const part of parts) if (!source.includes(part)) failures.push(`${path}: missing ${part}`)
}

check('docs/product/current-roadmap.md', [
  'Phase 9 History P1 repair complete',
  'Exact next implementation branch: work-quality-u10a-baseline',
])
check('docs/product/current-schedule.md', [
  'P9H2 History chart interpretation        complete PR #436',
  'Phase 9 History P1 repair                complete',
])
check('docs/product/post-watchlist-program-plan.md', [
  'Completed chart interpretation: PR #436',
  'Completed History production acceptance: PR #451',
])
check('docs/product/history-ui-repair-plan.md', [
  'Status: complete',
  'Completed P9H2: PR #436',
  'Completed P9H7 production acceptance: PR #451',
])
check('docs/operations/history-production-acceptance-2026-06-28.md', [
  'History Phase 9 is accepted in production.',
  'All passed with zero horizontal overflow.',
])
check('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-chart-p9h2.css'",
  "import './history-chart-p9h2'",
  "import './history-chart-keyboard-delegation'",
  "import './history-comparison-clarity'",
])
check('apps/web/src/live/history-usability.ts', [
  "sourceCoverage === 'in-progress' || day === today",
  'group.dataset.historySourceCoverage = sourceCoverage',
  "day?.coverageState === 'in-progress' || day?.day === todayUtc()",
])
check('apps/web/src/live/history-chart-p9h2.ts', [
  'new MutationObserver(queue).observe(stage',
  'data-history-chart-keyboard-target',
  'ArrowLeft ArrowRight Home End Enter Space',
  "svg.setAttribute('aria-labelledby'",
  "stage.dataset.historyChartReady = 'true'",
  "legend.dataset.historyLegendNonColor = 'true'",
  "detail.setAttribute('aria-live', 'polite')",
  "hit.setAttribute('aria-hidden', 'true')",
])
check('apps/web/src/live/history-chart-keyboard-delegation.ts', [
  "document.addEventListener('keydown', handleDelegatedKeydown, true)",
  "event.key === 'Home'",
  "event.key === 'ArrowRight'",
  "hit.dispatchEvent(new MouseEvent('click', { bubbles: true }))",
])
check('apps/web/src/live/history-comparison-clarity.ts', [
  'response.clone().json()',
  "setText(card.querySelector<HTMLElement>('strong'), 'No baseline')",
  "setText(label, 'Tracked streams (max)')",
])
check('apps/web/src/live/history-archives.ts', [
  'function ensureInitialReady()',
  "root.dataset.historyDailyHierarchyReady = 'true'",
  "node.matches('[data-history-day-card]')",
])
check('apps/web/src/history-chart-p9h2.css', [
  '.history-state-marker',
  '.history-chart-inspection',
  '.history-chart-keyboard-target:focus-visible',
  'forced-colors:active',
])
check('apps/web/scripts/history-ui-h2-chart-browser.mjs', [
  "schema: 'viewloom-history-ui-h2-chart-v1'",
  "phase: 'P9H2'",
  'if (!touch)',
  "keyboard.press('Home')",
  "keyboard.press('ArrowRight')",
  "demoDay.locator('.history-bar-hit')",
  'demoHit.tap()',
  'calls.length, requestCount',
  'evidence.checkpoint',
])
check('.github/workflows/history-ui-h2-chart.yml', [
  'name: History UI P9H2 Chart',
  'Run P9H2 chart browser acceptance',
  'cancel-in-progress: true',
])

for (const path of [
  'apps/web/src/live/history-chart-p9h2.ts',
  'apps/web/src/live/history-chart-source-state.ts',
  'apps/web/src/live/history-chart-keyboard-delegation.ts',
]) {
  if (!existsSync(join(root, path))) continue
  const source = readFileSync(join(root, path), 'utf8')
  if (source.includes('window.fetch =')) failures.push(`${path}: fetch wrapper added`)
  if (source.includes('document.documentElement')) failures.push(`${path}: observer escaped chart scope`)
}

if (failures.length) {
  console.error('P9H2 verification failed')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('P9H2 chart repository verification passed.')
console.log('- chart semantics and interaction remain protected')
console.log('- Phase 9 production acceptance is permanent')
