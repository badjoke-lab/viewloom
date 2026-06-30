from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    source = read(path)
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:100]!r}")
    write(path, source.replace(old, new, 1))


# Day Flow: one authored and hydrated default owner. URL/storage still override it.
for path in ["apps/web/twitch/day-flow/index.html", "apps/web/kick/day-flow/index.html"]:
    source = read(path)
    old_controls = '<button class="active" data-dayflow-layout="split" aria-pressed="true">Split</button><button data-dayflow-layout="wide" aria-pressed="false">Wide</button>'
    new_controls = '<button data-dayflow-layout="split" aria-pressed="false">Split</button><button class="active" data-dayflow-layout="wide" aria-pressed="true">Wide</button>'
    if source.count(old_controls) != 1:
        raise RuntimeError(f"{path}: unexpected Day Flow layout controls")
    source = source.replace(old_controls, new_controls, 1)
    old_shell = '<div class="dayflow-layout-shell is-split" data-dayflow-layout-shell>'
    new_shell = '<div class="dayflow-layout-shell is-wide" data-dayflow-layout-shell data-dayflow-layout-current="wide">'
    if source.count(old_shell) != 1:
        raise RuntimeError(f"{path}: unexpected Day Flow shell")
    source = source.replace(old_shell, new_shell, 1)
    pattern = re.compile(r'\n<script>\n\(\(\) => \{.*?\n\}\)\(\)\n</script>(?=\n<script type="module" src="/src/mock-site\.ts"></script>)', re.S)
    source, count = pattern.subn('', source, count=1)
    if count != 1:
        raise RuntimeError(f"{path}: inline default-layout mutation was not removed")
    write(path, source)

replace_once(
    "apps/web/src/live/day-flow-layout-summary.ts",
    "  return 'split'\n}\n\nfunction applyLayout(updateUrl: boolean): void {",
    "  return 'wide'\n}\n\nfunction applyLayout(updateUrl: boolean): void {",
)
replace_once(
    "apps/web/src/live/day-flow-layout-summary.ts",
    "  shell.dataset.dayflowLayoutCurrent = effectiveLayout\n",
    "  shell.dataset.dayflowLayoutCurrent = effectiveLayout\n  shell.dataset.dayflowLayoutRequested = requestedLayout\n",
)

# Battle Lines: recommendedBattle is the explicit UI recommendation owner.
battle_path = "apps/web/src/live/battle-lines-current-shell-entry.ts"
replace_once(
    battle_path,
    "    if (!payload?.primaryBattle) return\n    state.selectedBattleId = payload.primaryBattle.id",
    "    const recommended = payload ? recommendedBattleFor(payload) : null\n    if (!recommended) return\n    state.selectedBattleId = recommended.id",
)
replace_once(
    battle_path,
    "    const previousBattle = options.preserveBattle ? state.selectedBattleId : null",
    "    const previousBattle = options.preserveBattle && state.manualBattle ? state.selectedBattleId : null",
)
replace_once(
    battle_path,
    "    payload = next\n    const battles = next.battles ?? []",
    "    payload = next\n    const battles = next.battles ?? []\n    const recommended = recommendedBattleFor(next)",
)
replace_once(
    battle_path,
    "      state.manualBattle = true\n    } else {\n      state.selectedBattleId = next.primaryBattle?.id ?? null",
    "      state.manualBattle = state.selectedBattleId !== recommended?.id\n    } else {\n      state.selectedBattleId = recommended?.id ?? null",
)
replace_once(
    battle_path,
    "  const recommended = battle.id === data.primaryBattle?.id && !state.manualBattle",
    "  const recommended = battle.id === recommendedBattleFor(data)?.id && !state.manualBattle",
)
replace_once(
    battle_path,
    "  const selected = pairSnapshot(data, battle, state.selectedIndex)\n  const recommended =",
    "  const selected = pairSnapshot(data, battle, state.selectedIndex)\n  target.dataset.battleRecommendationOwner = data.recommendedBattle ? 'recommendedBattle' : data.primaryBattle ? 'primaryBattle-fallback' : 'none'\n  target.dataset.battleSelectedBattleId = battle.id\n  target.dataset.battleSelectedIndex = String(state.selectedIndex)\n  const recommended =",
)
replace_once(
    battle_path,
    '<svg data-battle-chart viewBox="0 0 ${width} ${height}"',
    '<svg data-battle-chart data-battle-selected-index="${selectedIndex}" data-battle-selected-time="${escapeAttr(data.timeline[selectedIndex] ?? \'\')}" viewBox="0 0 ${width} ${height}"',
)
replace_once(
    battle_path,
    "  const snapshot = pairSnapshot(data, battle, index)\n  const ranked = data.lines",
    "  const snapshot = pairSnapshot(data, battle, index)\n  target.dataset.battleSelectedIndex = String(index)\n  target.dataset.battleSelectedTime = data.timeline[index] ?? ''\n  const ranked = data.lines",
)
replace_once(
    battle_path,
    "  const current = activeBattle(data)\n  const ordered = current && state.manualBattle\n    ? [current, ...data.battles.filter((battle) => battle.id !== current.id && battle.id !== data.primaryBattle?.id)]\n    : data.battles.filter((battle) => battle.id !== current?.id)",
    "  const current = activeBattle(data)\n  const recommended = recommendedBattleFor(data)\n  const ordered = current && state.manualBattle\n    ? [current, ...data.battles.filter((battle) => battle.id !== current.id && battle.id !== recommended?.id)]\n    : data.battles.filter((battle) => battle.id !== current?.id)",
)
replace_once(
    battle_path,
    "    state.manualBattle = state.selectedBattleId !== data.primaryBattle?.id",
    "    state.manualBattle = state.selectedBattleId !== recommendedBattleFor(data)?.id",
)
replace_once(
    battle_path,
    "function activeBattle(data: Payload): Battle | null {\n  return data.battles.find((battle) => battle.id === state.selectedBattleId) ?? data.primaryBattle ?? null\n}",
    "function recommendedBattleFor(data: Payload): Battle | null {\n  return data.recommendedBattle ?? data.primaryBattle ?? data.battles[0] ?? null\n}\n\nfunction activeBattle(data: Payload): Battle | null {\n  return data.battles.find((battle) => battle.id === state.selectedBattleId) ?? recommendedBattleFor(data)\n}",
)

