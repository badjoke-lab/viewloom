import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/audits/cross-site-quality-u10e-responsive.json',
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
assert.equal(existsSync(join(root, 'docs/work-in-progress/u10e-responsive.md')), false, 'temporary U10E working note remains')

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

const record = JSON.parse(read('docs/audits/cross-site-quality-u10e-responsive.json'))
assert.equal(record.schema, 'viewloom-cross-site-quality-u10e-responsive-v1')
assert.equal(record.phase, 'U10E')
assert.equal(record.status, 'complete')
assert.equal(record.implementation_pr, 465)
assert.equal(record.implementation_head, '916c544eef39a186ebde40037047197b1f33e378')
assert.equal(record.merge_commit, 'cae92973d6185f9e0f81151ab94260229dc65287')
assert.equal(record.canonical_closeout_pr, 466)
assert.deepEqual(record.scope.providers, ['twitch', 'kick'])
assert.equal(record.scope.routes, 9)
assert.deepEqual(record.scope.viewports, [1440, 820, 390, 360])
assert.equal(record.scope.total_browser_scenarios, 36)
assert.equal(record.responsive_contract.mobile_target_floor_px, 44)
assert.equal(record.responsive_contract.important_action_floor_px, 48)
assert.equal(record.responsive_contract.page_horizontal_overflow_px, 0)
assert.equal(record.responsive_contract.visible_focus_required, true)
assert.equal(record.responsive_contract.accessible_names_required, true)
assert.equal(record.responsive_contract.reduced_motion_covered, true)
assert.equal(record.responsive_contract.forced_colors_covered, true)
assert.equal(record.responsive_contract.day_flow_utc_date_label_preserved, true)
assert.equal(record.browser_evidence.run_id, 28472230004)
assert.equal(record.browser_evidence.artifact_id, 7992181629)
assert.equal(record.browser_evidence.artifact_digest, 'sha256:1af5844d41968763fcade5f56179e46b6b67c7e6c3a96139e3bccff7450b27a5')
assert.equal(record.browser_evidence.result, 'pass')
assert.equal(record.browser_evidence.scenarios, 36)
for (const key of ['horizontal_overflow_failures', 'unnamed_control_failures', 'mobile_target_failures', 'important_action_failures', 'focus_failures', 'date_label_failures']) {
  assert.equal(record.browser_evidence[key], 0, `U10E browser failure count changed: ${key}`)
}
assert.equal(record.boundary.provider_separation_required, true)
for (const key of ['api_change_authorized', 'storage_change_authorized', 'binding_change_authorized', 'collector_change_authorized', 'cron_change_authorized', 'retention_change_authorized', 'output_schema_change_authorized', 'localization_runtime_change_authorized', 'provider_combination_authorized']) {
  assert.equal(record.boundary[key], false, `U10E boundary changed: ${key}`)
}
assert.equal(record.exact_next_branch, 'work-quality-u10f-readiness')
assert.equal(record.next_branch_created, false)

for (const [path, fragments] of [
  ['README.md', ['Phase 10 U10E responsive repair       complete PR #465', 'U10E canonical closeout               complete PR #466', 'Active implementation branch          none', 'Exact next implementation branch      work-quality-u10f-readiness']],
  ['docs/README.md', ['Phase 10 U10E responsive and accessibility       complete PR #465', 'U10E canonical closeout                          complete PR #466', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10f-readiness']],
  ['AGENTS.md', ['U10E implementation complete PR #465', 'U10E closeout complete PR #466', 'Active implementation branch: none', 'Exact next branch: work-quality-u10f-readiness']],
  ['CONTRIBUTING.md', ['Phase 10 U10E responsive and accessibility complete through PR #465', 'U10E canonical closeout complete through PR #466', 'Active implementation branch: none', 'Exact next implementation branch: work-quality-u10f-readiness']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10E responsive and accessibility complete PR #465', 'U10E canonical closeout complete PR #466', 'Active implementation branch: none', 'Exact next branch: work-quality-u10f-readiness']],
  ['docs/product/current-schedule.md', ['U10E responsive and accessibility complete PR #465', 'U10E closeout complete PR #466', 'Active branch: none', 'Next branch: work-quality-u10f-readiness']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10F readiness exact next', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-u10f-readiness`', 'Completed U10E canonical closeout: PR #466']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: none', 'Completed phase: U10E through PR #465', 'Completed canonical closeout: U10E through PR #466', 'Exact next branch: `work-quality-u10f-readiness`']],
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

console.log('Completed U10E responsive and accessibility verification passed.')
console.log('- 36 route and viewport scenarios remain permanent evidence')
console.log('- 44px and 48px target floors remain exact')
console.log('- Twitch and Kick remain separate')
