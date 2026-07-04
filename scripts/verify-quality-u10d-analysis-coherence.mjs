import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
  'apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html',
  'apps/web/src/live/day-flow-current-shell-entry.ts',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/src/live/battle-lines-layout.ts',
  'apps/web/src/navigation/battle-lines-deep-link-bridge.ts',
  'apps/web/functions/_lib/battle-lines-core.ts',
  'apps/web/scripts/quality-u10d-analysis-coherence-browser.mjs',
  'scripts/verify-quality-u10d-analysis-coherence.mjs',
  'scripts/verify-quality-u10d-browser-evidence.mjs',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
for (const path of [
  'docs/work-in-progress/u10d-analysis-coherence.md',
  'apps/web/src/live/battle-lines-loading-guard.ts',
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  '.github/workflows/u10d-bootstrap.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary or retired U10D file remains: ${path}`)

for (const path of ['apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html']) {
  const html = read(path)
  assert.ok(html.includes('class="dayflow-layout-shell is-wide" data-dayflow-layout-shell data-dayflow-layout-current="wide"'))
  assert.ok(html.includes('<button data-dayflow-layout="split" aria-pressed="false">Split</button><button class="active" data-dayflow-layout="wide" aria-pressed="true">Wide</button>'))
  assert.ok(html.includes('/src/live/day-flow-current-shell-entry.ts'))
  assert.equal(html.includes('/src/live/day-flow-layout-summary.ts'), false, `${path}: duplicate Day Flow entry remains`)
}
const dayFlow = read('apps/web/src/live/day-flow-layout-summary.ts')
for (const fragment of [
  'export function normalizeDayFlowLayout',
  'export function applyDayFlowLayout',
  'export function renderEnhancedDayFlowSummary',
  "return 'wide'",
]) assert.ok(dayFlow.includes(fragment), `Day Flow helper missing ${fragment}`)
for (const forbidden of ['fetch(', 'new MutationObserver', 'setInterval(', 'addEventListener(']) {
  assert.equal(dayFlow.includes(forbidden), false, `Day Flow helper owns runtime state: ${forbidden}`)
}
const dayFlowShell = read('apps/web/src/live/day-flow-current-shell-entry.ts')
for (const fragment of [
  "from './day-flow-layout-summary'",
  'layout: DayFlowLayoutMode',
  'layoutInUrl: boolean',
  'applyDayFlowLayout(state.layout)',
  'renderEnhancedDayFlowSummary(target, payload)',
  "if (state.layoutInUrl) params.set('layout', state.layout)",
]) assert.ok(dayFlowShell.includes(fragment), `Day Flow primary owner missing ${fragment}`)
assert.equal((dayFlowShell.match(/fetch\(`/g) ?? []).length, 1, 'Day Flow primary owner should contain one feature request call')
assert.equal(dayFlowShell.includes('new MutationObserver'), false)

const battle = read('apps/web/src/live/battle-lines-current-shell-entry.ts')
for (const fragment of [
  'function recommendedBattleFor(data: Payload): Battle | null',
  'data.recommendedBattle ?? data.primaryBattle ?? data.battles[0] ?? null',
  'const recommended = payload ? recommendedBattleFor(payload) : null',
  'state.selectedBattleId = recommended?.id ?? null',
  "battle.id === recommendedBattleFor(data)?.id && !state.manualBattle",
  "target.dataset.battleRecommendationOwner = data.recommendedBattle ? 'recommendedBattle'",
  'data-battle-selected-index="${selectedIndex}"',
  'target.dataset.battleSelectedTime = data.timeline[index] ??',
  'state.manualBattle = state.selectedBattleId !== recommendedBattleFor(data)?.id',
  "from './battle-lines-layout'",
  "from '../navigation/battle-lines-deep-link-bridge'",
  'fetchBattleLinesResponse(',
  'canonicalBattleLinesTime(',
  'renderBattleLinesSplitRail()',
]) assert.ok(battle.includes(fragment), `Battle Lines missing ${fragment}`)
for (const forbidden of [
  'state.selectedBattleId = payload.primaryBattle.id',
  'state.selectedBattleId = next.primaryBattle?.id ?? null',
  'battle.id === data.primaryBattle?.id && !state.manualBattle',
  'state.manualBattle = state.selectedBattleId !== data.primaryBattle?.id',
  'window.fetch =',
  'window.history.replaceState =',
  'URLSearchParams.prototype.get =',
  'new MutationObserver',
  "next.set('point'",
]) assert.equal(battle.includes(forbidden), false, `stale or intercepted Battle Lines owner remains: ${forbidden}`)
assert.ok(battle.includes('function renderAll(): void {\n  if (!payload) return\n  syncControls()'))

const battleLayout = read('apps/web/src/live/battle-lines-layout.ts')
const battleLink = read('apps/web/src/navigation/battle-lines-deep-link-bridge.ts')
for (const source of [battleLayout, battleLink]) {
  for (const forbidden of ['window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =', 'new MutationObserver']) {
    assert.equal(source.includes(forbidden), false, `Battle helper contains forbidden architecture: ${forbidden}`)
  }
}

const core = read('apps/web/functions/_lib/battle-lines-core.ts')
assert.ok(core.includes('recommendedBattle: primaryBattle'))
assert.ok(core.includes('primaryBattle,'))

const record = JSON.parse(read('docs/audits/cross-site-quality-u10d-analysis-coherence.json'))
assert.equal(record.schema, 'viewloom-cross-site-quality-u10d-analysis-coherence-v1')
assert.equal(record.phase, 'U10D')
assert.equal(record.status, 'complete')
assert.equal(record.implementation_pr, 462)
assert.equal(record.implementation_head, '882ba418180c054d76e31e54ad8090559d96a23f')
assert.equal(record.merge_commit, '203287bb9e1a28d6ad08f5fcb10ec1b261d84db5')
assert.equal(record.canonical_closeout_pr, 464)
assert.deepEqual(record.scope.providers, ['twitch', 'kick'])
assert.equal(record.scope.routes, 4)
assert.deepEqual(record.scope.viewports, [1440, 820, 390, 360])
assert.equal(record.scope.day_flow_scenarios, 12)
assert.equal(record.scope.battle_lines_scenarios, 8)
assert.equal(record.scope.total_browser_scenarios, 20)
assert.equal(record.ownership.day_flow_default_layout, 'wide')
assert.equal(record.ownership.battle_lines_recommendation, 'recommendedBattle')
assert.equal(record.ownership.battle_lines_compatibility_fallback, 'primaryBattle')
assert.equal(record.verification.result, 'pass')
assert.equal(record.boundary.provider_separation_required, true)
for (const key of ['api_change_authorized', 'storage_change_authorized', 'binding_change_authorized', 'collector_change_authorized', 'cron_change_authorized', 'retention_change_authorized', 'output_schema_change_authorized', 'localization_runtime_change_authorized', 'provider_combination_authorized']) assert.equal(record.boundary[key], false)
assert.equal(record.exact_next_branch, 'work-quality-u10e-responsive')
assert.equal(record.next_branch_created, false)

const workflow = read('.github/workflows/quality-u10d-analysis-coherence.yml')
for (const fragment of ['name: Quality U10D Analysis Coherence', 'Run U10D browser acceptance', 'Verify U10D browser evidence', 'cancel-in-progress: true']) assert.ok(workflow.includes(fragment))

console.log('Completed U10D analysis coherence verification passed.')
console.log('- Day Flow layout and summary remain owned by the primary controller')
console.log('- Battle Lines recommendation and selected-time ownership remain permanent')
console.log('- U10G consolidation removes interception without weakening U10D evidence')
