import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.env.QUALITY_U10E_EVIDENCE ?? '/tmp/quality-u10e/quality-u10e-responsive-evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-quality-u10e-responsive-browser-v1')
assert.equal(evidence.phase, 'U10E')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.routes, 9)
assert.deepEqual(evidence.widths, [1440, 820, 390, 360])
assert.equal(evidence.scenarios.length, 36)

const expectedRoutes = [
  'portal',
  'twitch-day-flow', 'kick-day-flow',
  'twitch-battle-lines', 'kick-battle-lines',
  'twitch-channel', 'kick-channel',
  'twitch-watchlist', 'kick-watchlist',
]
for (const route of expectedRoutes) {
  for (const width of [1440, 820, 390, 360]) {
    const item = evidence.scenarios.find((candidate) => candidate.id === `${route}-${width}`)
    assert.ok(item, `missing scenario: ${route}-${width}`)
    assert.ok(item.measuredTargets > 0, `${route}-${width}: no targets measured`)
    assert.ok(item.overflow <= 2, `${route}-${width}: horizontal overflow`)
    assert.equal(item.focus.moved, true, `${route}-${width}: focus did not move`)
    assert.equal(item.focus.visible, true, `${route}-${width}: focused item is not visible`)
    assert.ok(item.focus.name, `${route}-${width}: focused item has no name`)
    if (width <= 390) assert.ok(item.minimumTargetHeight >= 44, `${route}-${width}: target below 44px`)
  }
}

const forcedColorScenarios = evidence.scenarios.filter((item) => item.viewport.width === 360)
assert.equal(forcedColorScenarios.length, 9)
for (const item of forcedColorScenarios) assert.equal(item.viewport.forcedColors, 'active')

console.log('U10E browser evidence verification passed.')
console.log('- 36 route and viewport scenarios passed')
console.log('- mobile target sizes, overflow, names, and focus are protected')
