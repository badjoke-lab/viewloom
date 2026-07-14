import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'viewloom-12a4-schema-evidence-'))
const raw = path.join(temp, 'raw')
fs.mkdirSync(raw, { recursive: true })

const packageHeadSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const packageMergeSha = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
const triggerHeadSha = 'cccccccccccccccccccccccccccccccccccccccc'

write('trigger.json', {
  schemaVersion: 'viewloom-12a4-category-controlled-schema-apply-trigger-v1',
  status: 'armed_for_one_time_main_push',
  trackingIssue: 519,
  designPr: 528,
  packagePr: 529,
  expectedPackageHeadSha: packageHeadSha,
  confirmation: 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED',
  providerOrder: ['twitch', 'kick'],
  oneTime: true,
  boundaries: falseBoundaries(),
})
write('design-pr.json', {
  merged_at: '2026-07-14T09:20:00Z',
  merge_commit_sha: '21be04c8532d9b20ec22f29af6658a2d926b78a1',
})
write('package-pr.json', {
  merged_at: '2026-07-14T09:30:00Z',
  merge_commit_sha: packageMergeSha,
  head: { sha: packageHeadSha },
})
fs.writeFileSync(path.join(raw, 'head-sha.txt'), `${triggerHeadSha}\n`)
fs.writeFileSync(path.join(raw, 'event-name.txt'), 'push\n')

for (const provider of ['twitch', 'kick']) writeProvider(provider)
write('execution-status.json', {
  providers: {
    twitch: { attempted: true },
    kick: { attempted: true },
  },
})

const successEvidence = path.join(temp, 'success-evidence.json')
run('scripts/collect-12a4-category-controlled-schema-apply-evidence.mjs', [raw, successEvidence])
run('scripts/verify-12a4-category-controlled-schema-apply-evidence.mjs', [successEvidence, '--require-pass'])
const success = JSON.parse(fs.readFileSync(successEvidence, 'utf8'))
assert.equal(success.status, 'observed_pass')
assert.equal(success.gate.controlledSchemaApplyPass, true)
assert.equal(success.providers.twitch.measurements.schemaApplyStatementCount, 9)
assert.equal(success.providers.kick.measurements.secondPassStatementCount, 0)
assert.equal(success.providers.twitch.measurements.collectorLatencyDeltaMs, 0)

const twitchLifecycle = read('twitch-lifecycle.json')
twitchLifecycle.deleteHttpStatus = 500
write('twitch-lifecycle.json', twitchLifecycle)
for (const name of ['kick-pre.json', 'kick-first-apply.json', 'kick-second-apply.json', 'kick-post.json', 'kick-lifecycle.json']) {
  fs.rmSync(path.join(raw, name), { force: true })
}
write('execution-status.json', {
  stopReason: 'stop_after_twitch_failure',
  providers: {
    twitch: { attempted: true },
    kick: { attempted: false },
  },
})

const failureEvidence = path.join(temp, 'failure-evidence.json')
run('scripts/collect-12a4-category-controlled-schema-apply-evidence.mjs', [raw, failureEvidence])
run('scripts/verify-12a4-category-controlled-schema-apply-evidence.mjs', [failureEvidence])
const failure = JSON.parse(fs.readFileSync(failureEvidence, 'utf8'))
assert.equal(failure.status, 'observed_failure')
assert.equal(failure.gate.controlledSchemaApplyPass, false)
assert.equal(failure.providers.twitch.providerGatePass, false)
assert.equal(failure.providers.kick.attempted, false)

const requirePassFailure = spawnSync(
  process.execPath,
  ['scripts/verify-12a4-category-controlled-schema-apply-evidence.mjs', failureEvidence, '--require-pass'],
  { cwd: root, encoding: 'utf8' },
)
assert.notEqual(requirePassFailure.status, 0)

console.log(JSON.stringify({
  ok: true,
  successFixturePass: true,
  failureFixturePreserved: true,
  failureRequirePassRejected: true,
}, null, 2))

