import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const manifestPath = process.argv[2] || 'docs/audits/r12c2-launch-asset-manifest.json'
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const captureEvidence = JSON.parse(readFileSync('docs/audits/r12c2-launch-assets-capture.json', 'utf8'))

assert.equal(manifest.schema, 'viewloom-r12c2-launch-asset-manifest-v1')
assert.equal(manifest.phase, 'Phase 12')
assert.equal(manifest.workstream, 'R12C-2')
assert.equal(manifest.packageRoot, 'apps/web/public/launch-assets')
assert.equal(manifest.permanentCaptureEvidence, 'docs/audits/r12c2-launch-assets-capture.json')
assert.equal(manifest.capture?.origin, 'https://vl.badjoke-lab.com')
assert.equal(manifest.capture?.result, 'pass')
assert.equal(manifest.assetCount, 6)
assert.equal(manifest.assets.length, 6)
assert.ok(Array.isArray(manifest.boundaries) && manifest.boundaries.length >= 4)

assert.equal(captureEvidence.schema, 'viewloom-r12c2-launch-assets-capture-v1')
assert.equal(captureEvidence.phase, 'Phase 12')
assert.equal(captureEvidence.workstream, 'R12C-2')
assert.equal(captureEvidence.origin, manifest.capture.origin)
assert.equal(captureEvidence.checked_at, manifest.capture.checkedAt)
assert.equal(captureEvidence.result, 'pass')
assert.equal(captureEvidence.assets.length, 6)
assert.equal(captureEvidence.violations.length, 0)

const expected = [
  { id: 'viewloom-desktop', route: '/', width: 1440, height: 1000, provider: 'portal' },
  { id: 'viewloom-mobile', route: '/', width: 390, height: 844, provider: 'portal' },
  { id: 'twitch-heatmap', route: '/twitch/heatmap/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-day-flow', route: '/twitch/day-flow/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-battle-lines', route: '/twitch/battle-lines/', width: 1440, height: 1000, provider: 'twitch' },
  { id: 'twitch-history', route: '/twitch/history/', width: 1440, height: 1000, provider: 'twitch' },
]

const captions = readFileSync('docs/product/launch-asset-captions.md', 'utf8')
const forbidden = [
  /complete platform coverage/i,
  /official (Twitch|Kick) analytics/i,
  /unique viewers/i,
  /exact creator revenue/i,
  /exact session reconstruction/i,
  /combined Twitch and Kick/i,
  /cross-platform ranking/i,
]

for (const item of expected) {
  const asset = manifest.assets.find((entry) => entry.id === item.id)
  const capture = captureEvidence.assets.find((entry) => entry.id === item.id)
  assert.ok(asset, `missing manifest asset ${item.id}`)
  assert.ok(capture, `missing capture evidence asset ${item.id}`)
  assert.equal(asset.route, item.route, `${item.id}: route mismatch`)
  assert.deepEqual(asset.viewport, { width: item.width, height: item.height }, `${item.id}: viewport mismatch`)
  assert.equal(asset.provider, item.provider, `${item.id}: provider mismatch`)
  assert.equal(asset.path, `${manifest.packageRoot}/${item.id}.png`, `${item.id}: package path mismatch`)
  assert.equal(asset.filename, `${item.id}.png`, `${item.id}: filename mismatch`)
  assert.match(asset.sha256, /^[a-f0-9]{64}$/, `${item.id}: invalid sha256`)
  assert.ok(asset.sizeBytes > 10_000, `${item.id}: screenshot unexpectedly small`)
  assert.equal(asset.publicSurfaceEvidence?.status, 200, `${item.id}: HTTP status mismatch`)
  assert.equal(asset.publicSurfaceEvidence?.canonical, `https://vl.badjoke-lab.com${item.route}`, `${item.id}: canonical mismatch`)
  assert.equal(asset.publicSurfaceEvidence?.horizontalOverflowPx <= 2, true, `${item.id}: horizontal overflow`)
  assert.deepEqual(asset.publicSurfaceEvidence?.loadingPatternsRemaining, [], `${item.id}: loading text remains`)
  assert.ok(asset.publicSurfaceEvidence?.title?.includes('ViewLoom'), `${item.id}: title missing ViewLoom`)
  assert.ok(asset.publicSurfaceEvidence?.h1, `${item.id}: H1 missing`)
  assert.ok(Array.isArray(asset.intendedUse) && asset.intendedUse.length >= 2, `${item.id}: intended-use metadata incomplete`)
  assert.ok(asset.caption?.length >= 40, `${item.id}: caption too short`)

  assert.equal(asset.sha256, capture.sha256, `${item.id}: capture and manifest hash diverge`)
  assert.equal(asset.sizeBytes, capture.sizeBytes, `${item.id}: capture and manifest size diverge`)
  assert.equal(asset.caption, capture.caption, `${item.id}: capture and manifest caption diverge`)

  const bytes = readFileSync(asset.path)
  const actualHash = createHash('sha256').update(bytes).digest('hex')
  assert.equal(bytes.length, asset.sizeBytes, `${item.id}: byte size mismatch`)
  assert.equal(actualHash, asset.sha256, `${item.id}: sha256 mismatch`)
  assert.ok(captions.includes(`### ${item.id}`), `${item.id}: caption section missing`)
  assert.ok(captions.includes(asset.caption), `${item.id}: manifest caption and caption package diverge`)
}

for (const pattern of forbidden) {
  assert.equal(pattern.test(captions), false, `caption package contains forbidden stronger claim: ${pattern}`)
}

console.log(JSON.stringify({
  result: 'pass',
  schema: manifest.schema,
  assets: manifest.assets.length,
  packageRoot: manifest.packageRoot,
  permanentCaptureEvidence: manifest.permanentCaptureEvidence,
}, null, 2))
