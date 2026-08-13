import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const contract = json('docs/audits/12a15-kick-history-category-cost-probe-execution-contract.json')
const generator = json('docs/audits/12a15-kick-history-category-aggregate-generator-contract.json')
const schema = json('docs/audits/12a14-kick-history-category-schema-final-acceptance.json')
const workflow = read('.github/workflows/analytics-12a15-kick-history-category-cost-probe-execution.yml')
const probe = read('workers/history-category-aggregate-cost-probe/src/index.ts')
const probeConfig = read('workers/history-category-aggregate-cost-probe/wrangler.kick.toml')
const kickEntry = read('workers/collector-kick/src/entry.ts')
const kickConfig = read('workers/collector-kick/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a15-kick-history-category-cost-probe-execution-contract-v1')
assert.equal(contract.status, 'dormant_execution_package_candidate_no_production_trigger')
assert.equal(contract.phase, '12A-15')
assert.equal(contract.trackingIssue, 848)
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedAuthority.generatorPackagePr, 847)
assert.equal(contract.acceptedAuthority.generatorPackageHeadSha, '011edd9a90e7691a5514bd0fa6111f10c80ede30')
assert.equal(contract.acceptedAuthority.generatorPackageMergeSha, '44c3d9c51248e75240ca2eea6a179f0061f171b1')
assert.equal(contract.acceptedAuthority.productionSchemaAcceptancePr, 845)
assert.equal(generator.status, 'dormant_package_candidate_no_production_execution')
assert.equal(generator.authorization.temporaryCostProbeProductionExecutionAuthorized, false)
assert.equal(generator.authorization.permanentGeneratorEnablementAuthorized, false)
assert.equal(schema.status, 'accepted')
assert.equal(schema.authorization.kickHistoryCategoryAggregateSchemaAccepted, true)
assert.equal(schema.authorization.aggregateGeneratorProductionEnablementAuthorized, false)

