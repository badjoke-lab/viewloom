#!/usr/bin/env node
import fs from 'node:fs'

const path = process.argv[2] || 'docs/audits/12a47-kick-history-v2-schema-apply-retry-trigger.json'
const trigger = JSON.parse(fs.readFileSync(path, 'utf8'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}
function sha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value)
}

assert(trigger.schemaVersion === 'viewloom-12a47-kick-history-v2-schema-apply-retry-trigger-v1', 'trigger schema mismatch')
assert(trigger.status === 'armed_for_one_time_main_push', 'trigger status mismatch')
assert(trigger.provider === 'kick', 'provider mismatch')
assert(trigger.oneTime === true, 'oneTime mismatch')
assert(trigger.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(sha(trigger.sourceMainSha), 'sourceMainSha invalid')
assert(trigger.retryOfRunId === 32332864208, 'retryOfRunId mismatch')
assert(trigger.diagnosisRunId === 32333818009, 'diagnosisRunId mismatch')
assert(trigger.diagnosisArtifactId === 9393922941, 'diagnosisArtifactId mismatch')
assert(trigger.diagnosisClassification === 'SAFE_RETRY_ABSENT', 'diagnosis classification mismatch')
assert(trigger.acceptedCandidatePr === 927, 'candidate PR mismatch')
assert(trigger.acceptedPackagePr === 929, 'package PR mismatch')
assert(Number.isInteger(trigger.repairPackagePr) && trigger.repairPackagePr > 0, 'repair package PR missing')
assert(sha(trigger.expectedRepairPackageHeadSha), 'repair package head invalid')
assert(sha(trigger.expectedRepairPackageMergeSha), 'repair package merge invalid')
assert(trigger.mutations?.productionSchemaExecution === true, 'schema execution permission missing')
assert(trigger.mutations?.productionD1Mutation === true, 'D1 mutation permission missing')
for (const [key, value] of Object.entries(trigger.forbidden || {})) assert(value === false, `${key} must remain false`)
console.log('12A-47 Kick History v2 schema retry trigger verified')
