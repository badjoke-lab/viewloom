import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  analyzeSlots,
  buildTwitchWindowSql,
  determineOutcome,
  resolveAuditWindow,
} from './run-12a5-twitch-replacement-seven-day-audit.mjs'

const contract = JSON.parse(
  fs.readFileSync('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json', 'utf8'),
)

const windowSql = buildTwitchWindowSql({
  startAt: contract.window.startAt,
  endExclusiveAt: contract.window.endExclusiveAt,
})
const statements = windowSql.split(';').map((statement) => statement.trim()).filter(Boolean)
assert.equal(statements.every((statement) => /^(SELECT|WITH)\b/i.test(statement)), true)
const slotStatement = statements.find((statement) => statement.includes('observed_bucket_minute'))
assert.ok(slotStatement)
assert.ok(slotStatement.includes('FROM minute_snapshots'))
assert.ok(slotStatement.includes("provider = 'twitch'"))
assert.ok(slotStatement.includes("json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'"))
assert.equal(slotStatement.includes('FROM scoped'), false)
assert.equal(statements.slice(1).some((statement) => statement.includes('FROM scoped')), false)

const finalWindow = resolveAuditWindow(
  contract,
  'final',
  '2026-08-05T05:30:00.000Z',
)
assert.equal(finalWindow.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(finalWindow.endExclusiveAt, '2026-08-05T05:30:00.000Z')
assert.equal(finalWindow.expectedSlots, 2016)
assert.equal(finalWindow.expectedFinalSlots, 2016)

assert.throws(
  () => resolveAuditWindow(contract, 'final', '2026-08-05T05:29:59.999Z'),
  /final_audit_boundary_not_reached/,
)

const checkpointWindow = resolveAuditWindow(
  contract,
  'checkpoint',
  '2026-07-30T05:37:42.000Z',
)
assert.equal(checkpointWindow.endExclusiveAt, '2026-07-30T05:35:00.000Z')
assert.equal(checkpointWindow.expectedSlots, 289)

const allSlots = []
for (
  let cursor = Date.parse(finalWindow.startAt);
  cursor < Date.parse(finalWindow.endExclusiveAt);
  cursor += 5 * 60 * 1000
) {
  allSlots.push(new Date(cursor).toISOString())
}

const complete = analyzeSlots(
  finalWindow.startAt,
  finalWindow.endExclusiveAt,
  allSlots,
)
assert.equal(complete.expectedSlots, 2016)
assert.equal(complete.observedDistinctSlots, 2016)
assert.equal(complete.missingSlotCount, 0)
assert.equal(complete.duplicateSlotCount, 0)
assert.equal(complete.invalidBucketCount, 0)
assert.equal(complete.maximumConsecutiveMissingSlots, 0)
assert.equal(complete.coverageRatio, 1)

const missingTwo = analyzeSlots(
  finalWindow.startAt,
  finalWindow.endExclusiveAt,
  allSlots.filter((_, index) => index !== 100 && index !== 101),
)
assert.equal(missingTwo.missingSlotCount, 2)
assert.equal(missingTwo.maximumConsecutiveMissingSlots, 2)
assert.equal(missingTwo.missingSlots[0], allSlots[100])
assert.equal(missingTwo.missingSlots[1], allSlots[101])
assert.equal(missingTwo.coverageRatio, 0.999008)

const duplicate = analyzeSlots(
  finalWindow.startAt,
  finalWindow.endExclusiveAt,
  [...allSlots, allSlots[42]],
)
assert.equal(duplicate.duplicateSlotCount, 1)
assert.deepEqual(duplicate.duplicateSlots[0], { slot: allSlots[42], count: 2 })

const invalid = analyzeSlots(
  finalWindow.startAt,
  finalWindow.endExclusiveAt,
  [...allSlots, 'not-a-time', '2026-08-05T05:30:00.000Z'],
)
assert.equal(invalid.invalidBucketCount, 2)

const checkpointOutcome = determineOutcome('checkpoint', {
  readOnly: true,
  auditBoundaryReached: false,
  minimumElapsedDaysPass: false,
  slotCoveragePass: true,
  publicExposureStillUnauthorized: true,
})
assert.equal(checkpointOutcome.status, 'checkpoint_healthy')
assert.deepEqual(checkpointOutcome.failedGates, [])

const finalOutcome = determineOutcome('final', {
  readOnly: true,
  auditBoundaryReached: true,
  minimumElapsedDaysPass: true,
  slotCoveragePass: true,
  publicExposureStillUnauthorized: true,
})
assert.equal(finalOutcome.status, 'accepted')
assert.equal(finalOutcome.outcome, 'accepted_for_separate_evidence_pr')

const rejectedFinal = determineOutcome('final', {
  readOnly: true,
  auditBoundaryReached: true,
  minimumElapsedDaysPass: true,
  slotCoveragePass: false,
  publicExposureStillUnauthorized: true,
})
assert.equal(rejectedFinal.status, 'rejected')
assert.deepEqual(rejectedFinal.failedGates, ['slotCoveragePass'])

console.log(JSON.stringify({
  ok: true,
  expectedFinalSlots: finalWindow.expectedSlots,
  checkpointExpectedSlots: checkpointWindow.expectedSlots,
  sqlStatementScopeSafe: true,
  missingSlotAccounting: true,
  checkpointNonAuthorizing: true,
  finalRequiresBoundary: true,
}, null, 2))