assert.equal(contract.temporaryWorker.name, 'viewloom-history-category-aggregate-cost-probe-kick')
assert.equal(contract.temporaryWorker.databaseName, 'vl_kick_hot')
assert.equal(contract.temporaryWorker.provider, 'kick')
assert.equal(contract.temporaryWorker.confirmation, 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE')
assert.equal(contract.temporaryWorker.scheduledHandlerAvailable, false)
assert.equal(contract.temporaryWorker.collectorRouteAvailable, false)
assert.equal(contract.temporaryWorker.permanentGeneratorEnabled, false)
assert.equal(contract.trigger.separateOneFilePrRequired, true)
assert.equal(contract.trigger.productionExecutionArmedByThisPackage, false)
assert.equal(contract.execution.probeDay, 'current_utc_day_only')
assert.equal(contract.execution.postCleanupAggregateRowsRequired, 0)
assert.equal(contract.execution.temporaryWorkerMustBeDeleted, true)
assert.equal(contract.execution.postDeleteHttpStatusRequired, 404)
assert.equal(contract.execution.permanentGeneratorEnablementIncluded, false)

const thresholds = contract.acceptanceThresholds
assert.equal(thresholds.generatorStatementsMax, 7)
assert.equal(thresholds.totalProbeStatementsMax, 40)
assert.equal(thresholds.totalProbeRowsReadMax, 250000)
assert.equal(thresholds.totalProbeRowsWrittenMax, 5000)
assert.equal(thresholds.totalProbeChangesMax, 3000)
assert.equal(thresholds.workerWallMsMax, 20000)
assert.equal(thresholds.databaseSizeIncreaseAfterCleanupBytesMax, 1048576)
assert.equal(thresholds.latestSnapshotFreshnessMinutesMax, 20)
assert.equal(thresholds.providerLeakageRowsMax, 0)
assert.equal(thresholds.cleanupRemainingRowsMax, 0)
assert.equal(thresholds.temporaryWorkerPostDeleteHttpStatus, 404)

for (const fragment of [
  "day !== new Date().toISOString().slice(0, 10)",
  "error: 'probe_day_must_equal_current_utc_day'",
  'targetAggregateRowsZero: pre.aggregateRows.total === 0',
  'categoryMetadataComplete:',
  'candidateCategoryRows <= HISTORY_CATEGORY_ROW_CAP',
  'candidateStreamerCategoryRows <= HISTORY_CATEGORY_STREAMER_ROW_CAP',
  'refreshKickHistoryCategoryAggregateDay(db, day, { startDay: day })',
  'cleanupKickHistoryCategoryProbeDay(db, day)',
  'postTargetRowsZero: post.aggregateRows.total === 0',
  'providerLeakageZero: post.providerLeakageRows === 0',
  'permanentGeneratorStillDisabled: true',
]) assert.ok(probe.includes(fragment), `accepted probe behavior missing: ${fragment}`)
assert.equal(/scheduled\s*\(/.test(probe), false)
assert.equal(probe.includes('/collect'), false)
assert.ok(probeConfig.includes('name = "viewloom-history-category-aggregate-cost-probe-kick"'))
assert.ok(probeConfig.includes('database_name = "vl_kick_hot"'))
assert.equal(probeConfig.includes('vl_twitch_hot'), false)
assert.equal(probeConfig.includes('[triggers]'), false)

for (const fragment of [
  "push:\n    branches: [main]\n    paths:\n      - 'docs/audits/12a15-kick-history-category-cost-probe-trigger.json'",
  "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
  "service='viewloom-history-category-aggregate-cost-probe-kick'",
  "RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE",
  "expectedGeneratorPackageHeadSha' \"$TRIGGER_FILE\") == '011edd9a90e7691a5514bd0fa6111f10c80ede30'",
  "! grep -q 'maybeGenerateKickHistoryCategoryAggregates' workers/collector-kick/src/entry.ts",
  "! grep -q 'HISTORY_CATEGORY' workers/collector-kick/wrangler.toml",
  "stage='pre_inspect'",
  "stage='run_probe'",
  "stage='post_cleanup_inspect'",
  "stage='delete_temporary_worker'",
  'generator_statements=',
  'total_statements=',
  'total_rows_read=',
  'total_rows_written=',
  'total_changes=',
  'size_delta=$((post_size-pre_size))',
  '[[ "$generator_statements" -le 7 ]]',
  '[[ "$total_statements" -le 40 ]]',
  '[[ "$total_rows_read" -le 250000 ]]',
  '[[ "$total_rows_written" -le 5000 ]]',
  '[[ "$total_changes" -le 3000 ]]',
  '[[ "$size_delta" -le 1048576 ]]',
  "post_delete_status=$(curl",
  '[[ "$post_delete_status" == \'404\' ]]',
  'write_failure_evidence',
  'Upload sanitized cost evidence',
]) assert.ok(workflow.includes(fragment), `execution workflow boundary missing: ${fragment}`)

if (existsSync(contract.trigger.file)) {
  const trigger = json(contract.trigger.file)
  assert.ok(
    ['armed_for_one_time_main_push', 'consumed_success_retired'].includes(trigger.status),
    `unexpected trigger lifecycle status: ${trigger.status}`,
  )
  assert.equal(trigger.provider, 'kick')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.confirmation, 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE')
  assert.equal(trigger.acceptedGeneratorPackagePr, 847)
  assert.equal(trigger.expectedGeneratorPackageHeadSha, '011edd9a90e7691a5514bd0fa6111f10c80ede30')
  assert.ok(Number.isInteger(trigger.executionPackagePr) && trigger.executionPackagePr > 0)
  assert.match(String(trigger.expectedExecutionPackageHeadSha ?? ''), /^[0-9a-f]{40}$/)
}

assert.equal(kickEntry.includes('maybeGenerateKickHistoryCategoryAggregates'), false, 'permanent generator must remain unintegrated')
assert.equal(kickConfig.includes('HISTORY_CATEGORY'), false, 'permanent generator runtime flag must remain absent')
assert.equal(kickConfig.includes('crons = ["*/5 * * * *"]'), true, 'existing Kick collector cadence must remain unchanged')

for (const key of [
  'productionProbeExecutedNow',
  'permanentGeneratorEnablementAuthorized',
  'collectorIntegrationAuthorized',
  'collectorDeploymentAuthorized',
  'newCronAuthorized',
  'backfillAuthorized',
  'rawRetentionChangeAuthorized',
  'historyApiCategoryAuthorized',
  'historyCategoryUiAuthorized',
  'publicCutoverAuthorized',
  'twitchRolloutAuthorized',
  'crossProviderBehaviorAuthorized',
]) assert.equal(contract.authorization[key], false, `${key} must remain false`)
assert.equal(contract.authorization.repositoryExecutionPackageAuthorized, true)
assert.equal(contract.authorization.separateOneTimeTriggerAuthorizedAfterPackageAcceptance, true)

console.log('Kick History category cost-probe execution package verified: exact generator package is pinned; trigger lifecycle is accepted only when exact one-time metadata is present; current-day zero-row preconditions and cleanup are enforced; permanent runtime/Twitch boundaries remain closed.')
