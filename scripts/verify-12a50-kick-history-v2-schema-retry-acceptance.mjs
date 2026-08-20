#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a50-kick-history-v2-schema-retry-acceptance-contract.json'
const evidencePath = 'docs/audits/12a50-kick-history-v2-schema-retry-acceptance-evidence.json'
const triggerPath = 'docs/audits/12a49-kick-history-v2-schema-apply-retry-trigger.json'
const retiredWorkflowPath = '.github/workflows/analytics-12a49-kick-history-v2-schema-apply-retry.yml'
const closeoutWorkflowPath = '.github/workflows/analytics-12a50-kick-history-v2-schema-retry-acceptance.yml'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
const retiredWorkflow = fs.readFileSync(retiredWorkflowPath, 'utf8')
const closeoutWorkflow = fs.readFileSync(closeoutWorkflowPath, 'utf8')

function assert(condition, message) { if (!condition) throw new Error(message) }

assert(contract.schemaVersion === 'viewloom-12a50-kick-history-v2-schema-retry-acceptance-contract-v1', 'contract schema mismatch')
assert(contract.phase === '12A-50', 'contract phase mismatch')
assert(contract.issue === 951, 'contract issue mismatch')
assert(contract.provider === 'kick', 'contract provider mismatch')
assert(contract.source.executionIssue === 949, 'execution issue mismatch')
assert(contract.source.triggerPr === 948, 'trigger PR mismatch')
assert(contract.source.triggerHeadSha === '88f60b8aaa53cd0e60b3a4f72470064e29e26386', 'trigger head mismatch')
assert(contract.source.preExecutionMainSha === 'ba3435901a1d2055f4106aa12932d0e714b999e1', 'pre-execution main mismatch')
assert(contract.source.productionMergeSha === 'b0366eb1b1b2268ef75bb2a5d29251f6097ef574', 'production merge mismatch')
assert(contract.source.productionRunId === 32395881830, 'production run mismatch')
assert(contract.source.sourceArtifactId === 9416698952, 'source artifact mismatch')
assert(contract.source.sourceArtifactDigest === 'sha256:9cb2bc7d7304593232090a248d2c94d351acc465a1337c7d196ca43ace12e9b0', 'source digest mismatch')
assert(contract.retirement.issue === 953 && contract.retirement.pr === 954, 'retirement authority mismatch')
assert(contract.retirement.mergeSha === '826c41d6138f529b207f74cc4b784da0a8d65b30', 'retirement merge mismatch')
assert(contract.retirement.executionSurfaceRetired === true, 'execution surface retirement missing')

