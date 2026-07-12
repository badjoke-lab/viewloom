#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/12a3-postmerge/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const contract = JSON.parse(readFileSync('docs/audits/12a3-postmerge-acceptance-contract.json', 'utf8'))

assert.equal(evidence.schemaVersion, 'viewloom-12a3-postmerge-acceptance-evidence-v1')
assert.equal(evidence.workstream, contract.workstream)
assert.ok(['observed', 'accepted'].includes(evidence.status))
assert.equal(evidence.merge.sha, contract.merge.sha)
assert.equal(evidence.providerSeparated, true)

const deployment = evidence.deployment
assert.equal(deployment.workflow, contract.deployment.workflow)
assert.equal(deployment.event, contract.deployment.event)
assert.equal(deployment.headSha, contract.merge.sha)
assert.equal(deployment.status, 'completed')
assert.equal(deployment.conclusion, contract.deployment.requiredConclusion)
assert.equal(deployment.gatePass, true)
assert.ok(Number.isInteger(deployment.runId) && deployment.runId > 0)
const jobs = new Map((deployment.jobs ?? []).map((job) => [job.name, job.conclusion]))
for (const name of contract.deployment.requiredJobs) {
  assert.equal(jobs.get(name), 'success', `deployment job failed or missing: ${name}`)
}

const minimum = Date.parse(contract.naturalMaintenance.minimumRefreshedAt)
for (const provider of ['twitch', 'kick']) {
  const row = evidence.providers[provider]
  const providerContract = contract.providers[provider]
  assert.equal(row.status, 'observed')
  assert.deepEqual(row.lifecycle, {
    deployExitCode: 0,
    runExitCode: 0,
    runCurlExitCode: 0,
    runHttpStatus: 200,
    deleteExitCode: 0,
    deleteCurlExitCode: 0,
    deleteHttpStatus: 200,
  })
  assert.equal(row.config.streamerCap, providerContract.streamerCap)
  assert.equal(row.days.length, contract.acceptance.expectedDaysPerProvider)
  for (const day of row.days) {
    assert.match(day.day, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(day.sourceSnapshots > 0)
    assert.ok(day.retainedStreamers > 0)
    assert.ok(day.retainedStreamers <= providerContract.streamerCap)
    assert.equal(day.retainedStreamerCap, providerContract.streamerCap)
    assert.equal(day.rollupRows, day.retainedStreamers)
    assert.equal(day.distinctRanks, day.rollupRows)
    assert.equal(day.minimumRank, 1)
    assert.equal(day.maximumRank, day.rollupRows)
    assert.ok(day.totalViewerMinutes > 0)
    assert.ok(day.totalSampleCount > 0)
    assert.ok(day.hourlyPayloadBytes > 0)
    assert.equal(day.contractVersion, contract.acceptance.contractVersion)
    assert.ok(Date.parse(day.refreshedAt) >= minimum, `${provider}/${day.day}: status not refreshed after production window`)
    assert.ok(Date.parse(day.minimumUpdatedAt) >= minimum, `${provider}/${day.day}: some rollup rows predate production window`)
    assert.ok(Date.parse(day.maximumUpdatedAt) >= minimum, `${provider}/${day.day}: rollup rows not refreshed after production window`)
  }
  for (const value of Object.values(row.checks)) assert.equal(value, true, `${provider}: post-merge check failed`)
  assert.equal(row.boundaries.readOnly, true)
  assert.equal(row.boundaries.streamerIdentitiesIncluded, false)
  assert.equal(row.boundaries.crossProviderAggregation, false)
  assert.equal(row.boundaries.sourceRowsModified, false)
  assert.equal(row.providerGatePass, true)
}

assert.equal(evidence.gate.deploymentPass, true)
assert.equal(evidence.gate.twitchPass, true)
assert.equal(evidence.gate.kickPass, true)
assert.equal(evidence.gate.postMergeAccumulationPass, true)
for (const value of Object.values(evidence.privacy)) assert.equal(value, false)
assert.equal(evidence.boundaries.readOnly, true)
for (const key of [
  'sourceRowsModified',
  'backfillPerformed',
  'newCronAdded',
  'manualCollectorRouteUsed',
  'temporaryGeneratorUsed',
  'crossProviderAnalyticsIncluded',
  'temporaryVerifiersRetained',
]) assert.equal(evidence.boundaries[key], false)

const serialized = JSON.stringify(evidence)
for (const forbidden of [
  'streamer_id',
  'display_name',
  'channelLogin',
  'database_id',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'VERIFY_TOKEN',
]) assert.equal(serialized.includes(forbidden), false, `forbidden value in sanitized evidence: ${forbidden}`)

console.log('12A-3 post-merge accumulation evidence verification passed.')
console.log(`- deployment run: ${deployment.runId}`)
for (const provider of ['twitch', 'kick']) {
  console.log(`- ${provider}: rows=${evidence.providers[provider].days.map((day) => day.rollupRows).join(',')} refreshed=${evidence.providers[provider].days.map((day) => day.refreshedAt).join(',')}`)
}
