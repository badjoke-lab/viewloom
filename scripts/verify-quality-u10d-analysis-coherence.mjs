import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/audits/cross-site-quality-u10d-analysis-coherence.json',
  'apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html',
  'apps/web/src/live/day-flow-layout-summary.ts',
  'apps/web/src/live/battle-lines-current-shell-entry.ts',
  'apps/web/functions/_lib/battle-lines-core.ts',
  'apps/web/scripts/quality-u10d-analysis-coherence-browser.mjs',
  'scripts/verify-quality-u10d-analysis-coherence.mjs',
  'scripts/verify-quality-u10d-browser-evidence.mjs',
  '.github/workflows/quality-u10d-analysis-coherence.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
for (const path of [
  'docs/work-in-progress/u10d-analysis-coherence.md',
  'scripts/u10d_patch_runtime.py',
  'scripts/u10d_patch_tests.py',
  'scripts/u10d_patch_docs.py',
  '.github/workflows/u10d-bootstrap.yml',
]) assert.equal(existsSync(join(root, path)), false, `temporary U10D file remains: ${path}`)

for (const path of ['apps/web/twitch/day-flow/index.html', 'apps/web/kick/day-flow/index.html']) {
  const html = read(path)
  assert.ok(html.includes('class="dayflow-layout-shell is-wide" data-dayflow-layout-shell data-dayflow-layout-current="wide"'))
  assert.ok(html.includes('<button data-dayflow-layout="split" aria-pressed="false">Split</button><button class="active" data-dayflow-layout="wide" aria-pressed="true">Wide</button>'))
  assert.equal(html.includes("window.localStorage.setItem(key, 'wide')"), false)
  assert.equal(html.includes("const key = 'viewloom:"), false)
}
const dayFlow = read('apps/web/src/live/day-flow-layout-summary.ts')
assert.ok(dayFlow.includes("return 'wide'\n}\n\nfunction applyLayout"))
assert.ok(dayFlow.includes('shell.dataset.dayflowLayoutRequested = requestedLayout'))
assert.ok(dayFlow.includes('applyLayout(false)'))
const dayFlowShell = read('apps/web/src/live/day-flow-current-shell-entry.ts')
assert.ok(dayFlowShell.includes("const layout = current.get('layout')"))
assert.ok(dayFlowShell.includes("if (layout === 'split' || layout === 'wide') params.set('layout', layout)"))
assert.ok(dayFlowShell.includes("else if (layout === 'theater') params.set('layout', 'wide')"))

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
]) assert.ok(battle.includes(fragment), `Battle Lines missing ${fragment}`)
for (const forbidden of [
  'state.selectedBattleId = payload.primaryBattle.id',
  'state.selectedBattleId = next.primaryBattle?.id ?? null',
  'battle.id === data.primaryBattle?.id && !state.manualBattle',
  'state.manualBattle = state.selectedBattleId !== data.primaryBattle?.id',
]) assert.equal(battle.includes(forbidden), false, `stale recommendation owner remains: ${forbidden}`)
assert.equal(battle.includes('window.fetch ='), false)
assert.equal(battle.includes('new MutationObserver'), false)
assert.ok(battle.includes('function renderAll(): void {\n  if (!payload) return\n  syncControls()'))

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
assert.equal(record.boundary.api_change_authorized, false)
assert.equal(record.boundary.storage_change_authorized, false)
assert.equal(record.boundary.binding_change_authorized, false)
assert.equal(record.boundary.collector_change_authorized, false)
assert.equal(record.boundary.cron_change_authorized, false)
assert.equal(record.boundary.retention_change_authorized, false)
assert.equal(record.boundary.output_schema_change_authorized, false)
assert.equal(record.boundary.localization_runtime_change_authorized, false)
assert.equal(record.boundary.provider_combination_authorized, false)
assert.equal(record.exact_next_branch, 'work-quality-u10e-responsive')
assert.equal(record.next_branch_created, false)

const workflow = read('.github/workflows/quality-u10d-analysis-coherence.yml')
for (const fragment of ['name: Quality U10D Analysis Coherence', 'Run U10D browser acceptance', 'Verify U10D browser evidence', 'cancel-in-progress: true']) assert.ok(workflow.includes(fragment))

console.log('Completed U10D analysis coherence verification passed.')
console.log('- Day Flow default-layout ownership is permanent')
console.log('- Battle Lines recommendation and selected-time ownership are permanent')
console.log('- permanent U10D boundaries remain exact')
