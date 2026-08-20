#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a49-kick-history-v2-schema-retry-gate-fix-contract.json'
const rootCausePath = 'docs/audits/12a49-kick-history-v2-preinspect-root-cause.json'
const workflowPath = '.github/workflows/analytics-12a49-kick-history-v2-schema-apply-retry.yml'
const runnerPath = 'scripts/run-12a49-kick-history-v2-schema-apply-retry.sh'
const triggerPath = 'docs/audits/12a49-kick-history-v2-schema-apply-retry-trigger.json'
const allowTrigger = process.env.VIEWLOOM_ALLOW_12A49_TRIGGER === 'true'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const rootCause = JSON.parse(fs.readFileSync(rootCausePath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a49-kick-history-v2-schema-retry-gate-fix-contract-v1', 'contract schema mismatch')
assert(contract.phase === '12A-49', 'phase mismatch')
assert(contract.issue === 945, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.status === 'corrected_retry_package_ready_production_not_armed', 'status mismatch')
assert(contract.acceptedRootCause.productionRunId === 32335017572, 'source retry mismatch')
assert(contract.acceptedRootCause.artifactId === 9394373002, 'source artifact mismatch')
assert(contract.acceptedRootCause.failedAtStage === 'pre_inspect', 'source stage mismatch')
assert(contract.acceptedRootCause.failureInspectOk === true, 'failure inspect was not healthy')
assert(contract.acceptedRootCause.v2SchemaAbsent === true, 'v2 schema not absent')
assert(contract.acceptedRootCause.v2SchemaPartial === false, 'v2 schema partial mismatch')
assert(contract.acceptedRootCause.v2Rows === 0, 'unexpected v2 rows')
assert(contract.acceptedRootCause.temporaryWorkerDeleted === true, 'temporary worker cleanup mismatch')
assert(contract.acceptedRootCause.postDeleteHttpStatus === 404, 'temporary worker final status mismatch')
assert(contract.acceptedRootCause.bug === 'jq_false_falls_through_alternative_operator', 'root-cause key mismatch')
assert(contract.correctedRetry.triggerPresentInPackage === false, 'package must not contain trigger')
assert(contract.correctedRetry.packageMergeExecutesProduction === false, 'package merge must not execute production')
assert(contract.correctedRetry.badBooleanFallbackForbidden === '.state.v2Schema.partial // true', 'bad expression contract mismatch')
assert(contract.correctedRetry.requiredBooleanCheck === '.state.v2Schema.partial == false', 'correct expression contract mismatch')
assert(contract.correctedRetry.preInspectRequiresFullHealthyState === true, 'pre-inspect full-state gate required')
assert(contract.correctedRetry.schemaSemanticsChanged === false, 'schema semantics changed')
assert(contract.correctedRetry.workerRuntimeChanged === false, 'worker runtime changed')

assert(rootCause.schemaVersion === 'viewloom-12a49-kick-history-v2-preinspect-root-cause-v1', 'root cause schema mismatch')
assert(rootCause.status === 'PROVEN', 'root cause not proven')
assert(rootCause.sourceRetry.runId === 32335017572, 'root cause source run mismatch')
assert(rootCause.sourceRetry.artifactId === 9394373002, 'root cause source artifact mismatch')
assert(rootCause.sourceRetry.failedAtStage === 'pre_inspect', 'root cause stage mismatch')
assert(rootCause.observedFailureInspect.ok === true, 'source inspect was not ok')
assert(rootCause.observedFailureInspect.v2SchemaAbsent === true, 'source v2 was not absent')
assert(rootCause.observedFailureInspect.v2SchemaPartial === false, 'source partial mismatch')
assert(rootCause.observedFailureInspect.v2AggregateRows === 0, 'source v2 rows mismatch')
assert(rootCause.observedFailureInspect.providerLeakageRows === 0, 'source leakage mismatch')
assert(rootCause.conclusion.gateBug === true, 'gate bug conclusion missing')
assert(rootCause.conclusion.schemaAppliedBeforeFailure === false, 'source should not have applied schema')
assert(rootCause.conclusion.blindIdenticalRerun === false, 'blind identical rerun must remain false')

if (!allowTrigger) assert(!fs.existsSync(triggerPath), '12A49 trigger must be absent from repair package')
else assert(fs.existsSync(triggerPath), 'explicit trigger validation requires trigger file')

assert(!runner.includes('.state.v2Schema.partial // true'), 'bad jq boolean fallback still present in runner')
assert(runner.includes('.state.v2Schema.partial == false'), 'explicit partial=false equality missing')
assert(runner.includes("stage='pre_inspect'"), 'pre_inspect stage missing')
assert(runner.includes("stage='first_apply_tables_then_indexes'"), 'first apply stage missing')
assert(runner.includes("stage='second_apply_noop'"), 'second apply stage missing')
assert(runner.includes('trap failure_handler ERR'), 'stage-aware ERR trap missing')
assert(runner.includes('lastPreInspectHttpStatus'), 'pre-inspect HTTP evidence missing')
assert(runner.includes('temporaryWorkerDeleted'), 'cleanup evidence missing')
assert(runner.includes('firstApplyStatementCount'), 'success statement evidence missing')
assert(runner.includes('secondApplyStatementCount'), 'second-pass evidence missing')

for (const required of [
  'docs/audits/12a49-kick-history-v2-schema-apply-retry-trigger.json',
  "github.event_name == 'push'",
  'scripts/run-12a49-kick-history-v2-schema-apply-retry.sh',
  'phase12a49-kick-history-v2-schema-apply-retry',
  'jq -nr \'false // true\'',
  'jq -e \'.state.v2Schema.partial == false\'',
]) assert(workflow.includes(required), `workflow regression gate missing: ${required}`)

for (const [key, value] of Object.entries(contract.authorizations)) {
  if (key === 'packageMerge') assert(value === true, 'package merge must be the only current authorization')
  else assert(value === false, `${key} must remain unauthorized`)
}

console.log('12A-49 corrected Kick History v2 schema retry gate verified')
