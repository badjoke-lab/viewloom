#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'

const [rawDir = 'artifacts/12a4-category-source/raw', output = 'artifacts/12a4-category-source/evidence.json'] = process.argv.slice(2)
const contract = JSON.parse(readFileSync('docs/audits/12a4-category-source-audit-contract.json', 'utf8'))

const readJson = (path, fallback = null) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return fallback }
}

const lifecycle = readJson(`${rawDir}/lifecycle.json`, {})
const twitchPasses = [readJson(`${rawDir}/twitch-1.json`), readJson(`${rawDir}/twitch-2.json`)]
const kickPasses = [readJson(`${rawDir}/kick-1.json`), readJson(`${rawDir}/kick-2.json`)]

function stableFields(firstInventory, secondInventory) {
  const minimum = contract.stableFieldRule.minimumPresenceRatio
  const first = new Map((firstInventory?.candidateFields ?? []).map((row) => [row.path, row]))
  const second = new Map((secondInventory?.candidateFields ?? []).map((row) => [row.path, row]))
  return [...first.keys()]
    .filter((path) => second.has(path))
    .map((path) => ({
      path,
      first: first.get(path),
      second: second.get(path),
    }))
    .filter((row) => Number(row.first?.presenceRatio ?? 0) >= minimum && Number(row.second?.presenceRatio ?? 0) >= minimum)
    .map((row) => ({
      path: row.path,
      minimumPresenceRatio: Math.min(Number(row.first.presenceRatio), Number(row.second.presenceRatio)),
      valueTypes: [...new Set([...(row.first.valueTypes ?? []), ...(row.second.valueTypes ?? [])])].sort(),
      objectKeys: [...new Set([...(row.first.objectKeys ?? []), ...(row.second.objectKeys ?? [])])].sort(),
      sampleValues: [...new Set([...(row.first.sampleValues ?? []), ...(row.second.sampleValues ?? [])])].slice(0, 12),
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

function pairCandidates(fields) {
  const byPath = new Map(fields.map((row) => [row.path, row]))
  const pairs = []
  for (const idField of fields) {
    const candidates = []
    if (idField.path.endsWith('.id')) candidates.push(`${idField.path.slice(0, -3)}.name`)
    if (idField.path.endsWith('_id')) candidates.push(`${idField.path.slice(0, -3)}_name`)
    if (idField.path === 'id') candidates.push('name')
    for (const namePath of candidates) {
      const nameField = byPath.get(namePath)
      if (!nameField) continue
      const hasIdSamples = (idField.sampleValues ?? []).some((value) => String(value).trim() !== '')
      const hasNameSamples = (nameField.sampleValues ?? []).some((value) => String(value).trim() !== '')
      if (!hasIdSamples || !hasNameSamples) continue
      pairs.push({
        providerIdPath: idField.path,
        namePath,
        minimumPresenceRatio: Math.min(idField.minimumPresenceRatio, nameField.minimumPresenceRatio),
        providerIdTypes: idField.valueTypes,
        nameTypes: nameField.valueTypes,
        providerIdSamples: idField.sampleValues,
        nameSamples: nameField.sampleValues,
      })
    }
  }
  return pairs.sort((a, b) => b.minimumPresenceRatio - a.minimumPresenceRatio || a.providerIdPath.localeCompare(b.providerIdPath))
}

const twitchStable = stableFields(twitchPasses[0]?.inventory, twitchPasses[1]?.inventory)
const twitchCanonical = twitchPasses.every((row) => (
  row?.ok === true
  && Number(row?.canonicalCandidate?.rowCount ?? 0) > 0
  && Number(row?.canonicalCandidate?.providerIdKeyPresent ?? 0) === Number(row?.canonicalCandidate?.rowCount ?? -1)
  && Number(row?.canonicalCandidate?.nameKeyPresent ?? 0) === Number(row?.canonicalCandidate?.rowCount ?? -1)
  && Number(row?.canonicalCandidate?.pairedNonEmpty ?? 0) > 0
))

const kickSources = {}
for (const [sourceKey, sourceContract] of [
  ['primaryOfficialLivestreams', contract.providers.kick.primarySource],
  ['alternateOfficialChannels', contract.providers.kick.alternateSources[0]],
  ['publicChannelFallback', contract.providers.kick.alternateSources[1]],
]) {
  const first = kickPasses[0]?.sources?.[sourceKey]
  const second = kickPasses[1]?.sources?.[sourceKey]
  const fields = stableFields(first?.inventory, second?.inventory)
  const pairs = pairCandidates(fields)
  kickSources[sourceKey] = {
    source: sourceContract,
    firstRowCount: Number(first?.inventory?.rowCount ?? 0),
    secondRowCount: Number(second?.inventory?.rowCount ?? 0),
    stableFields: fields,
    stableIdentityNamePairs: pairs,
    sourceVerified: Number(first?.inventory?.rowCount ?? 0) > 0
      && Number(second?.inventory?.rowCount ?? 0) > 0
      && pairs.length > 0,
  }
}

const lifecyclePass = ['twitch', 'kick'].every((provider) => {
  const row = lifecycle?.[provider] ?? {}
  return Number(row.auditDeployExitCode) === 0
    && Array.isArray(row.calls)
    && row.calls.length === 2
    && row.calls.every((call) => Number(call.curlExitCode) === 0 && Number(call.httpStatus) === 200)
    && Number(row.restoreExitCode) === 0
    && Number(row.restoreHealthCurlExitCode) === 0
    && Number(row.restoreHealthHttpStatus) === 200
})

const evidence = {
  schemaVersion: 'viewloom-12a4-category-source-audit-evidence-v1',
  workstream: contract.workstream,
  stage: contract.stage,
  status: 'observed',
  observedAt: new Date().toISOString(),
  providerSeparated: true,
  lifecycle,
  providers: {
    twitch: {
      passes: twitchPasses.map((row) => ({
        observedAt: row?.observedAt ?? null,
        source: row?.source ?? null,
        inventory: row?.inventory ?? null,
        canonicalCandidate: row?.canonicalCandidate ?? null,
      })),
      stableFields: twitchStable,
      selectedSourceContract: twitchCanonical ? {
        providerIdPath: contract.providers.twitch.expectedProviderIdPath,
        namePath: contract.providers.twitch.expectedNamePath,
        categorySource: contract.providers.twitch.primarySource,
        categoryEvidenceStrength: 'provider_primary_live_api',
        categoryContractVersion: contract.contractVersion,
      } : null,
      sourceVerified: twitchCanonical,
      captureApproved: twitchCanonical,
    },
    kick: {
      passes: kickPasses.map((row) => ({
        observedAt: row?.observedAt ?? null,
        primaryHttpStatus: row?.sources?.primaryOfficialLivestreams?.httpStatus ?? null,
        primaryRowCount: row?.sources?.primaryOfficialLivestreams?.inventory?.rowCount ?? 0,
      })),
      sources: kickSources,
      selectedSourceContract: kickSources.primaryOfficialLivestreams.sourceVerified ? {
        ...kickSources.primaryOfficialLivestreams.stableIdentityNamePairs[0],
        categorySource: contract.providers.kick.primarySource,
        categoryEvidenceStrength: 'provider_primary_live_api',
        categoryContractVersion: contract.contractVersion,
      } : null,
      sourceVerified: kickSources.primaryOfficialLivestreams.sourceVerified,
      captureApproved: kickSources.primaryOfficialLivestreams.sourceVerified,
      alternateEvidenceCannotApprovePrimary: true,
    },
  },
  gate: {
    lifecyclePass,
    twitchSourceVerified: twitchCanonical,
    kickPrimarySourceVerified: kickSources.primaryOfficialLivestreams.sourceVerified,
    categorySourceAuditPass: lifecyclePass && twitchCanonical && kickSources.primaryOfficialLivestreams.sourceVerified,
    storageDesignAuthorized: lifecyclePass && twitchCanonical && kickSources.primaryOfficialLivestreams.sourceVerified,
    runtimeCaptureAuthorized: false,
  },
  privacy: {
    channelIdentitiesIncluded: false,
    streamTitlesIncluded: false,
    rawUpstreamRowsIncluded: false,
    credentialsIncluded: false,
    databaseIdsIncluded: false,
    accountIdIncluded: false,
    deploymentLogsIncluded: false,
  },
  boundaries: {
    productionSchemaChanged: false,
    productionRowsWrittenByAudit: false,
    collectorCadenceChanged: false,
    rawRetentionChanged: false,
    backfillPerformed: false,
    categoryCaptureEnabled: false,
    categoryAnalyticsUiIncluded: false,
    crossProviderCategoryIdentityAllowed: false,
    combinedProviderCategoryRankingAllowed: false,
    mainCollectorsRestored: lifecyclePass,
  },
}

writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`)
