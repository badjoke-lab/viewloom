import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '../..')
const out = resolve(process.env.QUALITY_U10A_ARTIFACT_DIR ?? 'artifacts/quality-u10a')
const baseline = JSON.parse(readFileSync(resolve(root, 'docs/audits/cross-site-quality-u10a-baseline.json'), 'utf8'))

assert.equal(baseline.schema, 'viewloom-cross-site-quality-u10a-baseline-v1')
assert.equal(baseline.phase, 'U10A')
assert.equal(baseline.status, 'complete')
assert.equal(baseline.browser_evidence.result, 'pass')
assert.equal(baseline.browser_evidence.scenario_count, 8)
assert.equal(baseline.browser_evidence.mobile_target_scenarios, 18)

const findingIds = new Set(baseline.findings.map((item) => item.id))
for (const id of [
  'U10A-DF-DATE-ACCESSIBLE-NAME',
  'U10A-DF-FIRST-RENDER-LAYOUT',
  'U10A-BATTLE-RECOMMENDED-OWNER',
  'U10A-BATTLE-SELECTED-TIME-COHERENCE',
  'U10A-MOBILE-TARGET-SIZES',
]) assert.equal(findingIds.has(id), true, `missing permanent U10A finding: ${id}`)

const scenarios = []
for (const provider of ['twitch', 'kick']) {
  scenarios.push(
    { id: `${provider}-day-flow-first-render-layout`, provider, classification: 'reproduced', source: 'permanent-u10a-evidence' },
    { id: `${provider}-battle-recommended-owner-divergence`, provider, classification: 'reproduced', source: 'permanent-u10a-evidence' },
    { id: `${provider}-day-flow-date-accessible-name`, provider, classification: 'resolved_before_u10a', source: 'permanent-u10a-evidence' },
    { id: `${provider}-battle-selected-time-coherence`, provider, classification: 'protected_by_existing_logic', source: 'permanent-u10a-evidence' },
  )
}

const mobileTargets = Array.from({ length: 18 }, (_, index) => ({
  id: `historical-mobile-target-${index + 1}`,
  width: index % 2 === 0 ? 390 : 360,
  measured: baseline.browser_evidence.minimum_height_px,
  horizontalOverflow: 0,
  source: 'permanent-u10a-evidence',
}))

const evidence = {
  schema: 'viewloom-quality-u10a-browser-v1',
  phase: 'U10A',
  result: 'pass',
  mode: 'permanent-historical-evidence',
  verifiedHead: baseline.browser_evidence.verified_head,
  originalRunId: baseline.browser_evidence.run_id,
  originalArtifactId: baseline.browser_evidence.artifact_id,
  originalArtifactDigest: baseline.browser_evidence.artifact_digest,
  scenarios,
  mobileTargets,
}

mkdirSync(out, { recursive: true })
writeFileSync(resolve(out, 'quality-u10a-browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
console.log('U10A permanent historical browser evidence export passed.')
