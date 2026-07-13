#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'

const [rawDir = 'artifacts/12a4-disabled-runtime/raw', output = 'artifacts/12a4-disabled-runtime/evidence.json'] = process.argv.slice(2)
const contract = JSON.parse(readFileSync('docs/audits/12a4-disabled-runtime-postmerge-contract.json', 'utf8'))

function json(path, fallback = null) {
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return fallback }
}

function codes(path) {
  try {
    const [deploy, run, curl, http, remove, removeCurl, removeHttp] = readFileSync(path, 'utf8').trim().split(/\s+/)
    return {
      deployExitCode: Number(deploy),
      runExitCode: Number(run),
      curlExitCode: Number(curl),
      httpStatus: Number(http),
      deleteExitCode: Number(remove),
      deleteCurlExitCode: Number(removeCurl),
      deleteHttpStatus: Number(removeHttp),
    }
  } catch {
    return {
      deployExitCode: 1,
      runExitCode: 1,
      curlExitCode: 1,
      httpStatus: 0,
      deleteExitCode: 1,
      deleteCurlExitCode: 1,
      deleteHttpStatus: 0,
    }
  }
}

const deployment = json(`${rawDir}/deployment.json`, {})
const providers = {}
for (const provider of ['twitch', 'kick']) {
  const observation = json(`${rawDir}/${provider}.json`, {})
  const lifecycle = codes(`${rawDir}/${provider}-codes.txt`)
  const checks = observation.checks ?? {}
  const providerGatePass = observation.ok === true
    && checks.latestSnapshotPresent === true
    && checks.latestAfterDeployment === true
    && checks.categoryPayloadFieldsAbsent === true
    && checks.categorySchemaAbsent === true
    && checks.providerSeparated === true
    && lifecycle.deployExitCode === 0
    && lifecycle.runExitCode === 0
    && lifecycle.curlExitCode === 0
    && lifecycle.httpStatus === 200
    && lifecycle.deleteExitCode === 0
    && lifecycle.deleteCurlExitCode === 0
    && lifecycle.deleteHttpStatus === 200

  providers[provider] = {
    provider,
    observedAt: observation.observedAt ?? null,
    minimumCollectedAt: observation.minimumCollectedAt ?? null,
    latest: observation.latest ?? null,
    schema: observation.schema ?? null,
    checks,
    lifecycle,
    providerGatePass,
  }
}

const deploymentPass = deployment.gatePass === true
const temporaryVerifiersRetained = ['twitch', 'kick'].some((provider) => providers[provider].lifecycle.deleteExitCode !== 0)
const disabledRuntimePostMergePass = deploymentPass
  && providers.twitch.providerGatePass
  && providers.kick.providerGatePass
  && !temporaryVerifiersRetained

const evidence = {
  schemaVersion: 'viewloom-12a4-disabled-runtime-postmerge-evidence-v1',
  workstream: contract.workstream,
  status: 'observed',
  observedAt: new Date().toISOString(),
  providerSeparated: true,
  merge: contract.merge,
  deployment,
  providers,
  gate: {
    deploymentPass,
    twitchGatePass: providers.twitch.providerGatePass,
    kickGatePass: providers.kick.providerGatePass,
    disabledRuntimePostMergePass,
    productionExecutionCostProbeRequired: true,
    remoteMigrationApplyAuthorized: false,
    runtimeCaptureEnablementAuthorized: false,
  },
  privacy: contract.privacy,
  boundaries: {
    ...contract.boundaries,
    temporaryVerifiersRetained,
  },
}

writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`)
