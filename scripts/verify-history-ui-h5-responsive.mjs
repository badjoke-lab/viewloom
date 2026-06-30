import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (condition, message) => { if (!condition) issues.push(message) }
const needFile = (path) => check(existsSync(join(root, path)), `missing file: ${path}`)
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}

for (const path of [
  'apps/web/src/live/history-responsive-p9h5.ts',
  'apps/web/src/history-responsive-p9h5.css',
  'apps/web/scripts/history-ui-h5-responsive-browser.mjs',
  'apps/web/scripts/history-ui-h5-responsive-runner.mjs',
  'scripts/verify-history-ui-h5-responsive.mjs',
  '.github/workflows/history-ui-h5-responsive.yml',
  'docs/work-in-progress/p9h5-activation.md',
  'docs/product/history-ui-repair-plan.md',
  'docs/operations/history-production-acceptance-2026-06-28.md',
]) needFile(path)

for (const path of [
  'apps/web/scripts/h5-acceptance.mjs',
  'apps/web/scripts/history-ui-h5-responsive-browser-v2.mjs',
]) check(!existsSync(join(root, path)), `unexpected duplicate P9H5 acceptance file: ${path}`)

need('apps/web/src/live/history-usability-pass.ts', [
  "import '../history-responsive-p9h5.css'",
  "import './history-responsive-p9h5'",
])
for (const path of ['apps/web/twitch/history/index.html', 'apps/web/kick/history/index.html']) need(path, [
  'class="history-skip-link"',
  'data-history-skip-link',
  'href="#history-main"',
  'id="history-main"',
  'tabindex="-1"',
])
need('apps/web/src/live/history-responsive-p9h5.ts', [
  "document.querySelector<HTMLElement>('.history-page')",
  "document.querySelector<HTMLAnchorElement>('[data-history-skip-link]')",
  "document.querySelector<HTMLElement>('#history-main')",
  "page.dataset.historyP9h5Ready = 'true'",
  "page.dataset.historyAccessibilityOwner = 'p9h5'",
  'target.focus({ preventScroll: true })',
  "target.scrollIntoView({ block: 'start' })",
])
need('apps/web/src/live/history-chart-keyboard-delegation.ts', [
  "document.addEventListener('keydown', handleDelegatedKeydown, true)",
  "target?.closest<HTMLButtonElement>('[data-history-chart-keyboard-target]')",
  "keyboard.dataset.historyDelegatedBound = 'true'",
  'keyboard.dataset.historyKeyboardDay = dayValue',
])
need('apps/web/src/history-responsive-p9h5.css', [
  '.history-skip-link', ':focus-visible', 'min-height:44px', 'min-height:48px',
  'overflow-wrap:anywhere', '@media(max-width:820px)', '@media(max-width:760px)',
  '@media(max-width:420px)', '@media(prefers-reduced-motion:reduce)',
  '@media(prefers-contrast:more)', '@media(forced-colors:active)',
])
need('apps/web/scripts/history-ui-h5-responsive-browser.mjs', [
  "schema: 'viewloom-history-ui-h5-responsive-v1'", "phase: 'P9H5'",
  "provider: 'twitch', width: 1440", "provider: 'kick', width: 820",
  "provider: 'kick', width: 390", "provider: 'twitch', width: 360",
  "mode: 'forced'", 'first Tab did not reach History skip link',
  'page horizontal overflow', 'period target', 'publishing target',
  'task switching refetched History',
])
need('apps/web/scripts/history-ui-h5-responsive-runner.mjs', [
  "new RealDate('2026-06-25T00:00:00.000Z')",
  "await import('./history-ui-h5-responsive-browser.mjs')",
])
need('docs/product/history-ui-repair-plan.md', [
  'Status: complete', 'Completed P9H5: PR #447',
  'Completed P9H5 canonical closeout: PR #448',
  'Completed P9H7 production acceptance: PR #451',
])
need('docs/work-in-progress/p9h5-activation.md', [
  'Status: complete', 'Implementation PR: #447', 'Canonical closeout PR: #448',
  'work-history-ui-h6-candidate', 'P9H6 branch created: no',
])
need('docs/operations/history-production-acceptance-2026-06-28.md', [
  'twitch-desktop-1440-hosted', 'kick-tablet-820-hosted',
  'kick-mobile-390-hosted', 'twitch-mobile-360-hosted',
  'twitch-forced-colors-390-hosted', 'All passed with zero horizontal overflow.',
  'History Phase 9 is accepted in production.',
])
need('.github/workflows/history-ui-h5-responsive.yml', [
  'name: History UI P9H5 Responsive', 'Verify P9H5 repository contract',
  'Run P9H5 responsive and accessibility acceptance',
  'history-ui-h5-responsive', 'cancel-in-progress: true',
])

const moduleSource = read('apps/web/src/live/history-responsive-p9h5.ts')
for (const forbidden of ['fetch(', 'MutationObserver', 'setInterval(', '/api/history', '/api/kick-history']) {
  check(!moduleSource.includes(forbidden), `P9H5 module contains forbidden ${forbidden}`)
}

if (issues.length) {
  console.error('ViewLoom History P9H5 responsive verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}
console.log('ViewLoom History P9H5 responsive verification passed.')
console.log('- responsive and accessibility contracts remain protected')
console.log('- permanent History acceptance, not current roadmap wording, owns P9H5 completion')
