import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const file = resolve(process.env.QUALITY_U10C_ARTIFACT_DIR ?? '/tmp/quality-u10c', 'quality-u10c-visualization-browser-evidence.json')
const evidence = JSON.parse(readFileSync(file, 'utf8'))
const routes = [
  '/twitch/heatmap/', '/kick/heatmap/',
  '/twitch/day-flow/', '/kick/day-flow/',
  '/twitch/battle-lines/', '/kick/battle-lines/',
  '/twitch/history/', '/kick/history/',
]
const widths = [1440, 820, 390, 360]

assert.equal(evidence.schema, 'viewloom-quality-u10c-visualization-browser-v1')
assert.equal(evidence.phase, 'U10C')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.routes, 8)
assert.deepEqual(evidence.viewports, widths)
assert.equal(evidence.scenarios.length, 32)

for (const route of routes) {
  for (const width of widths) {
    const scenario = evidence.scenarios.find((item) => item.route === route && item.width === width)
    assert.ok(scenario, `missing U10C scenario ${route} at ${width}px`)
    assert.equal(scenario.result, 'pass', `${route} ${width}px did not pass`)
    assert.equal(scenario.provider, route.startsWith('/twitch/') ? 'twitch' : 'kick')
    assert.equal(scenario.initial.guideVisible, true)
    assert.equal(scenario.initial.stageVisible, true)
    assert.equal(scenario.initial.horizontalOverflow <= 1, true)
    assert.equal(scenario.afterMetric.horizontalOverflow <= 1, true)
    assert.equal(scenario.initial.cells.length, 5)
    assert.equal(scenario.afterMetric.cells.length, 5)
    assert.ok(scenario.initial.stageDescribedBy.includes(scenario.initial.guideId))
    assert.equal(scenario.afterMetric.stageState, scenario.afterMetric.guideState)
    assert.ok(scenario.afterMetric.stageMetric)
  }
}

for (const feature of ['heatmap', 'day-flow', 'battle-lines', 'history']) {
  assert.equal(evidence.scenarios.filter((item) => item.feature === feature).length, 8, `${feature} scenario coverage changed`)
}

console.log('ViewLoom U10C visualization browser evidence passed.')
console.log('- 8 provider-separated routes')
console.log('- 4 required viewports')
console.log('- 32 visualization grammar scenarios')
console.log('- metric synchronization and normalized state semantics retained')
