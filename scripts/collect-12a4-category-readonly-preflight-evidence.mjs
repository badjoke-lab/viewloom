import fs from 'node:fs'
import path from 'node:path'

const [rawDir, outputFile] = process.argv.slice(2)
if (!rawDir || !outputFile) {
  console.error('usage: node collect-12a4-category-readonly-preflight-evidence.mjs <raw-dir> <output-file>')
  process.exit(2)
}

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(rawDir, file), 'utf8'))
const readCodes = (provider) => {
  const values = fs.readFileSync(path.join(rawDir, `${provider}-codes.txt`), 'utf8').trim().split(/\s+/).map(Number)
  const [deployExitCode, secretExitCode, curlExitCode, httpStatus, deleteExitCode, deleteCurlExitCode, deleteHttpStatus] = values
  return { deployExitCode, secretExitCode, curlExitCode, httpStatus, deleteExitCode, deleteCurlExitCode, deleteHttpStatus }
}

const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-category-readonly-preflight-contract.json', 'utf8'))
const parent = readJson('parent-pr.json')
const headSha = fs.readFileSync(path.join(rawDir, 'head-sha.txt'), 'utf8').trim()

const providers = {}
for (const provider of ['twitch', 'kick']) {
  const raw = readJson(`${provider}.json`)
  const lifecycle = readCodes(provider)
  const categorySchemaAbsent =
    raw.schema?.dictionaryTablePresent === false
    && Array.isArray(raw.schema?.presentRollupColumns)
    && raw.schema.presentRollupColumns.length === 0
    && Array.isArray(raw.schema?.presentStatusColumns)
    && raw.schema.presentStatusColumns.length === 0
    && raw.schema?.categorySchemaComplete === false
  const checks = {
    responseOk: raw.ok === true,
    readOnly: raw.boundaries?.readOnly === true,
    categorySchemaAbsent,
    latestSnapshotPresent: Boolean(raw.latestSnapshot),
    collectorStatusPresent: Boolean(raw.collectorStatus),
    providerLeakageAbsent: Number(raw.providerLeakageRows ?? -1) === 0,
    rowsWrittenZero: Number(raw.query?.rowsWritten ?? -1) === 0,
    changesZero: Number(raw.query?.changes ?? -1) === 0,
    deploymentSucceeded: lifecycle.deployExitCode === 0 && lifecycle.secretExitCode === 0,
    requestSucceeded: lifecycle.curlExitCode === 0 && lifecycle.httpStatus === 200,
    deleted: lifecycle.deleteExitCode === 0 && lifecycle.deleteCurlExitCode === 0 && lifecycle.deleteHttpStatus === 404,
  }
  providers[provider] = {
    provider,
    observedAt: raw.observedAt ?? null,
    mode: raw.mode ?? null,
    schema: raw.schema ?? null,
    latestSnapshot: raw.latestSnapshot ?? null,
    collectorStatus: raw.collectorStatus ?? null,
    providerLeakageRows: Number(raw.providerLeakageRows ?? -1),
    query: raw.query ?? null,
    workerWallMs: Number(raw.workerWallMs ?? -1),
    lifecycle,
    checks,
    providerGatePass: Object.values(checks).every(Boolean),
  }
}

const evidence = {
  schemaVersion: 'viewloom-12a4-category-readonly-preflight-evidence-v1',
  workstream: contract.workstream,
  status: 'observed',
  observedAt: new Date().toISOString(),
  providerSeparated: true,
  execution: {
    parentPlanningPr: contract.parentPlanningPr,
    parentMerged: parent.merged === true,
    parentMergeSha: parent.merge_commit_sha ?? null,
    headSha,
    event: 'workflow_dispatch',
    readOnly: true,
  },
  providers,
  gate: {
    parentPlanningPrMerged: parent.merged === true,
    twitchGatePass: providers.twitch.providerGatePass,
    kickGatePass: providers.kick.providerGatePass,
    readOnlyPreflightPass: parent.merged === true && providers.twitch.providerGatePass && providers.kick.providerGatePass,
    remoteMigrationApplyAuthorized: false,
    runtimeCaptureEnablementAuthorized: false,
  },
  privacy: {
    channelIdentitiesIncluded: false,
    rawPayloadIncluded: false,
    credentialsIncluded: false,
    databaseIdsIncluded: false,
    accountIdIncluded: false,
    deploymentLogsIncluded: false,
  },
  boundaries: contract.boundaries,
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputFile, readOnlyPreflightPass: evidence.gate.readOnlyPreflightPass }, null, 2))
