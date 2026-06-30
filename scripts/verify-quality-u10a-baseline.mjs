import assert from 'node:assert/strict'
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
