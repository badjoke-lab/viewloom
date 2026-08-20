#!/usr/bin/env node
import fs from 'node:fs'

const path = process.argv[2] || 'docs/audits/12a49-kick-history-v2-schema-apply-retry-trigger.json'
const trigger = JSON.parse(fs.readFileSync(path, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
function isSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
}

assert(trigger.schemaVersion === 'viewloom-12a49-kick-history-v2-schema-apply-retry-trigger-v1', 'trigger schema mismatch')
assert(trigger.status === 'armed_for_one_time_main_push', 'trigger status mismatch')
assert(trigger.provider === 'kick', 'provider mismatch')
assert(trigger.oneTime === true, 'oneTime mismatch')
assert(trigger.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(isSha(trigger.sourceMainSha), 'sourceMainSha invalid')
assert(trigger.retryOfRunId === 32335017572, 'retry source mismatch')
assert(trigger.rootCauseArtifactId === 9394373002, 'root cause artifact mismatch')
assert(trigger.rootCause === 'jq_false_falls_through_alternative_operator', 'root cause mismatch')
assert(trigger.acceptedCandidatePr === 927, 'candidate PR mismatch')
assert(trigger.acceptedPackagePr === 929, 'package PR mismatch')
assert(Number.isInteger(trigger.correctedPackagePr) && trigger.correctedPackagePr > 0, 'corrected package PR missing')
assert(isSha(trigger.expectedCorrectedPackageHeadSha), 'corrected package head invalid')
assert(isSha(trigger.expectedCorrectedPackageMergeSha), 'corrected package merge invalid')
assert(trigger.mutations?.productionSchemaExecution === true, 'schema execution permission missing')
assert(trigger.mutations?.productionD1Mutation === true, 'D1 mutation permission missing')
for (const [key, value] of Object.entries(trigger.forbidden || {})) assert(value === false, `${key} must remain false`)

console.log('12A-49 corrected Kick History v2 schema retry trigger verified')
