#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a47-kick-history-v2-schema-apply-retry-repair-contract.json'
const diagnosisPath = 'docs/audits/12a47-kick-history-v2-schema-failure-diagnosis-evidence.json'
const workflowPath = '.github/workflows/analytics-12a47-kick-history-v2-schema-apply-retry.yml'
const triggerPath = 'docs/audits/12a47-kick-history-v2-schema-apply-retry-trigger.json'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const diagnosis = JSON.parse(fs.readFileSync(diagnosisPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a47-kick-history-v2-schema-apply-retry-repair-contract-v1', 'contract schema mismatch')
assert(contract.phase === '12A-47', 'phase mismatch')
assert(contract.issue === 938, 'issue mismatch')
assert(contract.provider === 'kick', 'provider mismatch')
assert(contract.status === 'repair_package_ready_production_not_armed', 'repair status mismatch')
assert(contract.failedExecution.runId === 32332864208, 'failed run mismatch')
assert(contract.failedExecution.productionJobId === 96316884149, 'failed job mismatch')
assert(contract.acceptedDiagnosis.classification === 'SAFE_RETRY_ABSENT', 'diagnosis classification mismatch')
assert(contract.acceptedDiagnosis.mergeSha === '20f0c7e1e43e88a829a038d048bb5b55be4efd41', 'diagnosis merge mismatch')
assert(contract.acceptedDiagnosis.artifactId === 9393922941, 'diagnosis artifact mismatch')
assert(contract.acceptedDiagnosis.rowsWritten === 0 && contract.acceptedDiagnosis.changes === 0, 'diagnosis was not read-only')
assert(contract.acceptedPackage.pr === 929, 'accepted package mismatch')
assert(contract.acceptedPackage.confirmation === 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY', 'confirmation mismatch')
assert(contract.acceptedPackage.firstApplyStatements === 5 && contract.acceptedPackage.secondApplyStatements === 0, 'statement contract mismatch')
assert(contract.repair.triggerPresentInRepairPackage === false, 'repair package must not contain trigger')
assert(contract.repair.packageMergeExecutesProduction === false, 'repair merge must not execute production')
assert(contract.repair.stageAwareFailureEvidence === true, 'failure evidence hardening missing')
assert(contract.repair.schemaSemanticsChanged === false, 'schema semantics must not change')
assert(contract.repair.workerRuntimeChanged === false, 'worker runtime must not change')
assert(!fs.existsSync(triggerPath), '12A47 trigger must be absent from repair package')

assert(diagnosis.schemaVersion === 'viewloom-12a47-kick-history-v2-schema-failure-diagnosis-evidence-v1', 'diagnosis schema mismatch')
assert(diagnosis.status === 'ACCEPTED', 'diagnosis not accepted')
assert(diagnosis.classification === 'SAFE_RETRY_ABSENT', 'diagnosis is not clean absent')
assert(diagnosis.productionState.v1Schema.complete === true, 'v1 schema not complete')
assert(diagnosis.productionState.v2Schema.absent === true, 'v2 schema not absent')
assert(diagnosis.productionState.v2Schema.partial === false, 'v2 schema partial')
assert(diagnosis.productionState.v2Schema.totalRows === 0, 'unexpected v2 rows')
assert(diagnosis.productionState.temporaryWorker.serviceHttpStatus === 404, 'temporary worker not absent')
assert(diagnosis.diagnosisQueryMetrics.rowsWritten === 0 && diagnosis.diagnosisQueryMetrics.changes === 0, 'diagnosis mutation detected')
assert(diagnosis.conclusion.cleanAbsentForControlledRetry === true, 'controlled retry precondition missing')
assert(diagnosis.conclusion.blindIdenticalRerunAuthorized === false, 'blind rerun must remain forbidden')

for (const required of [
  'set -Eeuo pipefail',
  "stage='initialize'",
  'write_failure_evidence',
  'failure_handler',
  'trap failure_handler ERR',
  "stage='deploy_temporary_worker'",
  "stage='resolve_worker_url'",
  "stage='configure_apply_token'",
  "stage='pre_inspect'",
  "stage='first_apply_tables_then_indexes'",
  "stage='second_apply_noop'",
  "stage='wait_for_new_natural_snapshot'",
  "stage='cleanup_temporary_worker'",
  'failedAtStage',
  'phase12a47-kick-history-v2-schema-apply-retry',
]) assert(workflow.includes(required), `workflow hardening missing: ${required}`)

for (const forbidden of ['HISTORY_CATEGORY_GENERATION_ENABLED = "false"', 'wrangler d1 execute', 'DELETE FROM history_category', 'INSERT INTO history_category']) {
  assert(!workflow.includes(forbidden), `forbidden retry behavior: ${forbidden}`)
}

for (const [key, value] of Object.entries(contract.authorizations)) {
  if (key === 'repairPackageMerge') assert(value === true, 'repair package merge must be the only current authorization')
  else assert(value === false, `${key} must remain unauthorized`)
}

console.log('12A-47 Kick History v2 schema retry repair verified')
