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
assert(['armed_for_one_time_main_push', 'consumed_pass_retired'].includes(trigger.status), 'trigger status mismatch')
assert(trigger.provider === 'kick', 'provider mismatch')
assert(trigger.oneTime === true, 'oneTime mismatch')
assert(trigger.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(isSha(trigger.sourceMainSha), 'sourceMainSha invalid')
assert(trigger.retryOfRunId === 32335017572, 'retry source mismatch')
assert(trigger.rootCauseArtifactId === 9394373002, 'root cause artifact mismatch')
assert(trigger.rootCause === 'jq_false_falls_through_alternative_operator', 'root cause mismatch')
assert(trigger.acceptedCandidatePr === 927, 'candidate PR mismatch')
assert(trigger.acceptedPackagePr === 929, 'package PR mismatch')
assert(trigger.correctedPackagePr === 946, 'corrected package PR mismatch')
assert(trigger.expectedCorrectedPackageHeadSha === 'd852dc712ab84d05c751a746765b44d87ad7a371', 'corrected package head mismatch')
assert(trigger.expectedCorrectedPackageMergeSha === 'ba3435901a1d2055f4106aa12932d0e714b999e1', 'corrected package merge mismatch')

if (trigger.status === 'armed_for_one_time_main_push') {
  assert(trigger.mutations?.productionSchemaExecution === true, 'armed schema execution permission missing')
  assert(trigger.mutations?.productionD1Mutation === true, 'armed D1 mutation permission missing')
  assert(trigger.execution === undefined, 'armed trigger must not contain execution evidence')
} else {
  assert(trigger.mutations?.productionSchemaExecution === false, 'consumed schema execution must be false')
  assert(trigger.mutations?.productionD1Mutation === false, 'consumed D1 mutation must be false')
  const execution = trigger.execution || {}
  assert(execution.executionIssue === 949, 'execution issue mismatch')
  assert(execution.triggerPr === 948, 'trigger PR mismatch')
  assert(execution.triggerHeadSha === '88f60b8aaa53cd0e60b3a4f72470064e29e26386', 'trigger head mismatch')
  assert(execution.productionMergeSha === 'b0366eb1b1b2268ef75bb2a5d29251f6097ef574', 'production merge mismatch')
  assert(execution.productionRunId === 32395881830, 'production run mismatch')
  assert(execution.contractJobId === 96512465189, 'contract job mismatch')
  assert(execution.productionSchemaRetryJobId === 96512575673, 'production job mismatch')
  assert(execution.artifactId === 9416698952, 'artifact mismatch')
  assert(execution.artifactDigest === 'sha256:9cb2bc7d7304593232090a248d2c94d351acc465a1337c7d196ca43ace12e9b0', 'artifact digest mismatch')
  assert(execution.result === 'pass', 'execution result mismatch')
  assert(execution.firstApplyStatementCount === 5, 'first statement count mismatch')
  assert(execution.secondApplyStatementCount === 0, 'second statement count mismatch')
  assert(execution.v1SchemaCompleteAfter === true, 'v1 schema incomplete')
  assert(execution.v2SchemaCompleteAfter === true, 'v2 schema incomplete')
  assert(execution.v2AggregateRowsAfter === 0, 'unexpected v2 rows')
  assert(execution.providerLeakageRowsAfter === 0, 'provider leakage mismatch')
  assert(execution.temporaryWorkerDeleted === true, 'temporary worker not deleted')
  assert(execution.postDeleteHttpStatus === 404, 'post-delete status mismatch')
  assert(execution.retirementIssue === 953, 'retirement issue mismatch')
  assert(execution.retirementPr === 954, 'retirement PR mismatch')
  assert(execution.retirementMergeSha === '826c41d6138f529b207f74cc4b784da0a8d65b30', 'retirement merge mismatch')
  assert(execution.acceptanceIssue === 951, 'acceptance issue mismatch')
}

for (const [key, value] of Object.entries(trigger.forbidden || {})) assert(value === false, `${key} must remain false`)

console.log(`12A-49 corrected Kick History v2 schema retry trigger verified: ${trigger.status}`)