function writeProvider(provider) {
  const healthSource = provider === 'twitch' ? 'collector_status' : 'latest_snapshot'
  const beforeSize = provider === 'twitch' ? 1000000 : 2000000
  const afterSize = beforeSize + 1024
  const preState = state(provider, healthSource, false, beforeSize, '2026-07-14T09:05:00Z', '2026-07-14T09:00:00Z')
  const immediatePost = state(provider, healthSource, true, afterSize, '2026-07-14T09:05:00Z', '2026-07-14T09:00:00Z')
  const naturalPost = state(provider, healthSource, true, afterSize, '2026-07-14T09:10:00Z', '2026-07-14T09:05:00Z')
  const absentSchema = schema(false)
  const completeSchema = schema(true)

  write(`${provider}-pre.json`, { ok: true, provider, state: preState })
  write(`${provider}-first-apply.json`, {
    ok: true,
    provider,
    pre: preState,
    apply: {
      attempted: true,
      applied: true,
      reason: 'applied',
      pre: absentSchema,
      post: completeSchema,
      metrics: {
        statementCount: 9,
        durationMs: 12.5,
        rowsRead: 0,
        rowsWritten: 0,
        changes: 0,
        sizeAfter: afterSize,
      },
    },
    post: immediatePost,
    workerWallMs: 1200,
  })
  write(`${provider}-second-apply.json`, {
    ok: true,
    provider,
    pre: immediatePost,
    apply: {
      attempted: true,
      applied: false,
      reason: 'already-complete',
      pre: completeSchema,
      post: completeSchema,
      metrics: {
        statementCount: 0,
        durationMs: 0,
        rowsRead: 0,
        rowsWritten: 0,
        changes: 0,
        sizeAfter: afterSize,
      },
    },
    post: immediatePost,
    workerWallMs: 50,
  })
  write(`${provider}-post.json`, { ok: true, provider, state: naturalPost })
  write(`${provider}-lifecycle.json`, {
    preExistingCurlExitCode: 0,
    preExistingHttpStatus: 404,
    deployExitCode: 0,
    secretExitCode: 0,
    preCurlExitCode: 0,
    preHttpStatus: 200,
    firstCurlExitCode: 0,
    firstHttpStatus: 200,
    secondCurlExitCode: 0,
    secondHttpStatus: 200,
    pollSucceeded: true,
    pollAttempts: 2,
    deleteExitCode: 0,
    deleteCurlExitCode: 0,
    deleteHttpStatus: 404,
  })
}

function state(provider, healthSource, complete, databaseSizeBytes, latestAt, previousAt) {
  return {
    schema: schema(complete),
    operational: {
      healthSource,
      healthEvidenceAvailable: true,
      latestSnapshot: snapshot(latestAt),
      previousSnapshot: snapshot(previousAt),
      collectorStatus: provider === 'twitch' ? {
        status: 'ok',
        last_success_at: latestAt,
      } : null,
    },
    providerLeakageRows: 0,
    categoryDictionaryRows: 0,
    reservedProbeRows: 0,
    databaseSizeBytes,
    query: {
      statements: complete ? 5 : 4,
      durationMs: 4,
      rowsRead: 100,
      rowsWritten: 0,
      changes: 0,
      sizeAfter: databaseSizeBytes,
    },
  }
}

function schema(complete) {
  return complete ? {
    dictionaryTablePresent: true,
    presentRollupColumns: [
      'category_contract_version',
      'category_hourly_json',
      'category_missing_samples',
      'category_observed_samples',
    ],
    presentStatusColumns: [
      'category_coverage_state',
      'category_missing_samples',
      'category_observed_samples',
      'category_observed_streamers',
    ],
    complete: true,
    absent: false,
    partial: false,
  } : {
    dictionaryTablePresent: false,
    presentRollupColumns: [],
    presentStatusColumns: [],
    complete: false,
    absent: true,
    partial: false,
  }
}

function snapshot(collectedAt) {
  return {
    bucket_minute: collectedAt,
    collected_at: collectedAt,
    stream_count: 100,
    total_viewers: 100000,
    source_mode: 'real',
  }
}

function falseBoundaries() {
  return {
    remoteMigrationApply: false,
    categoryRuntimeEnablement: false,
    productionCategoryRows: false,
    newCron: false,
    backfill: false,
    rawRetentionChange: false,
    categoryAnalyticsUi: false,
    crossProviderCategoryIdentity: false,
    combinedProviderCategoryRanking: false,
  }
}

function write(name, value) {
  fs.writeFileSync(path.join(raw, name), `${JSON.stringify(value, null, 2)}\n`)
}

function read(name) {
  return JSON.parse(fs.readFileSync(path.join(raw, name), 'utf8'))
}

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    process.stderr.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error(`${script} failed with ${result.status}`)
  }
}