assert(evidence.schemaVersion === 'viewloom-12a50-kick-history-v2-schema-retry-acceptance-evidence-v1', 'evidence schema mismatch')
assert(evidence.status === 'PASS', 'evidence status must be PASS')
assert(evidence.phase === '12A-50', 'evidence phase mismatch')
assert(evidence.provider === 'kick', 'evidence provider mismatch')
assert(evidence.acceptanceIssue === 951 && evidence.executionIssue === 949 && evidence.triggerPr === 948, 'evidence authority mismatch')
assert(evidence.preExecutionMainSha === contract.source.preExecutionMainSha, 'evidence pre-main mismatch')
assert(evidence.triggerHeadSha === contract.source.triggerHeadSha, 'evidence trigger head mismatch')
assert(evidence.productionMergeSha === contract.source.productionMergeSha, 'evidence merge mismatch')
assert(evidence.productionRunId === contract.source.productionRunId, 'evidence run mismatch')
assert(evidence.runConclusion === 'success', 'source run not successful')
assert(evidence.contractJobId === 96512465189 && evidence.contractConclusion === 'success', 'contract job mismatch')
assert(evidence.productionSchemaRetryJobId === 96512575673 && evidence.productionConclusion === 'success', 'production job mismatch')
assert(evidence.sourceArtifactId === contract.source.sourceArtifactId, 'evidence artifact mismatch')
assert(evidence.sourceArtifactDigest === contract.source.sourceArtifactDigest, 'evidence digest mismatch')
assert(evidence.sourceEvidenceStatus === 'pass' && evidence.failedAtStage === '', 'source evidence did not pass cleanly')
assert(evidence.firstApplyStatementCount === contract.requiredPass.firstApplyStatementCount, 'first statement count mismatch')
assert(evidence.secondApplyStatementCount === contract.requiredPass.secondApplyStatementCount, 'second statement count mismatch')
assert(evidence.firstApplyWorkerWallMs === 1956 && evidence.firstApplyWorkerWallMs <= 15000, 'worker wall mismatch')
assert(evidence.v1SchemaCompleteAfter === true && evidence.v2SchemaCompleteAfter === true, 'schema completeness mismatch')
assert(evidence.v2AggregateRowsAfter === 0, 'unexpected v2 aggregate rows')
assert(evidence.providerLeakageRowsAfter === 0, 'provider leakage detected')
assert(evidence.freshNaturalSnapshot === true, 'fresh snapshot evidence missing')
assert(Date.parse(evidence.postCollectedAt) > Date.parse(evidence.preCollectedAt), 'snapshot did not advance')
assert(evidence.databaseSizeDeltaBytes === 57344 && evidence.databaseSizeDeltaBytes <= contract.requiredPass.maxDatabaseSizeDeltaBytes, 'database size delta mismatch')
assert(evidence.temporaryWorkerDeleted === true && evidence.postDeleteHttpStatus === 404, 'temporary worker cleanup mismatch')
assert(evidence.retrieval.pr === 952 && evidence.retrieval.runId === 32396314034 && evidence.retrieval.jobId === 96513854235, 'retrieval evidence mismatch')
assert(evidence.retrieval.artifactId === 9416771719, 'retrieval artifact mismatch')
assert(evidence.retrieval.artifactDigest === 'sha256:377570bef6e5e7482b9d862922b953b8bf9c17f4763a8f4f0908dcc75150dba2', 'retrieval digest mismatch')
assert(evidence.retirement.issue === 953 && evidence.retirement.pr === 954, 'retirement evidence mismatch')
assert(evidence.retirement.mergeSha === contract.retirement.mergeSha, 'retirement evidence merge mismatch')
assert(evidence.retirement.runId === 32396589676 && evidence.retirement.jobId === 96514722123, 'retirement CI mismatch')
assert(evidence.retirement.productionExecutionSurfaceRetired === true, 'retirement evidence missing')
assert(evidence.triggerLifecycle === 'consumed_pass_retired', 'trigger lifecycle mismatch')

assert(trigger.status === 'consumed_pass_retired', 'trigger was not consumed')
assert(trigger.mutations?.productionSchemaExecution === false, 'consumed trigger still authorizes schema execution')
assert(trigger.mutations?.productionD1Mutation === false, 'consumed trigger still authorizes D1 mutation')
assert(trigger.execution?.productionRunId === evidence.productionRunId, 'trigger execution run mismatch')
assert(trigger.execution?.artifactDigest === evidence.sourceArtifactDigest, 'trigger execution digest mismatch')
assert(trigger.execution?.retirementMergeSha === contract.retirement.mergeSha, 'trigger retirement mismatch')

const retiredForbidden = [
  '\n  pu' + 'sh:',
  'workflow_' + 'dispatch:',
  '\n  sche' + 'dule:',
  'CLOUD' + 'FLARE_API_TOKEN',
  'CLOUD' + 'FLARE_ACCOUNT_ID',
  'production-schema-' + 'retry:',
  'run-12a49-kick-history-v2-schema-apply-' + 'retry.sh',
  'actions/upload-' + 'artifact@v4',
]
for (const needle of retiredForbidden) assert(!retiredWorkflow.includes(needle), `retired workflow regained production surface: ${needle}`)
const closeoutForbidden = [
  'CLOUD' + 'FLARE_API_TOKEN',
  'CLOUD' + 'FLARE_ACCOUNT_ID',
  'wrang' + 'ler@4 deploy',
  'wrang' + 'ler d1 execute',
  'd1 ex' + 'ecute',
  'secret ' + 'put',
  'workers.' + 'dev',
]
for (const forbidden of closeoutForbidden) {
  assert(!closeoutWorkflow.includes(forbidden), `closeout workflow production surface forbidden: ${forbidden}`)
}
for (const [key, value] of Object.entries(contract.boundaries)) {
  if (key === 'repositoryOnly' || key === 'githubActionsReadOnly') assert(value === true, `${key} must be true`)
  else assert(value === false, `${key} must remain false`)
}
for (const [key, value] of Object.entries(evidence.boundaries)) assert(value === false, `${key} must remain false`)

console.log('12A-50 Kick History v2 schema retry canonical PASS acceptance verified')
