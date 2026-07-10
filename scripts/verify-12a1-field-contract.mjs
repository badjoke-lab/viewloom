#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const contractPath = process.argv[2] || 'docs/audits/12a1-analytics-field-contract.json'
const sourcePath = process.argv[3] || 'docs/audits/12a1-source-evidence.json'

const contract = JSON.parse(readFileSync(contractPath, 'utf8'))
const source = JSON.parse(readFileSync(sourcePath, 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-analytics-field-contract-v1')
assert.equal(contract.workstream, '12A-1 analytics field contract')
assert.equal(contract.status, 'current')
assert.equal(contract.contractVersion, 'analytics-source-v1')
assert.equal(contract.providerSeparated, true)
assert.equal(contract.migrationIncluded, false)
assert.equal(contract.runtimeCaptureChangeIncluded, false)

assert.equal(source.schemaVersion, 'viewloom-12a1-source-evidence-v1')
assert.equal(source.workstream, contract.workstream)
assert.equal(source.status, 'current')
assert.equal(source.baselineAuthority, contract.baselineAuthority)

for (const provider of ['twitch', 'kick']) {
  assert.ok(contract.purposes.baseline[provider], `${provider}: baseline contract missing`)
  assert.ok(Array.isArray(contract.purposes.baseline[provider].required), `${provider}: required baseline fields missing`)
  for (const field of ['channel_key', 'display_name', 'viewer_count', 'bucket_minute', 'collected_at', 'source_mode', 'coverage_state']) {
    assert.ok(contract.purposes.baseline[provider].required.includes(field), `${provider}: missing baseline field ${field}`)
  }
}

assert.ok(contract.purposes.baseline.twitch.required.includes('covered_pages'))
assert.ok(contract.purposes.baseline.twitch.required.includes('has_more'))
assert.ok(contract.purposes.baseline.kick.required.includes('target_source'))
assert.ok(contract.purposes.baseline.kick.required.includes('coverage_mode'))
assert.equal(contract.purposes.baseline.twitch.channelKeySource, 'channelLogin')
assert.equal(contract.purposes.baseline.kick.channelKeySource, 'slug')

const observedRun = contract.purposes.observedRun
for (const field of ['channel_key', 'bucket_minute', 'viewer_count', 'observation_coverage_state']) {
  assert.ok(observedRun.commonRequired.includes(field), `observed-run field missing: ${field}`)
}
assert.equal(observedRun.derivedBoundaries.boundaryEvidenceStrength, 'observation_derived')
assert.equal(observedRun.derivedBoundaries.exactSessionBoundaryClaimAllowed, false)

assert.equal(observedRun.twitch.providerStartedAt.internalField, 'provider_started_at')
assert.equal(observedRun.twitch.providerStartedAt.retentionDecision, 'approved_for_future_capture')
assert.equal(observedRun.twitch.providerStartedAt.evidenceStrength, 'provider_reported_start_time')
assert.equal(observedRun.twitch.providerStartedAt.exactSessionStartClaimAllowed, false)

assert.equal(observedRun.kick.providerStartedAt.internalField, 'provider_started_at')
assert.equal(observedRun.kick.providerStartedAt.retentionDecision, 'unapproved_until_source_verification')
assert.equal(observedRun.kick.providerStartedAt.availability, 'unavailable')
assert.equal(observedRun.kick.providerStartedAt.exactSessionStartClaimAllowed, false)

const normalizedCategoryFields = contract.purposes.category.normalizedInternalFields
for (const field of [
  'category_provider_id',
  'category_name',
  'category_source',
  'category_observed_at',
  'category_evidence_strength',
  'category_contract_version',
]) assert.ok(normalizedCategoryFields.includes(field), `category field missing: ${field}`)

assert.equal(contract.purposes.category.twitch.captureApproved, false)
assert.equal(contract.purposes.category.kick.captureApproved, false)
assert.equal(contract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)

assert.equal(source.providers.twitch.startedAt.upstreamField, 'started_at')
assert.equal(source.providers.twitch.startedAt.codePathStatus, 'fetched_used_then_discarded')
assert.equal(source.providers.twitch.startedAt.currentRetention, false)
assert.equal(source.providers.twitch.startedAt.futureRetentionDecision, 'approved')
assert.equal(source.providers.twitch.startedAt.evidenceStrength, 'provider_reported_start_time')
assert.equal(source.providers.twitch.startedAt.exactSessionStartClaimAllowed, false)
assert.equal(source.providers.twitch.startedAt.exactSessionEndClaimAllowed, false)
assert.equal(source.providers.twitch.startedAt.sessionIdentityClaimAllowed, false)

assert.equal(source.providers.kick.category.currentCollectorRetention, false)
assert.equal(source.providers.kick.category.primaryPathVerificationStatus, 'unverified')
assert.equal(source.providers.kick.category.captureApproved, false)
assert.match(source.providers.kick.category.approvalRule, /live primary official-livestreams sample/i)
assert.equal(source.providers.kick.startedAt.currentPrimaryPathFieldVerified, false)
assert.equal(source.providers.kick.startedAt.futureRetentionDecision, 'unapproved')

assert.equal(source.crossProviderIdentity.categoryIdentityEquivalenceAllowed, false)
assert.equal(source.crossProviderIdentity.channelIdentityEquivalenceAllowed, false)
assert.equal(source.crossProviderIdentity.sessionIdentityEquivalenceAllowed, false)

const unsupported = new Map(contract.unsupportedFields.map((row) => [row.field, row]))
for (const field of [
  'exact_session_id',
  'authoritative_stream_end_at',
  'authoritative_offline_state',
  'unique_viewers',
  'exact_creator_revenue',
]) {
  const row = unsupported.get(field)
  assert.ok(row, `unsupported field missing: ${field}`)
  assert.equal(row.twitch, 'unavailable')
  assert.equal(row.kick, 'unavailable')
}

assert.equal(contract.sourceContractVersioning.current, 'analytics-source-v1')
assert.ok(contract.sourceContractVersioning.breakingChangesRequireVersionBump.includes('coverage model change'))
assert.ok(contract.sourceContractVersioning.breakingChangesRequireVersionBump.includes('category identity semantic change'))
assert.ok(contract.nextMigrationInputs['12A2MustNotAssume'].includes('exact session boundaries'))
assert.ok(contract.nextMigrationInputs['12A2MustNotAssume'].includes('category capture approval'))
assert.ok(contract.nextMigrationInputs['12A2MustNotAssume'].includes('cross-provider category identity equivalence'))

assert.equal(contract.completion.fieldContractPermanent, true)
assert.equal(contract.completion.unsupportedFieldsExplicit, true)
assert.equal(contract.completion.providerDifferencesDocumented, true)
assert.equal(contract.completion.twitchStartedAtDecisionMade, true)
assert.equal(contract.completion.kickCategoryCaptureApproved, false)
assert.equal(contract.completion.kickCategoryUnapprovedStateExplicit, true)
assert.equal(contract.completion.migrationPerformed, false)
assert.equal(contract.completion.runtimeCaptureChanged, false)

const humanContract = readFileSync('docs/product/analytics-field-contract-v1.md', 'utf8')
for (const fragment of [
  'provider_reported_start_time',
  'observation-derived boundaries',
  'primary-path category shape: unverified',
  'capture approved: no',
  'analytics-source-v1',
  '12A-2 must not assume',
]) assert.ok(humanContract.includes(fragment), `human contract missing: ${fragment}`)

const kickProbe = readFileSync('workers/collector-kick/scripts/probe-kick-official-livestreams.mjs', 'utf8')
for (const fragment of [
  'categoryEvidence',
  'rowsWithCategoryId',
  'rowsWithCategoryName',
  'topLevelCategoryKeysObserved',
  'nestedCategoryKeysObserved',
]) assert.ok(kickProbe.includes(fragment), `Kick probe missing category evidence field: ${fragment}`)

console.log('12A-1 analytics field contract verification passed.')
console.log('- field contract: analytics-source-v1')
console.log('- Twitch provider_started_at: approved for future capture as provider-reported evidence')
console.log('- Kick provider_started_at: unavailable pending source verification')
console.log('- Twitch category capture: unapproved')
console.log('- Kick category capture: unapproved pending primary-path live evidence')
console.log('- migration/runtime capture change: none')
console.log('- cross-provider identity equivalence: forbidden')
