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
const check = (condition, message) => {
  if (!condition) issues.push(message)
}

for (const path of [
  'apps/web/src/shared-shell.ts',
  'apps/web/src/shared-shell.css',
  'apps/web/src/mock-site.ts',
  'apps/web/src/provider-home.ts',
  'apps/web/src/live/watchlist-move-focus.ts',
  'apps/web/scripts/quality-u10b-shell-browser.mjs',
  'scripts/verify-quality-u10b-browser-evidence.mjs',
  '.github/workflows/quality-u10b-shell.yml',
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/cross-site-quality-remediation-plan.md',
]) needFile(path)

check(!existsSync(join(root, 'docs/work-in-progress/u10b-shared-shell.md')), 'completed U10B working note still exists')

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
  'installSharedShell, setSharedShellStatus, syncSharedShellStatus',
  'installSharedShell()',
  'setSharedShellStatus(status',
  'syncSharedShellStatus(status)',
])
check(!read('apps/web/src/provider-home.ts').includes('installMobileNavigation'), 'provider-home.ts retains duplicate mobile navigation owner')
need('apps/web/src/live/watchlist-move-focus.ts', [
  "import { installSharedShell } from '../shared-shell'",
  'installSharedShell()',
])

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
  'docs/audits/cross-site-quality-u10b-shared-shell.json',
  'Verify U10B repository contract',
  'Run U10B shared shell browser acceptance',
  'quality-u10b-shell',
  'cancel-in-progress: true',
])

const record = JSON.parse(read('docs/audits/cross-site-quality-u10b-shared-shell.json'))
check(record.schema === 'viewloom-cross-site-quality-u10b-shared-shell-v1', 'U10B record schema changed')
check(record.phase === 'U10B' && record.status === 'complete', 'U10B completion state changed')
check(record.implementation_pr === 456, 'U10B implementation PR changed')
check(record.implementation_head === '654833f70fc0776babbbfe9a9fab6829643f228a', 'U10B implementation head changed')
check(record.merge_commit === '95ad125c05aed32408b1ee79915a4b7ac910ba6c', 'U10B merge commit changed')
check(record.canonical_closeout_pr === 457, 'U10B closeout PR changed')
check(record.boundary?.provider_separation_required === true, 'U10B provider boundary changed')
for (const key of [
  'feature_visualization_change_authorized',
  'analysis_logic_change_authorized',
  'api_change_authorized',
  'd1_change_authorized',
  'binding_change_authorized',
  'collector_change_authorized',
  'cron_change_authorized',
  'retention_change_authorized',
  'output_schema_change_authorized',
  'localization_runtime_change_authorized',
]) check(record.boundary?.[key] === false, `U10B boundary changed: ${key}`)
check(record.scope?.built_routes === 20, 'U10B route count changed')
check(JSON.stringify(record.scope?.viewports) === JSON.stringify([1440, 390]), 'U10B viewport matrix changed')
check(record.scope?.browser_scenarios === 40, 'U10B scenario count changed')
check(record.browser_evidence?.run_id === 28369803589, 'U10B workflow evidence changed')
check(record.browser_evidence?.artifact_id === 7950954207, 'U10B artifact evidence changed')
check(record.browser_evidence?.result === 'pass', 'U10B browser result changed')
check(record.companion_public_browser_audit?.run_id === 28369803633, 'Public Browser workflow evidence changed')
check(record.companion_public_browser_audit?.artifact_id === 7951026988, 'Public Browser artifact evidence changed')
check(record.companion_public_browser_audit?.production_scenarios === 84, 'Public Browser scenario count changed')
check(record.companion_public_browser_audit?.p0 === 0, 'Public Browser P0 state changed')
check(record.exact_next_branch === 'work-quality-u10c-visualization', 'U10C handoff changed')
check(record.next_branch_created === false, 'U10C creation state changed')

need('docs/product/current-roadmap.md', [
  'Phase 10 U10B shared shell complete PR #456',
  'U10B canonical closeout complete PR #457',
  'Active implementation branch: none',
  'Exact next implementation branch: work-quality-u10c-visualization',
])
need('docs/product/current-schedule.md', [
  'U10B shared shell                         complete PR #456',
  'U10B canonical closeout                  complete PR #457',
  'Active implementation branch             none',
  'Exact next branch                        work-quality-u10c-visualization',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Current phase: Phase 10 — U10B complete',
  'Current implementation branch: none',
  'Exact next implementation branch: `work-quality-u10c-visualization`',
  'Completed U10B implementation: PR #456',
  'Completed U10B canonical closeout: PR #457',
])
need('docs/product/cross-site-quality-remediation-plan.md', [
  'Current branch: none',
  'Completed phase: U10B through PR #456',
  'Completed canonical closeout: PR #457',
  'Exact next branch: `work-quality-u10c-visualization`',
])

if (issues.length) {
  console.error('ViewLoom completed U10B shared shell verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom completed U10B shared shell verification passed.')
console.log('- permanent implementation and browser evidence are exact')
console.log('- common shell ownership remains centralized')
console.log('- U10C is exact next and uncreated')
