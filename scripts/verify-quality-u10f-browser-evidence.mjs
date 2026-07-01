import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const artifactDir = resolve(process.env.QUALITY_U10F_ARTIFACT_DIR ?? 'artifacts/quality-u10f')
const evidence = JSON.parse(readFileSync(resolve(artifactDir, 'quality-u10f-readiness-evidence.json'), 'utf8'))
const expectedHead = process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null

assert.equal(evidence.schema, 'viewloom-quality-u10f-readiness-browser-v1')
assert.equal(evidence.phase, 'U10F')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.checkpoint, 'complete')
if (expectedHead) assert.equal(evidence.candidateHead, expectedHead)
assert.equal(evidence.scenarios.length, 8)

const expectedWidths = [1440, 820, 390, 360]
for (const provider of ['twitch', 'kick']) {
  const scenarios = evidence.scenarios.filter((scenario) => scenario.provider === provider)
  assert.deepEqual(scenarios.map((scenario) => scenario.width).sort((a, b) => b - a), expectedWidths)
  for (const scenario of scenarios) {
    const state = scenario.state
    assert.equal(scenario.calls.twitchHistory, 0, `${scenario.id}: Twitch History request occurred`)
    assert.equal(scenario.calls.kickHistory, 0, `${scenario.id}: Kick History request occurred`)
    assert.equal(state.entryMode, 'missing-id', `${scenario.id}: entry mode changed`)
    assert.equal(state.h1, 'Channel not selected', `${scenario.id}: heading changed`)
    assert.equal(state.missingVisible, true, `${scenario.id}: missing task hidden`)
    assert.equal(state.missingActionCount, 1, `${scenario.id}: action count changed`)
    assert.equal(state.actionHref, `/${provider}/history/`, `${scenario.id}: provider-safe href changed`)
    assert.ok(state.actionHeight >= 48, `${scenario.id}: action height ${state.actionHeight}`)
    assert.equal(state.actionFocused, true, `${scenario.id}: action focus missing`)
    assert.notEqual(state.actionOutlineStyle, 'none', `${scenario.id}: focus outline missing`)
    assert.notEqual(state.actionOutlineWidth, '0px', `${scenario.id}: focus outline width zero`)
    assert.equal(state.visibleRequiresId, 0, `${scenario.id}: irrelevant region visible`)
    assert.equal(state.focusableRequiresId, 0, `${scenario.id}: irrelevant control focusable`)
    assert.equal(state.inertRequiresId, state.requiresIdCount, `${scenario.id}: inert ownership mismatch`)
    assert.ok(state.horizontalOverflow <= 2, `${scenario.id}: horizontal overflow ${state.horizontalOverflow}`)
  }
}

console.log('U10F browser evidence verification passed.')
console.log('- 8 missing-id provider and viewport scenarios')
console.log('- zero History requests and one provider-safe action')
console.log('- irrelevant controls hidden and inert')
