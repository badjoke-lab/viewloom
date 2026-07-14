import fs from 'node:fs'
import path from 'node:path'

const [rawDir, outputFile] = process.argv.slice(2)
if (!rawDir || !outputFile) {
  console.error('usage: node collect-12a4-category-schema-recovery-audit-evidence.mjs <raw-dir> <output-file>')
  process.exit(2)
}

const contract = JSON.parse(fs.readFileSync('docs/audits/12a4-category-schema-recovery-audit-contract.json', 'utf8'))
const parseErrors = []

function readJson(name, fallback = null) {
  const file = path.join(rawDir, name)
  if (!fs.existsSync(file)) return fallback
  const text = fs.readFileSync(file, 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    parseErrors.push({
      file: name,
      error: error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180),
      preview: text.trim().replace(/\s+/g, ' ').slice(0, 120),
    })
    return fallback
  }
}

function readText(name, fallback = '') {
  const file = path.join(rawDir, name)
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : fallback
}

function number(value, fallback = null) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function schemaState(inspect) {
  const schema = inspect?.schema
  if (!schema || inspect?.ok !== true) return 'unknown'
  if (schema.categorySchemaComplete === true) return 'complete'
  const dictionary = schema.dictionaryTablePresent === true
  const rollup = Array.isArray(schema.presentRollupColumns) ? schema.presentRollupColumns.length : 0
  const status = Array.isArray(schema.presentStatusColumns) ? schema.presentStatusColumns.length : 0
  if (!dictionary && rollup === 0 && status === 0) return 'absent'
  return 'partial'
}

const executionStatus = readJson('execution-status.json', { providers: {} })
const providers = {}

for (const provider of contract.providers.order) {
  const inspect = readJson(`${provider}-inspect.json`)
  const lifecycle = readJson(`${provider}-lifecycle.json`, {})
  const state = schemaState(inspect)
  const expected = contract.providers[provider]
  const query = inspect?.query ?? null
  const attempted = executionStatus?.providers?.[provider]?.attempted === true

  const checks = {
    attempted,
    temporaryWorkerAbsentBeforeDeploy:
      lifecycle.preExistingCurlExitCode === 0
      && lifecycle.preExistingHttpStatus === contract.acceptance.temporaryWorkerPreExistingHttpStatus,
    deploySucceeded: lifecycle.deployExitCode === 0 && lifecycle.secretExitCode === 0,
    inspectSucceeded:
      lifecycle.inspectCurlExitCode === 0
      && lifecycle.inspectHttpStatus === contract.acceptance.inspectHttpStatus
      && inspect?.ok === true,
    schemaStateKnown: contract.acceptance.allowedSchemaStates.includes(state),
    healthSourceMatches: inspect?.health?.source === expected.expectedHealthSource,
    healthEvidenceAvailable: inspect?.health?.evidenceAvailable === true,
    providerLeakageZero: number(inspect?.providerLeakageRows, -1) <= contract.acceptance.providerLeakageRowsMax,
    rowsWrittenZero: number(query?.rowsWritten, -1) <= contract.acceptance.rowsWrittenMax,
    changesZero: number(query?.changes, -1) <= contract.acceptance.changesMax,
    temporaryWorkerDeleted:
      lifecycle.deleteExitCode === 0
      && lifecycle.deleteCurlExitCode === 0
      && lifecycle.deleteHttpStatus === contract.acceptance.postDeleteHttpStatus,
  }

  providers[provider] = {
    provider,
    attempted,
    schemaState: state,
    schema: inspect?.schema ?? null,
    health: inspect?.health ?? null,
    latestSnapshot: inspect?.latestSnapshot ?? null,
    collectorStatus: inspect?.collectorStatus ?? null,
    providerLeakageRows: number(inspect?.providerLeakageRows),
    query: query ? {
      statements: number(query.statements),
      durationMs: number(query.durationMs),
      rowsRead: number(query.rowsRead),
      rowsWritten: number(query.rowsWritten),
      changes: number(query.changes),
      sizeAfter: number(query.sizeAfter),
    } : null,
    workerWallMs: number(inspect?.workerWallMs),
    lifecycle,
    parseError: parseErrors.find((entry) => entry.file === `${provider}-inspect.json`) ?? null,
    checks,
    providerGatePass: Object.values(checks).every(Boolean),
  }
}

const auditPass = contract.providers.order.every((provider) => providers[provider]?.providerGatePass === true)
const evidence = {
  schemaVersion: 'viewloom-12a4-category-schema-recovery-audit-evidence-v1',
  workstream: contract.workstream,
  status: auditPass ? 'observed_pass' : 'observed_failure',
  observedAt: new Date().toISOString(),
  execution: {
    event: readText('event-name.txt'),
    headSha: readText('head-sha.txt'),
    trigger: readJson('trigger.json'),
    providerOrder: contract.providers.order,
  },
  sourceAttempt: contract.sourceAttempt,
  providers,
  parseErrors,
  gate: {
    recoveryAuditPass: auditPass,
    providerStatesKnown: contract.providers.order.every((provider) => contract.acceptance.allowedSchemaStates.includes(providers[provider]?.schemaState)),
    remoteSchemaApplyAuthorized: false,
    categoryRuntimeEnablementAuthorized: false,
    providerSpecificRecoveryAuthorizedByThisEvidence: false,
  },
  boundaries: contract.boundaries,
}

fs.mkdirSync(path.dirname(outputFile), { recursive: true })
fs.writeFileSync(outputFile, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputFile, recoveryAuditPass: auditPass, providerStates: Object.fromEntries(contract.providers.order.map((provider) => [provider, providers[provider].schemaState])) }, null, 2))
