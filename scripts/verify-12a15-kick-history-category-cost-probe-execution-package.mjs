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
const triggerPath = 'docs/audits/12a15-kick-history-category-cost-probe-trigger.json'
const failureEvidencePath = 'docs/audits/12a15-kick-history-category-cost-probe-production-failure.json'

assert.equal(contract.schemaVersion, 'viewloom-12a15-kick-history-category-cost-probe-execution-contract-v1')
assert.equal(contract.phase, '12A-15')
assert.equal(contract.trackingIssue, 848)
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedAuthority.generatorPackagePr, 847)
assert.equal(contract.acceptedAuthority.generatorPackageHeadSha, '011edd9a90e7691a5514bd0fa6111f10c80ede30')
assert.equal(contract.acceptedAuthority.productionSchemaAcceptancePr, 845)
assert.equal(contract.acceptanceThresholds.generatorStatementsMax, 7)
assert.equal(contract.acceptanceThresholds.totalProbeStatementsMax, 40)
assert.equal(contract.acceptanceThresholds.totalProbeRowsReadMax, 250000)
assert.equal(contract.acceptanceThresholds.totalProbeRowsWrittenMax, 5000)
assert.equal(contract.acceptanceThresholds.totalProbeChangesMax, 3000)
assert.equal(contract.acceptanceThresholds.workerWallMsMax, 20000)
assert.equal(contract.acceptanceThresholds.databaseSizeIncreaseAfterCleanupBytesMax, 1048576)
assert.equal(contract.acceptanceThresholds.providerLeakageRowsMax, 0)
assert.equal(contract.acceptanceThresholds.cleanupRemainingRowsMax, 0)

assert.equal(generator.authorization.permanentGeneratorEnablementAuthorized, false)
assert.equal(schema.authorization.aggregateGeneratorProductionEnablementAuthorized, false)
assert.equal(kickEntry.includes('maybeGenerateKickHistoryCategoryAggregates'), false)
assert.equal(kickConfig.includes('HISTORY_CATEGORY'), false)
assert.equal(kickConfig.includes('crons = ["*/5 * * * *"]'), true)

assert.ok(probe.includes("day !== new Date().toISOString().slice(0, 10)"))
assert.ok(probe.includes('cleanupKickHistoryCategoryProbeDay(db, day)'))
assert.equal(/scheduled\s*\(/.test(probe), false)
assert.equal(probe.includes('/collect'), false)
assert.ok(probeConfig.includes('name = "viewloom-history-category-aggregate-cost-probe-kick"'))
assert.ok(probeConfig.includes('database_name = "vl_kick_hot"'))
assert.equal(probeConfig.includes('vl_twitch_hot'), false)
assert.equal(probeConfig.includes('[triggers]'), false)

// The one-shot production workflow is retired after run 31769000044 exposed a false-green.
assert.ok(workflow.includes('name: Analytics 12A15 Kick History Category Cost Probe Retired'))
assert.ok(workflow.includes('pull_request:'))
for (const forbidden of [
  '\n  push:',
  'production-cost-probe:',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  "github.event_name == 'push'",
  'secret put PROBE_TOKEN',
  '/workers/services/',
  'actions/upload-artifact',
  'Execute bounded current-day cost probe',
]) {
  assert.equal(workflow.includes(forbidden), false, `retired workflow still exposes production path: ${forbidden}`)
}
assert.ok(workflow.includes('Cloudflare credentials reachable from this workflow: no'))
assert.ok(workflow.includes('843,288 > 250,000 limit'))
assert.ok(workflow.includes('Permanent generator enablement: unauthorized'))

const trigger = json(triggerPath)
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.acceptedGeneratorPackagePr, 847)
assert.equal(trigger.expectedGeneratorPackageHeadSha, '011edd9a90e7691a5514bd0fa6111f10c80ede30')
assert.equal(trigger.executionPackagePr, 849)
assert.equal(trigger.expectedExecutionPackageHeadSha, 'ab99777dacaa1826d2a38a78a28add07586e571e')
assert.ok(
  ['armed_for_one_time_main_push', 'consumed_performance_failed_retired'].includes(trigger.status),
  `unexpected trigger lifecycle state: ${trigger.status}`,
)

if (existsSync(failureEvidencePath)) {
  const evidence = json(failureEvidencePath)
  assert.equal(trigger.status, 'consumed_performance_failed_retired')
  assert.equal(evidence.schemaVersion, 'viewloom-12a15-kick-history-category-cost-probe-failure-v1')
  assert.equal(evidence.status, 'performance_failed_cleanup_safe')
  assert.equal(evidence.provider, 'kick')
  assert.equal(evidence.productionRun, 31769000044)
  assert.equal(evidence.productionJob, 94670847874)
  assert.equal(evidence.artifactId, 9207424532)
  assert.equal(evidence.artifactDigest, 'sha256:bb4395e82d276d9de941cd553b6105d54e906f284de7636cb71b6f06cf550cad')
  assert.equal(evidence.measured.generatorStatements, 7)
  assert.equal(evidence.measured.totalProbeStatements, 31)
  assert.equal(evidence.measured.totalProbeRowsRead, 843288)
  assert.equal(evidence.thresholds.totalProbeRowsReadMax, 250000)
  assert.ok(evidence.measured.totalProbeRowsRead > evidence.thresholds.totalProbeRowsReadMax)
  assert.equal(evidence.measured.totalProbeRowsWritten, 1592)
  assert.equal(evidence.measured.totalProbeChanges, 797)
  assert.equal(evidence.measured.workerWallMs, 4682)
  assert.equal(evidence.measured.databaseSizeIncreaseAfterCleanupBytes, 0)
  assert.equal(evidence.cleanup.aggregateRows, 0)
  assert.equal(evidence.cleanup.providerLeakageRows, 0)
  assert.equal(evidence.cleanup.temporaryWorkerDeleted, true)
  assert.equal(evidence.cleanup.postDeleteHttpStatus, 404)
  assert.equal(evidence.acceptance.performanceAccepted, false)
  assert.equal(evidence.acceptance.permanentGeneratorEnablementAuthorized, false)
  assert.equal(evidence.falseGreen.githubJobConclusion, 'success')
  assert.equal(evidence.falseGreen.artifactReportedStatus, 'pass')
  assert.equal(evidence.falseGreen.authoritativeInterpretation, 'performance_failure')
} else {
  // Temporary state between execution-path retirement and evidence freeze.
  assert.equal(trigger.status, 'armed_for_one_time_main_push')
}

console.log('Kick History category cost-probe execution path verified retired: no push/Cloudflare production path remains; run 31769000044 is not accepted because 843,288 rows read exceeds the 250,000 gate; permanent generator enablement remains unauthorized.')
