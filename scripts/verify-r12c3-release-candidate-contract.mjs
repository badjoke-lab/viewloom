import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const required = [
  'docs/audits/r12c3-release-candidate-contract.json',
  'docs/audits/r12c3-candidate-acceptance.json',
  'docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) assert.equal(existsSync(path), true, `missing R12C-3 historical dependency: ${path}`)
assert.equal(existsSync('docs/work-in-progress/phase12-release-readiness.md'), false)
assert.equal(existsSync('.github/workflows/release-r12c3-release-candidate.yml'), false)

const contract = json('docs/audits/r12c3-release-candidate-contract.json')
assert.equal(contract.schema, 'viewloom-r12c3-release-candidate-contract-v1')
assert.equal(contract.phase, 'Phase 12')
assert.equal(contract.workstream, 'R12C-3')
assert.equal(contract.status, 'complete')
assert.equal(contract.result, 'pass')
assert.equal(contract.branch, 'work-release-r12c3-release-candidate-acceptance')
assert.equal(contract.candidateEvidence, 'docs/audits/r12c3-candidate-acceptance.json')
assert.equal(contract.phase12ReleaseEvidence, 'docs/audits/phase12-release-acceptance.json')
assert.equal(contract.candidateContract.htmlRoutes, 25)
assert.equal(contract.candidateContract.inventoryEntries, 26)
assert.equal(contract.candidateContract.browserViewports, 4)
assert.equal(contract.candidateContract.browserScenarios, 100)
assert.equal(contract.candidateContract.sitemapRoutes, 21)
assert.deepEqual(contract.candidateContract.providers, ['twitch', 'kick'])
assert.equal(contract.candidateContract.combinedTotalsAllowed, false)
assert.equal(contract.candidateContract.combinedRankingsAllowed, false)
assert.equal(contract.requiredChecks.length, 11)
assert.equal(contract.postmergeBoundary.closeoutSatisfied, true)
assert.equal(contract.postmergeBoundary.canonicalNextAfterCloseout, 'Phase 12A Analytics Capture Foundation')

const candidate = json(contract.candidateEvidence)
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)

const release = json(contract.phase12ReleaseEvidence)
assert.equal(release.status, 'complete')
assert.equal(release.result, 'pass')
assert.equal(release.expectedMainSha, release.deployedSha)
assert.equal(release.counts.htmlRoutes, 25)
assert.equal(release.counts.sitemapRoutes, 21)
assert.equal(release.counts.blockingAlerts, 0)
assert.equal(release.nextWorkstream, 'Phase 12A Analytics Capture Foundation')

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) {
  const source = read(path)
  for (const fragment of [
    'Phase 12 English release readiness complete',
    'Phase 12A Analytics Capture Foundation',
    '12A-0 current data and capacity baseline',
    'work-analytics-12a0-capacity-baseline',
  ]) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

console.log('Completed R12C-3 candidate contract verification passed.')
console.log('- premerge candidate evidence remains permanent')
console.log('- exact-SHA Phase 12 release acceptance is complete')
console.log('- candidate-only workflow and Phase 12 working note are retired')
console.log('- Phase 12A is active at 12A-0')
