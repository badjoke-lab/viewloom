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
  'Phase 9 P9H2  complete PR #436',
  'P9H2 closeout complete PR #438',
  'Active implementation branch: none',
  'Exact next implementation branch: work-history-ui-h3-overview',
  'P9H3 branch created: no',
])
check('docs/product/current-schedule.md', [
  'P9H2 History chart interpretation        complete PR #436',
  'P9H2 documentation closeout              complete PR #438',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h3-overview',
  'P9H3 branch created                      no',
])
check('docs/product/post-watchlist-program-plan.md', [
  'Version: 2.5',
  'Current phase: Phase 9 — P9H3 exact next, not started',
  'Current implementation branch: none',
  '| 9 | P9H2 | complete PR #436',
  '| 9 | P9H2 closeout | complete PR #438',
])
check('docs/product/history-ui-repair-plan.md', [
  'Version: 1.9',
  'Completed P9H2: PR #436',
  'Completed P9H2 canonical closeout: PR #438',
  'Current implementation branch: none',
  'Exact next branch after explicit continuation: `work-history-ui-h3-overview`',
])
check('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H2 implementation: PR #436',
  'Completed P9H2 canonical closeout: PR #438',
  'history-chart-p9h2.ts',
  'history-usability.ts                 completed-day and coverage-state augmentation',
  'history-day-link-bridge.ts',
  'history-ui-h2-chart-browser.mjs',
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
check('apps/web/src/navigation/history-day-link-bridge.ts', [
  'historyBattleBridgeFocusDay',
  'bridgeBattleDay',
  'archiveDay.dataset.historyDay = archiveDay.dataset.historyDayCard ?? day',
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
  'pressKeyboardDay',
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
