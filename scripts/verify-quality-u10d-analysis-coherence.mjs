import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const required = [
  'docs/work-in-progress/u10d-analysis-coherence.md',
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
for (const path of ['scripts/u10d_patch_runtime.py', 'scripts/u10d_patch_tests.py', 'scripts/u10d_patch_docs.py', '.github/workflows/u10d-bootstrap.yml']) {
  assert.equal(existsSync(join(root, path)), false, `temporary U10D bootstrap remains: ${path}`)
}

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

const note = read('docs/work-in-progress/u10d-analysis-coherence.md')
for (const fragment of ['Status: active', 'work-quality-u10d-analysis-coherence', 'work-quality-u10e-responsive', 'APIs, persistence, collection, retention, output contracts, and provider separation remain unchanged.']) assert.ok(note.includes(fragment))
for (const [path, fragment] of [
  ['README.md', 'Phase 10 U10D analysis coherence'],
  ['docs/README.md', 'Phase 10 U10D analysis coherence'],
  ['AGENTS.md', 'Active implementation branch: work-quality-u10d-analysis-coherence'],
  ['CONTRIBUTING.md', 'Active implementation branch: work-quality-u10d-analysis-coherence'],
  ['docs/product/current-roadmap.md', 'Phase 10 U10D analysis coherence active'],
  ['docs/product/current-schedule.md', 'U10D analysis coherence active'],
  ['docs/product/post-watchlist-program-plan.md', 'Current phase: Phase 10 — U10D analysis coherence'],
  ['docs/product/cross-site-quality-remediation-plan.md', 'Current branch: `work-quality-u10d-analysis-coherence`'],
]) assert.ok(read(path).includes(fragment), `${path}: active U10D state missing`)

const workflow = read('.github/workflows/quality-u10d-analysis-coherence.yml')
for (const fragment of ['name: Quality U10D Analysis Coherence', 'Run U10D browser acceptance', 'Verify U10D browser evidence', 'cancel-in-progress: true']) assert.ok(workflow.includes(fragment))

console.log('U10D analysis coherence repository verification passed.')
console.log('- Day Flow has one authored default layout owner')
console.log('- Battle Lines uses recommendedBattle as the UI recommendation owner')
console.log('- selected-time ownership and provider separation are protected')
