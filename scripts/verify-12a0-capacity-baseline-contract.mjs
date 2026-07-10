#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'docs/audits/12a0-capacity-baseline-contract.json'
const contract = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-12a0-capacity-baseline-contract-v1')
assert.equal(contract.workstream, '12A-0 current data and capacity baseline')
assert.equal(contract.status, 'active')
assert.equal(contract.evidenceSchemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(contract.origin, 'https://vl.badjoke-lab.com')
assert.equal(contract.evidenceMode, 'read-only-production-observation')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.runtimeChanged, false)

assert.equal(contract.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(contract.providers.twitch.database, 'vl_twitch_hot')
assert.equal(contract.providers.twitch.rawRetentionDays, 30)
assert.equal(contract.providers.twitch.dailyRollupRetentionDays, 180)
assert.equal(contract.providers.twitch.expectedCadenceSeconds, 300)
assert.equal(contract.providers.twitch.expectedProductionSourceMode, 'real')

assert.equal(contract.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(contract.providers.kick.database, 'vl_kick_hot')
assert.equal(contract.providers.kick.rawRetentionDays, 60)
assert.equal(contract.providers.kick.dailyRollupRetentionDays, 180)
assert.equal(contract.providers.kick.expectedCadenceSeconds, 300)
assert.equal(contract.providers.kick.expectedProductionSourceMode, 'authenticated')
assert.equal(contract.providers.kick.expectedCoverageMode, 'official-livestreams')

assert.ok(Array.isArray(contract.requiredEvidence) && contract.requiredEvidence.length >= 17)
assert.equal(contract.timingTargets.length, 9)
assert.equal(contract.dailyRollupEvidence.windowCountPerProvider, 2)
assert.equal(contract.dailyRollupEvidence.maximumDaysPerWindow, 90)
assert.equal(contract.dailyRollupEvidence.windowsMustNotOverlap, true)
assert.equal(contract.dailyRollupEvidence.requiredReadPath, 'daily_rollups')
assert.equal(contract.dailyRollupEvidence.missingCalendarDaysCountAsObservedRollupRows, false)

assert.equal(contract.collectorDurationBoundary.currentMeasurementStatus, 'not_persisted')
assert.equal(contract.collectorDurationBoundary.accepted12A0Proxy, 'bucket_completion_offset_seconds')
assert.equal(contract.collectorDurationBoundary.proxyMustNotBeClaimedAsPureExecutionDuration, true)
assert.equal(contract.collectorDurationBoundary.trueDurationFollowUpOwner, '12A-3 bounded intraday rollup generation')

assert.equal(contract.completionRules.permanentMachineReadableEvidenceRequired, true)
assert.equal(contract.completionRules.storageAndQueryBudgetsRequiredBeforeMigration, true)
assert.equal(contract.completionRules.providerSeparationRequired, true)
assert.equal(contract.completionRules.runtimeChangeAllowed, false)
assert.equal(contract.completionRules.migrationAuthorizedByBaselineAlone, false)

console.log('12A-0 capacity baseline contract verification passed.')
