#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'

const [rawDir = 'artifacts/12a3-postmerge/raw', output = 'artifacts/12a3-postmerge/evidence.json'] = process.argv.slice(2)
const contract = JSON.parse(readFileSync('docs/audits/12a3-postmerge-acceptance-contract.json', 'utf8'))

const readJson = (path, fallback = null) => {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return fallback }
}
const readCodes = (provider) => {
  try {
    const [deployExitCode, runExitCode, runCurlExitCode, runHttpStatus, deleteExitCode, deleteCurlExitCode, deleteHttpStatus] = readFileSync(`${rawDir}/${provider}-codes.txt`, 'utf8').trim().split(/\s+/).map(Number)
    return { deployExitCode, runExitCode, runCurlExitCode, runHttpStatus, deleteExitCode, deleteCurlExitCode, deleteHttpStatus }
  } catch {
    return { deployExitCode: 1, runExitCode: 1, runCurlExitCode: 1, runHttpStatus: 0, deleteExitCode: 1, deleteCurlExitCode: 1, deleteHttpStatus: 0 }
  }
}

const deployment = readJson(`${rawDir}/deployment.json`, { status: 'missing' })
const providers = {}
for (const provider of ['twitch', 'kick']) {
  const response = readJson(`${rawDir}/${provider}.json`, { ok: false, error: 'response_missing' })
  const lifecycle = readCodes(provider)
  providers[provider] = {
    status: response?.ok === true ? 'observed' : 'unavailable',
    lifecycle,
    observedAt: response?.observedAt ?? null,
    minimumRefreshedAt: response?.minimumRefreshedAt ?? contract.naturalMaintenance.minimumRefreshedAt,
    config: response?.config ?? null,
    days: Array.isArray(response?.days) ? response.days : [],
    checks: response?.checks ?? {},
    boundaries: response?.boundaries ?? {},
    diagnostic: response?.ok === true ? null : { error: String(response?.error ?? 'unknown').slice(0, 160) },
    providerGatePass: response?.ok === true
      && lifecycle.deployExitCode === 0
      && lifecycle.runExitCode === 0
      && lifecycle.runHttpStatus === 200
      && lifecycle.deleteExitCode === 0,
  }
}

const evidence = {
  schemaVersion: 'viewloom-12a3-postmerge-acceptance-evidence-v1',
  workstream: contract.workstream,
  status: 'observed',
  observedAt: new Date().toISOString(),
  merge: contract.merge,
  deployment,
  providerSeparated: true,
  providers,
  gate: {
    deploymentPass: deployment?.gatePass === true,
    twitchPass: providers.twitch.providerGatePass,
    kickPass: providers.kick.providerGatePass,
    postMergeAccumulationPass: deployment?.gatePass === true
      && providers.twitch.providerGatePass
      && providers.kick.providerGatePass,
  },
  privacy: {
    streamerIdentitiesIncluded: false,
    databaseIdsIncluded: false,
    accountIdIncluded: false,
    secretsIncluded: false,
    rawResponsesIncluded: false,
    deploymentLogsIncluded: false,
  },
  boundaries: {
    readOnly: true,
    sourceRowsModified: false,
    backfillPerformed: false,
    newCronAdded: false,
    manualCollectorRouteUsed: false,
    temporaryGeneratorUsed: false,
    crossProviderAnalyticsIncluded: false,
    temporaryVerifiersRetained: false,
  },
}

writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`)
