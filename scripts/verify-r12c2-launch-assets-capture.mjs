import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/r12c2-launch-assets/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-r12c2-launch-assets-capture-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12C-2')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.origin, 'https://vl.badjoke-lab.com')
assert.equal(evidence.assets.length, 6)
assert.equal(evidence.violations.length, 0)

const expected = [
  { id: 'viewloom-desktop', route: '/', width: 1440, height: 1000, provider: 'portal' },
  { id: 'viewloom-mobile', route: '/', width: 390, height: 844, provider: 'portal' },
  { id: 'twitch-heatmap', route: '/twitch/heatmap/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-day-flow', route: '/twitch/day-flow/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-battle-lines', route: '/twitch/battle-lines/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-history', route: '/twitch/history/', width: 1440, height: 1000, provider: 'twitch' },
]

for (const item of expected) {
  const asset = evidence.assets.find((entry) => entry.id === item.id)
  assert.ok(asset, `missing launch asset ${item.id}`)
  assert.equal(asset.route, item.route, `${item.id}: route mismatch`)
  assert.deepEqual(asset.viewport, { width: item.width, height: item.height }, `${item.id}: viewport mismatch`)
  assert.equal(asset.provider, item.provider, `${item.id}: provider mismatch`)
  assert.equal(asset.status, 200, `${item.id}: HTTP status mismatch`)
  assert.equal(asset.violations.length, 0, `${item.id}: capture violations remain`)
  assert.equal(asset.facts.bodyOverflow <= 2, true, `${item.id}: horizontal overflow`)
  assert.equal(asset.facts.loadingPatternsRemaining.length, 0, `${item.id}: loading text remains`)
  assert.ok(asset.facts.title.includes('ViewLoom'), `${item.id}: title missing ViewLoom`)
  assert.ok(asset.facts.h1, `${item.id}: H1 missing`)
  assert.equal(asset.facts.canonical, `https://vl.badjoke-lab.com${item.route}`, `${item.id}: canonical mismatch`)
  assert.ok(asset.facts.bodyTextLength >= 200, `${item.id}: body text unexpectedly short`)
  assert.match(asset.sha256, /^[a-f0-9]{64}$/, `${item.id}: invalid sha256`)
  assert.ok(asset.sizeBytes > 10_000, `${item.id}: screenshot unexpectedly small`)
  assert.equal(asset.filename, `${item.id}.png`, `${item.id}: filename mismatch`)
  assert.ok(Array.isArray(asset.intendedUse) && asset.intendedUse.length >= 2, `${item.id}: intended-use metadata incomplete`)
  assert.ok(asset.caption?.length >= 40, `${item.id}: caption too short`)
}

assert.equal(evidence.assets.filter((asset) => asset.provider === 'portal').length, 2)
assert.equal(evidence.assets.filter((asset) => asset.provider === 'twitch').length, 4)
assert.equal(evidence.assets.filter((asset) => asset.provider === 'kick').length, 0)

console.log('R12C-2 launch asset capture verification passed.')
console.log('- 6 current production screenshots captured')
console.log('- portal desktop and mobile coverage present')
console.log('- Heatmap, Day Flow, Battle Lines, and History feature captures present')
console.log('- status/title/H1/canonical/overflow/loading-state checks pass')
console.log('- every PNG has SHA-256, size, route, viewport, intended-use, and caption metadata')
console.log('- no cross-provider or invented mock asset is included')
