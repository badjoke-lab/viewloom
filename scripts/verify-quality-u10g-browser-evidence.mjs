import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const artifactDir = resolve(process.env.QUALITY_U10G_ARTIFACT_DIR ?? 'artifacts/quality-u10g')
const evidence = JSON.parse(readFileSync(resolve(artifactDir, 'quality-u10g-architecture-evidence.json'), 'utf8'))
const expectedHead = process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null

assert.equal(evidence.schema, 'viewloom-quality-u10g-architecture-browser-v2')
assert.equal(evidence.phase, 'U10G')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.checkpoint, 'complete')
if (expectedHead) assert.equal(evidence.candidateHead, expectedHead)
assert.equal(evidence.scenarios.length, 8)

for (const provider of ['twitch', 'kick']) {
  const scenarios = evidence.scenarios.filter((scenario) => scenario.provider === provider)
  assert.equal(scenarios.length, 4, `${provider}: expected four scenarios`)
  assert.deepEqual(scenarios.map((scenario) => scenario.feature).sort(), ['battle-lines', 'battle-lines', 'day-flow', 'day-flow'])
  for (const scenario of scenarios) {
    assert.equal(scenario.requests, 1, `${scenario.id}: request count changed`)
    assert.equal(scenario.crossRequests, 0, `${scenario.id}: provider crossing detected`)
    assert.equal(scenario.initial.urlGetSame, true, `${scenario.id}: URLSearchParams.get identity changed`)
    assert.ok(scenario.initial.horizontalOverflow <= 2, `${scenario.id}: horizontal overflow ${scenario.initial.horizontalOverflow}`)

    if (scenario.feature === 'day-flow') {
      assert.ok(scenario.initial.summaryCards >= 5, `${scenario.id}: summary missing`)
      if (provider === 'twitch') {
        assert.equal(scenario.categoryRequests, 1, `${scenario.id}: Twitch category request missing`)
        assert.equal(scenario.initial.fetchSame, false, `${scenario.id}: authorized Twitch fetch wrapper missing`)
        assert.equal(scenario.initial.replaceStateSame, false, `${scenario.id}: authorized Twitch history wrapper missing`)
        assert.equal(scenario.initial.categoryControlPresent, true, `${scenario.id}: public Twitch Category control missing`)
        assert.equal(scenario.initial.categoryControlPublic, true, `${scenario.id}: Twitch Category control not marked public`)
        assert.equal(scenario.initial.categoryParam, 'all', `${scenario.id}: Twitch category URL state changed`)
      } else {
        assert.equal(scenario.categoryRequests, 0, `${scenario.id}: Kick issued category request`)
        assert.equal(scenario.initial.fetchSame, true, `${scenario.id}: Kick fetch identity changed`)
        assert.equal(scenario.initial.replaceStateSame, true, `${scenario.id}: Kick replaceState identity changed`)
        assert.equal(scenario.initial.categoryControlPresent, false, `${scenario.id}: Kick exposed Category control`)
        assert.equal(scenario.initial.categoryControlPublic, false, `${scenario.id}: Kick exposed public Category marker`)
        assert.equal(scenario.initial.categoryParam, null, `${scenario.id}: Kick emitted category URL state`)
      }
    }

    if (scenario.feature === 'battle-lines') {
      assert.equal(scenario.initial.fetchSame, true, `${scenario.id}: Battle Lines fetch identity changed`)
      assert.equal(scenario.initial.replaceStateSame, true, `${scenario.id}: Battle Lines replaceState identity changed`)
      assert.equal(scenario.initial.categoryControlPresent, false, `${scenario.id}: Battle Lines exposed Day Flow Category control`)
      assert.equal(scenario.initial.categoryParam, null, `${scenario.id}: Battle Lines emitted Day Flow category state`)
      assert.equal(scenario.initial.selectedIndex, '1', `${scenario.id}: selected index changed`)
      assert.equal(scenario.initial.timeParam, '2026-06-29T00:05:00.000Z', `${scenario.id}: canonical time changed`)
      assert.equal(scenario.initial.pointParam, null, `${scenario.id}: legacy point remained`)
    }
  }
}

console.log('U10G browser evidence verification passed.')
console.log('- 8 Twitch/Kick Day Flow and Battle Lines architecture scenarios')
console.log('- one feature request per initial load and zero cross-provider requests')
console.log('- Twitch Day Flow alone carries the authorized public category fetch/history wrapper')
console.log('- Kick Day Flow and both Battle Lines routes retain native fetch/history identities')
console.log('- URLSearchParams.get identity is native on all routes')