# U10A is permanent historical evidence; it must not require defects to remain in current runtime.
write("scripts/verify-quality-u10a-baseline.mjs", """import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const required = [
  'docs/audits/cross-site-quality-u10a-baseline.json',
  'docs/audits/cross-site-quality-u10a-owner-map.json',
  'apps/web/scripts/quality-u10a-baseline-browser.mjs',
  'scripts/verify-quality-u10a-baseline.mjs',
  '.github/workflows/quality-u10a-baseline.yml',
]
for (const path of required) assert.equal(existsSync(join(root, path)), true, `missing file: ${path}`)
assert.equal(existsSync(join(root, 'docs/work-in-progress/u10a-quality-baseline.md')), false, 'completed U10A working note still exists')

const baseline = JSON.parse(readFileSync(join(root, 'docs/audits/cross-site-quality-u10a-baseline.json'), 'utf8'))
assert.equal(baseline.schema, 'viewloom-cross-site-quality-u10a-baseline-v1')
assert.equal(baseline.phase, 'U10A')
assert.equal(baseline.status, 'complete')
assert.equal(baseline.implementation_pr, 454)
assert.equal(baseline.implementation_head, '51c8883ebdc31334828cc345f6a938f17c20a29b')
assert.equal(baseline.merge_commit, '7665c5244d2fa71539ce9d69b3f5b55c47463075')
assert.equal(baseline.boundary.provider_separation_required, true)
assert.deepEqual(baseline.counts, {
  reproduced: 6,
  resolved_before_u10a: 1,
  protected_by_existing_logic: 1,
  browser_measurement_required: 0,
  total: 8,
})
assert.equal(baseline.findings.length, 8)
assert.equal(baseline.browser_evidence.run_id, 28356915812)
assert.equal(baseline.browser_evidence.artifact_id, 7945707844)
assert.equal(baseline.browser_evidence.result, 'pass')
assert.equal(baseline.companion_public_browser_audit.run_id, 28356915810)
assert.equal(baseline.companion_public_browser_audit.artifact_id, 7945757041)
assert.equal(baseline.companion_public_browser_audit.p0, 0)

const ownerMap = JSON.parse(readFileSync(join(root, 'docs/audits/cross-site-quality-u10a-owner-map.json'), 'utf8'))
assert.equal(ownerMap.schema, 'viewloom-cross-site-quality-u10a-owner-map-v1')
assert.equal(ownerMap.phase, 'U10A')
assert.equal(ownerMap.status, 'complete')
assert.equal(ownerMap.implementation_pr, 454)
assert.equal(ownerMap.exact_next_branch, 'work-quality-u10b-shell')
assert.equal(ownerMap.next_branch_created, false)
assert.ok(ownerMap.owners.length >= 8)

console.log('ViewLoom completed U10A permanent evidence verification passed.')
console.log('- historical findings and artifacts remain exact')
console.log('- current runtime behavior is owned by later remediation phases')
""")

write(".github/workflows/quality-u10a-baseline.yml", """name: Quality U10A Baseline

on:
  workflow_dispatch:
  pull_request:
    paths:
      - 'docs/audits/cross-site-quality-u10a-baseline.json'
      - 'docs/audits/cross-site-quality-u10a-owner-map.json'
      - 'scripts/verify-quality-u10a-baseline.mjs'
      - 'scripts/verify-development-policy.mjs'
      - '.github/workflows/quality-u10a-baseline.yml'

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  baseline:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Verify development policy
        run: node scripts/verify-development-policy.mjs
      - name: Verify permanent U10A evidence
        run: node scripts/verify-quality-u10a-baseline.mjs
""")

# U10C remains a permanent visualization contract and no longer owns current branch wording.
replace_once(
    "scripts/verify-quality-u10c-visualization.mjs",
    "need('docs/product/current-roadmap.md', ['U10C visualization complete PR #458', 'Active implementation branch: none', 'work-quality-u10d-analysis-coherence'])\nneed('docs/product/current-schedule.md', ['U10C complete PR #458', 'Active branch: none', 'U10C total browser checks: 64'])\nneed('docs/product/post-watchlist-program-plan.md', ['Completed U10C implementation: PR #458', 'Current implementation branch: none'])\nneed('docs/product/cross-site-quality-remediation-plan.md', ['Completed phase: U10C through PR #458', 'Current branch: none'])",
    "need('docs/product/current-roadmap.md', ['Phase 10 U10C visualization complete PR #458'])\nneed('docs/product/current-schedule.md', ['U10C complete PR #458', 'U10C total browser checks: 64'])\nneed('docs/product/post-watchlist-program-plan.md', ['Completed U10C implementation: PR #458'])\nneed('docs/product/cross-site-quality-remediation-plan.md', ['Completed phase: U10C through PR #458'])",
)

print('U10D runtime patch applied.')
