import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10g-architecture.md',
  'apps/web/src/live/day-flow-current-shell-entry.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/src/live/battle-lines-layout.ts',
  'apps/web/src/navigation/battle-lines-deep-link-bridge.ts',
  'apps/web/scripts/quality-u10g-architecture-browser.mjs',
  'scripts/verify-quality-u10g-architecture.mjs',
  'scripts/verify-quality-u10g-browser-evidence.mjs',
  '.github/workflows/quality-u10g-architecture.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
for (const path of [
  'apps/web/src/live/battle-lines-loading-guard.ts',
  '.github/workflows/u10g-bootstrap.yml',
  '.github/workflows/u10g-test-patch.yml',
  '.github/workflows/u10g-mobile-layout-fix.yml',
  'scripts/u10g_patch_architecture.mjs',
]) assert.equal(existsSync(join(root, path)), false, `temporary or retired architecture file remains: ${path}`)

const note = read('docs/work-in-progress/u10g-architecture.md')
for (const fragment of [
  'Status: active',
  'work-quality-u10g-architecture',
  'work-quality-u10h-acceptance',
  'Day Flow has one request/state/controller owner per provider route.',
  'Battle Lines has one request/state/controller owner per provider route.',
  'No feature coordination code replaces `window.fetch`, `history.replaceState`, or `URLSearchParams.prototype.get`.',
]) assert.ok(note.includes(fragment), `U10G note missing ${fragment}`)

const dayHtmlPaths = ['apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html']
for (const path of dayHtmlPaths) {
  const html = read(path)
  assert.equal((html.match(/day-flow-current-shell-entry\.ts/g) ?? []).length, 1, `${path}: primary Day Flow entry count changed`)
  assert.equal(html.includes('day-flow-layout-summary.ts'), false, `${path}: secondary Day Flow entry remains`)
}
const battleHtmlPaths = ['apps/web/twitch/battle-lines/index.html', 'apps/web/kick/battle-lines/index.html']
for (const path of battleHtmlPaths) {
  const html = read(path)
  assert.equal((html.match(/battle-lines-current-shell-entry\.ts/g) ?? []).length, 1, `${path}: primary Battle Lines entry count changed`)
  for (const retired of ['battle-lines-layout.ts', 'battle-lines-loading-guard.ts', 'battle-lines-deep-link-bridge.ts']) {
    assert.equal(html.includes(retired), false, `${path}: retired entry remains: ${retired}`)
  }
}

