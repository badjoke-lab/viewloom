import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const acceptance = json('docs/audits/12a14-kick-history-category-schema-final-acceptance.json')
const trigger = json('docs/audits/12a14-kick-history-category-schema-apply-trigger.json')
const cleanDiagnosis = json('docs/audits/12a14-kick-history-schema-readonly-diagnosis-evidence.json')
const benchmark = json('docs/audits/12a13-kick-history-category-aggregate-benchmark-evidence.json')
const runtime = read('workers/shared/history-category-schema.ts')
const applyWorkflow = read('.github/workflows/analytics-12a14-kick-history-category-schema-apply.yml')
const diagnosisWorkflow = read('.github/workflows/analytics-12a14-kick-history-schema-readonly-diagnosis.yml')

assert.equal(acceptance.schemaVersion, 'viewloom-12a14-kick-history-category-schema-final-acceptance-v1')
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.trackingIssue, 844)
assert.equal(acceptance.provider, 'kick')
assert.equal(acceptance.migration, 'db/d1/006_history_category_aggregate.sql')

assert.equal(acceptance.history.initialFailedRunId, 31670411266)
assert.equal(acceptance.history.cleanDiagnosisRunId, 31670727423)
assert.equal(acceptance.history.cleanDiagnosisArtifactId, 9169595791)
assert.equal(acceptance.history.repairPackagePr, 841)
assert.equal(acceptance.history.repairPackageHeadSha, '9f99423355e0fb81938dbd0fc0a02437e8cb7ab9')
assert.equal(acceptance.history.retryTriggerPr, 843)

const retry = acceptance.productionRetry
assert.equal(retry.mainSha, '3a86ce414e4dcfd95d15b0e3bc6e93534c461ec7')
assert.equal(retry.workflowRunId, 31671344704)
assert.equal(retry.contractJobId, 94356427047)
assert.equal(retry.productionJobId, 94356487028)
assert.equal(retry.workflowConclusion, 'success')
assert.equal(retry.artifactId, 9170134736)
assert.equal(retry.artifactDigest, 'sha256:82cd5669e6ed4354d555620c71005ac8f80ff74c3a2f0ad4b1e136594c82cbf5')
assert.equal(retry.firstApply.tableStageStatementCount, 3)
assert.equal(retry.firstApply.indexStageStatementCount, 2)
assert.equal(retry.firstApply.totalStatementCount, 5)
assert.equal(retry.firstApply.workerWallMs, 1434)
assert.equal(retry.secondApply.statementCount, 0)
assert.equal(retry.aggregateRowsAfter, 0)
assert.equal(retry.providerLeakageRowsAfter, 0)
assert.equal(retry.temporaryWorkerDeleted, true)
assert.equal(retry.postDeleteHttpStatus, 404)
assert.equal(retry.artifactSerializationGap.acceptedDirectlyFromRetryArtifact, false)
assert.equal(retry.artifactSerializationGap.resolvedByIndependentPostApplyReadOnlyRevalidation, true)

const revalidation = acceptance.postApplyReadOnlyRevalidation
assert.equal(revalidation.sourceWorkflowRunId, 31670727423)
assert.equal(revalidation.runAttempt, 2)
assert.equal(revalidation.productionJobId, 94359547621)
assert.equal(revalidation.artifactId, 9170185311)
assert.equal(revalidation.artifactDigest, 'sha256:cc83ac7b7e82b2afba9afd1a5cd52846b94bf6696ac8c7885e36e3ecb9c81b9c')
assert.equal(revalidation.readOnly, true)
assert.equal(revalidation.schema.complete, true)
assert.equal(revalidation.schema.partial, false)
assert.equal(revalidation.aggregateRows.total, 0)
assert.equal(revalidation.providerLeakageRows, 0)
assert.equal(revalidation.latestSnapshot.collectedAt, '2026-08-13T06:00:40.134Z')
assert.equal(revalidation.latestSnapshot.streamCount, 100)
assert.equal(revalidation.latestSnapshot.sourceMode, 'authenticated')
assert.equal(revalidation.databaseSizeBytes, 341827584)
assert.equal(revalidation.databaseSizeDeltaFromRetryPreApplyBytes, 110592)
assert.ok(revalidation.databaseSizeDeltaFromRetryPreApplyBytes >= 0)
assert.ok(revalidation.databaseSizeDeltaFromRetryPreApplyBytes <= revalidation.emptySchemaSizeIncreaseLimitBytes)
assert.equal(revalidation.queryMetrics.rowsWritten, 0)
assert.equal(revalidation.queryMetrics.changes, 0)
assert.equal(revalidation.originalTemporaryWorkerPostCleanupHttpStatus, 404)
assert.equal(revalidation.diagnosticTemporaryWorkerPostDeleteHttpStatus, 404)

