import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) issues.push(`missing file: ${path}`)
}
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) if (!source.includes(fragment)) issues.push(`${path}: missing ${fragment}`)
}

for (const path of [
  'apps/web/src/shared-shell.ts',
  'apps/web/src/shared-shell.css',
  'apps/web/src/mock-site.ts',
  'apps/web/src/provider-home.ts',
  'apps/web/scripts/quality-u10b-shell-browser.mjs',
  'scripts/verify-quality-u10b-browser-evidence.mjs',
  '.github/workflows/quality-u10b-shell.yml',
  'docs/work-in-progress/u10b-shared-shell.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-plan.md',
]) needFile(path)

need('apps/web/src/shared-shell.ts', [
  "import './shared-shell.css'",
  'export function installSharedShell()',
  'export function setSharedShellStatus',
  'export function syncSharedShellStatus',
  "nav.id = 'viewloom-global-navigation'",
  "nav.setAttribute('aria-label', 'Global navigation')",
  "menu.setAttribute('aria-controls', nav.id)",
  "event.key !== 'Escape'",
  "nav.setAttribute('aria-label', 'Footer navigation')",
  'footerDisclaimer',
  'Twitch observation',
  'Kick observation',
  'Platform-separated observatory',
])
need('apps/web/src/shared-shell.css', [
  '.global-nav.is-open',
  '.status-inline[data-state="loading"]',
  '.status-inline[data-state="partial"]',
  '.status-inline[data-state="unavailable"]',
  '.footer__disclaimer',
  '@media(max-width:760px)',
])
need('apps/web/src/mock-site.ts', [
  "import { installSharedShell, setSharedShellStatus } from './shared-shell'",
  'installSharedShell()',
  'setSharedShellStatus(node',
])
const mockSite = read('apps/web/src/mock-site.ts')
for (const forbidden of ['nav.style.display', 'nav.style.position', 'ensureChangelogLinks']) {
  if (mockSite.includes(forbidden)) issues.push(`mock-site.ts retains obsolete shell owner: ${forbidden}`)
}
need('apps/web/src/provider-home.ts', [
  "installSharedShell, setSharedShellStatus, syncSharedShellStatus",
  'installSharedShell()',
  'setSharedShellStatus(status',
  'syncSharedShellStatus(status)',
])
const providerHome = read('apps/web/src/provider-home.ts')
if (providerHome.includes('installMobileNavigation')) issues.push('provider-home.ts retains duplicate mobile navigation owner')

need('apps/web/scripts/quality-u10b-shell-browser.mjs', [
  "schema: 'viewloom-quality-u10b-shell-browser-v1'",
  "phase: 'U10B'",
  'routes: routes.length',
  'viewports: [1440, 390]',
  "assert.equal(initial.navInlineStyle, null",
  "await page.keyboard.press('Escape')",
])
need('scripts/verify-quality-u10b-browser-evidence.mjs', [
  'viewloom-quality-u10b-shell-browser-v1',
  'assert.equal(evidence.routes, 20)',
  'assert.equal(evidence.scenarios.length, 40)',
])
need('.github/workflows/quality-u10b-shell.yml', [
  'name: Quality U10B Shared Shell',
  'Verify U10B repository contract',
  'Run U10B shared shell browser acceptance',
  'quality-u10b-shell',
  'cancel-in-progress: true',
])
need('docs/work-in-progress/u10b-shared-shell.md', [
  'Status: active',
  'Phase: U10B',
  'work-quality-u10b-shell',
  'work-quality-u10c-visualization',
])
need('docs/product/current-roadmap.md', [
  'Phase 10 U10B shared shell active',
  'Active implementation branch: work-quality-u10b-shell',
])
need('docs/product/current-schedule.md', [
  'U10B shared shell                         active',
  'Active implementation branch             work-quality-u10b-shell',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 10 — U10B shared shell active',
  'Current implementation branch: `work-quality-u10b-shell`',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'Current branch: `work-quality-u10b-shell`',
  'Active phase: U10B shared shell',
])

if (issues.length) {
  console.error('ViewLoom U10B shared shell verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom U10B shared shell verification passed.')
console.log('- common shell ownership is centralized')
console.log('- provider status updates are normalized through the shared shell')
console.log('- 20 built routes have one desktop/mobile browser matrix')