const dayMain = read('apps/web/src/live/day-flow-current-shell-entry.ts')
const dayHelper = read('apps/web/src/live/day-flow-layout-summary.ts')
for (const fragment of [
  "from './day-flow-layout-summary'",
  'layout: DayFlowLayoutMode',
  'renderEnhancedDayFlowSummary(target, payload)',
  'applyDayFlowLayout(state.layout)',
  "if (state.layoutInUrl) params.set('layout', state.layout)",
]) assert.ok(dayMain.includes(fragment), `Day Flow primary owner missing ${fragment}`)
assert.equal((dayMain.match(/fetch\(`/g) ?? []).length, 1, 'Day Flow must have one feature request call owner')
for (const forbidden of ['new MutationObserver', 'window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =']) {
  assert.equal(dayMain.includes(forbidden), false, `Day Flow primary owner contains ${forbidden}`)
  assert.equal(dayHelper.includes(forbidden), false, `Day Flow helper contains ${forbidden}`)
}
for (const forbidden of ['fetch(', 'setInterval(', 'addEventListener(']) assert.equal(dayHelper.includes(forbidden), false, `Day Flow helper owns runtime state: ${forbidden}`)

const battleMain = read('apps/web/src/live/battle-lines-current-shell-entry.ts')
const battleLayout = read('apps/web/src/live/battle-lines-layout.ts')
const battleLink = read('apps/web/src/navigation/battle-lines-deep-link-bridge.ts')
for (const fragment of [
  "from './battle-lines-layout'",
  "from '../navigation/battle-lines-deep-link-bridge'",
  'const BATTLE_LINES_TIMEOUT_MS = 12_000',
  'async function fetchBattleLinesResponse',
  'new AbortController()',
  'readBattleLinesSelection(params)',
  'canonicalBattleLinesTime(',
  "next.set('time', time)",
  'renderBattleLinesSplitRail()',
  "input.hidden = state.range !== 'date'",
]) assert.ok(battleMain.includes(fragment), `Battle Lines primary owner missing ${fragment}`)
for (const fragment of [
  'function splitViewportAvailable()',
  "document.body.dataset.battleLayoutRequested === 'split'",
  "requestedLayout === 'split' && splitAvailable ? 'split' : 'wide'",
  'shell.dataset.battleLayoutCurrent = effectiveLayout',
  'shell.dataset.battleLayoutRequested = requestedLayout',
]) assert.ok(battleLayout.includes(fragment), `Battle Lines responsive layout owner missing ${fragment}`)
for (const source of [battleMain, battleLayout, battleLink]) {
  for (const forbidden of ['window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =', 'new MutationObserver']) {
    assert.equal(source.includes(forbidden), false, `Battle Lines architecture contains ${forbidden}`)
  }
}
assert.equal(battleMain.includes("next.set('point'"), false, 'Battle Lines emits legacy point state')
assert.ok(battleLink.includes("params.get('point')"), 'legacy point reader was removed')
assert.ok(battleLink.includes('export function canonicalBattleLinesTime'), 'canonical selected-time helper missing')

const browser = read('apps/web/scripts/quality-u10g-architecture-browser.mjs')
for (const fragment of [
  "schema: 'viewloom-quality-u10g-architecture-browser-v1'",
  "for (const provider of ['twitch', 'kick'])",
  "await auditDayFlow(provider, 1440, 'desktop-layout')",
  "await auditDayFlow(provider, 390, 'mobile-fallback')",
  "await auditBattle(provider, 1440, 'direct-time')",
  "await auditBattle(provider, 390, 'legacy-point')",
  'assert.equal(evidence.scenarios.length, 8)',
  'fetchSame: globalThis.fetch === native.fetch',
  'replaceStateSame: history.replaceState === native.replaceState',
  'urlGetSame: URLSearchParams.prototype.get === native.urlGet',
]) assert.ok(browser.includes(fragment), `U10G browser contract missing ${fragment}`)

for (const [path, fragments] of [
  ['README.md', ['Phase 10 U10G architecture            active', 'Active implementation branch          work-quality-u10g-architecture', 'Exact next branch after U10G          work-quality-u10h-acceptance']],
  ['docs/README.md', ['Phase 10 U10G architecture                       active', 'Active implementation branch                    work-quality-u10g-architecture', 'Exact next implementation branch                work-quality-u10h-acceptance']],
  ['AGENTS.md', ['U10G architecture active', 'Active implementation branch: work-quality-u10g-architecture', 'Exact next branch: work-quality-u10h-acceptance']],
  ['CONTRIBUTING.md', ['Phase 10 U10G architecture active', 'Active implementation branch: work-quality-u10g-architecture', 'Exact next implementation branch: work-quality-u10h-acceptance']],
  ['docs/product/current-roadmap.md', ['Phase 10 U10G architecture active', 'Active implementation branch: work-quality-u10g-architecture', 'Exact next branch: work-quality-u10h-acceptance']],
  ['docs/product/current-schedule.md', ['U10G architecture active', 'Active branch: work-quality-u10g-architecture', 'Next branch: work-quality-u10h-acceptance', 'U10G browser scenarios: 8']],
  ['docs/product/post-watchlist-program-plan.md', ['Current phase: Phase 10 — U10G architecture', 'Current implementation branch: `work-quality-u10g-architecture`', 'Exact next implementation branch: `work-quality-u10h-acceptance`']],
  ['docs/product/cross-site-quality-remediation-plan.md', ['Current branch: `work-quality-u10g-architecture`', 'Active phase: U10G architecture consolidation', 'Exact next branch: `work-quality-u10h-acceptance`']],
]) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const workflow = read('.github/workflows/quality-u10g-architecture.yml')
for (const fragment of [
  'name: Quality U10G Architecture',
  'Verify U10G repository contract',
  'Run U10G browser acceptance',
  'Verify U10G browser evidence',
  'cancel-in-progress: true',
]) assert.ok(workflow.includes(fragment), `U10G workflow missing ${fragment}`)

console.log('U10G architecture repository verification passed.')
console.log('- one Day Flow and Battle Lines feature controller entry per provider route')
console.log('- no global fetch/history/prototype interception or MutationObserver coordination')
console.log('- responsive fallback preserves requested layout while effective layout remains viewport-safe')
console.log('- canonical time compatibility and provider separation retained')