for (const name of [
  'history_category_daily',
  'history_category_day_status',
  'history_category_streamer_daily',
  'idx_history_category_daily_category_day',
  'idx_history_category_streamer_category_day',
]) assert.ok(revalidation.schema.presentObjects.includes(name), `accepted production object missing: ${name}`)
assert.equal(revalidation.schema.presentObjects.length, 5)

for (const key of [
  'exactRepairPackageIdentityPass',
  'exactRetryTriggerIdentityPass',
  'tableThenIndexStagePass',
  'firstApplyFiveStatementsPass',
  'secondApplyZeroStatementsPass',
  'schemaCompletePass',
  'schemaNotPartialPass',
  'aggregateRowsZeroPass',
  'providerLeakageZeroPass',
  'naturalSnapshotContinuityPass',
  'emptySchemaSizeIncreasePass',
  'temporaryWorkerCleanupPass',
  'postApplyReadOnlyRevalidationPass',
  'productionSchemaAcceptancePass',
]) assert.equal(acceptance.gates[key], true, `${key} must pass`)

for (const key of [
  'aggregateGeneratorEnabled',
  'collectorChanged',
  'newCronAdded',
  'backfillPerformed',
  'rawRetentionChanged',
  'historyApiCategoryEnabled',
  'historyCategoryUiEnabled',
  'twitchChanged',
  'crossProviderBehaviorChanged',
]) assert.equal(acceptance.boundaries[key], false, `${key} boundary must remain false`)

assert.equal(acceptance.authorization.kickHistoryCategoryAggregateSchemaAccepted, true)
assert.equal(acceptance.authorization.aggregateGeneratorDesignAuthorizedNext, true)
assert.equal(acceptance.authorization.aggregateGeneratorProductionEnablementAuthorized, false)
assert.equal(acceptance.authorization.historyApiCategoryAuthorized, false)
assert.equal(acceptance.authorization.historyCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.publicCutoverAuthorized, false)
assert.equal(acceptance.authorization.twitchRolloutAuthorized, false)

assert.equal(cleanDiagnosis.status, 'accepted_clean_absent_state')
assert.equal(cleanDiagnosis.conclusion.productionD1CleanForControlledRetry, true)
assert.equal(benchmark.benchmark.incrementalMiBWithSafety, 49.91)
assert.equal(benchmark.benchmark.designBudgetPass, true)

assert.ok(runtime.indexOf('const tableResults = await db.batch') < runtime.indexOf('const indexResults = await db.batch'))
assert.equal(trigger.status, 'consumed_success_retired')
assert.equal(trigger.productionRunId, 31671344704)
assert.equal(trigger.productionArtifactId, 9170134736)
assert.equal(trigger.postApplyReadOnlyArtifactId, 9170185311)

for (const workflow of [applyWorkflow, diagnosisWorkflow]) {
  assert.ok(workflow.includes('workflow_dispatch:'))
  assert.equal(/\n\s*push\s*:/.test(workflow), false, 'retired workflow must not run on push')
  assert.equal(/\n\s*pull_request\s*:/.test(workflow), false, 'retired workflow must not run on PR')
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false, 'retired workflow must not use production credentials')
}

console.log('Kick History category aggregate production schema accepted: repaired 3+2 DDL application succeeded, independent read-only revalidation confirms complete empty schema and healthy Kick collection, and one-time execution paths are retired.')
