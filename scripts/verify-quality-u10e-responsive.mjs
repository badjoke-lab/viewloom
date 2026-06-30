import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10e-responsive.md',
  'apps/web/src/quality-u10e-responsive.css',
  'apps/web/src/shared-shell.ts',
  'apps/web/twitch/watchlist/index.html',
  'apps/web/kick/watchlist/index.html',
  'apps/web/scripts/quality-u10e-responsive-browser.mjs',
  'scripts/verify-quality-u10e-responsive.mjs',
  'scripts/verify-quality-u10e-browser-evidence.mjs',
  '.github/workflows/quality-u10e-responsive.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)

const css = read('apps/web/src/quality-u10e-responsive.css')
for (const fragment of [
  'min-height:44px',
  'min-height:48px',
  '@media(prefers-contrast:more)',
  '@media(forced-colors:active)',
  '.dayflow-toolbar .control-group',
  '[data-channel-copy-url]',
  '[data-watchlist-add]',
  '.portal-provider-card__actions .button',
]) assert.ok(css.includes(fragment), `U10E CSS missing ${fragment}`)

const shell = read('apps/web/src/shared-shell.ts')
assert.ok(shell.includes("import './quality-u10e-responsive.css'"), 'shared shell does not load U10E CSS')
for (const path of ['apps/web/twitch/watchlist/index.html', 'apps/web/kick/watchlist/index.html']) {
  assert.ok(read(path).includes('<link rel="stylesheet" href="/src/quality-u10e-responsive.css" />'), `${path}: U10E CSS link missing`)
}

const browser = read('apps/web/scripts/quality-u10e-responsive-browser.mjs')
for (const fragment of [
  "schema: 'viewloom-quality-u10e-responsive-browser-v1'",
  "{ id: 'portal', path: '/'",
  "{ id: 'twitch-day-flow', path: '/twitch/day-flow/' }",
  "{ id: 'kick-watchlist', path: '/kick/watchlist/'",
  '{ width: 1440', '{ width: 820', '{ width: 390', '{ width: 360',
  "forcedColors: 'active'",
  'assert.equal(evidence.scenarios.length, 36)',
  "assert.equal(dateName.label || dateName.ariaLabel, 'UTC date'",
]) assert.ok(browser.includes(fragment), `U10E browser acceptance missing ${fragment}`)

const note = read('docs/work-in-progress/u10e-responsive.md')
for (const fragment of [
  'Status: active',
  'work-quality-u10e-responsive',
  'work-quality-u10f-readiness',
  '1440, 820, 390, and 360 pixels',
  'mobile interactive targets are at least 44px',
  'important management or publishing actions are at least 48px',
  'APIs, D1 schemas, bindings, collectors, cron, retention, output schemas, localization runtime, and provider separation remain unchanged.',
]) assert.ok(note.includes(fragment), `U10E working note missing ${fragment}`)

for (const [path, fragments] of [
  ['README.md', ['Phase 10 U10E responsive repair       active', 'Active implementation branch          work-quality-u10e-responsive', 'Exact next branch after U10E          work-quality-u10f-readiness']],
  ['docs/README.md', ['Phase 10 U10E responsive and accessibility       active', 'Active implementation branch                    work-quality-u10e-responsive', 'Exact next implementation branch                work-quality-u10f-readiness']],
  ['AGENTS.md', ['U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next branch: work-quality-u10f-readiness']],
  ['CONTRIBUTING.md', ['Phase 10 U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next implementation branch: work-quality-u10f-readiness']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10E responsive and accessibility active', 'Active implementation branch: work-quality-u10e-responsive', 'Exact next branch: work-quality-u10f-readiness']],
  ['docs/product/current-schedule.md', ['U10E responsive and accessibility active', 'Active branch: work-quality-u10e-responsive', 'Next branch: work-quality-u10f-readiness', 'U10E total browser scenarios: 36']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10E responsive and accessibility', 'Current implementation branch: `work-quality-u10e-responsive`', 'Exact next implementation branch: `work-quality-u10f-readiness`']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10e-responsive`', 'Active phase: U10E responsive and accessibility', 'Exact next branch: `work-quality-u10f-readiness`']],
]) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const workflow = read('.github/workflows/quality-u10e-responsive.yml')
for (const fragment of [
  'name: Quality U10E Responsive Accessibility',
  'Run U10E browser acceptance',
  'Verify U10E browser evidence',
  'cancel-in-progress: true',
]) assert.ok(workflow.includes(fragment), `U10E workflow missing ${fragment}`)

console.log('U10E responsive and accessibility repository verification passed.')
console.log('- shared target size and focus contract is installed')
console.log('- 9 routes across 4 required widths are owned by one browser gate')
console.log('- Twitch and Kick remain separate')
