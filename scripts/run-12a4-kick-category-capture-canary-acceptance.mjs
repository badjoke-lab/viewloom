import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectKickCanaryTrigger } from './inspect-12a4-kick-category-capture-canary-trigger.mjs'
import {
  bindingsMatchTrigger,
  canaryBindingsFromSettings,
  projectKickStorage,
} from './run-12a4-kick-category-capture-canary-execution.mjs'

const REQUIRED_TABLES = [
  'collector_status',
  'minute_snapshots',
  'provider_category_dictionary',
  'streamer_intraday_rollups',
]

async function execute() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-category-canary-acceptance')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const contract = json('docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json')
  const trigger = json(contract.acceptedInputs.triggerPath)
  const executionContract = json(contract.acceptedInputs.executionContractPath)
  const packageContract = json('docs/audits/12a4-kick-category-capture-canary-package-contract.json')
  const inspected = inspectKickCanaryTrigger({
    trigger,
    executionContract,
    packageContract,
    eventName: 'schedule',
  })

  const normalConfigPath = path.resolve('workers/collector-kick/wrangler.toml')
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseId = tomlValue(normalConfig, 'database_id')
  if (!serviceName || !databaseId) throw new Error('kick_identity_missing')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-category-capture-canary-readonly-evidence-v1',
    provider: 'kick',
    attempt: trigger.attempt,
    observedAt: new Date().toISOString(),
    trigger: {
      status: trigger.status,
      phase: inspected.phase ?? null,
      action: inspected.action ?? null,
      startAt: trigger.startAt,
      until: trigger.until,
      packageMergeSha: trigger.packageMergeSha,
      executionPackageMergeSha: trigger.executionPackageMergeSha,
    },
    identity: {
      serviceName,
      databaseId,
    },
    storage: null,
    serviceBindings: null,
    schema: {
      requiredTables: REQUIRED_TABLES,
      observedTables: [],
      missingTables: [],
    },
    data: {
      kickDictionaryRows: null,
      providerLeakageRows: null,
      categoryPayloadRows: null,
      observedSamples: null,
      missingSamples: null,
      collector: null,
      minutesSinceCollectorSuccess: null,
    },
    gates: {
      readOnly: true,
      triggerActive: false,
      exactBindingsPass: false,
      permanentDirectFlagAbsent: false,
      storagePass: false,
      schemaPass: false,
      dictionaryPass: false,
      categoryPayloadPass: false,
      providerLeakagePass: false,
      collectorStatePass: false,
      collectorFreshnessPass: false,
      twitchStartAuthorized: false,
      productionMutationAuthorized: false,
    },
    outcome: 'rejected',
    error: null,
  }

  try {
    evidence.gates.triggerActive = inspected.ok === true
      && inspected.present === true
      && inspected.phase === 'active_window'
      && inspected.action === 'monitor'

    const [dbInfo, settings] = await Promise.all([
      fetchD1Info(accountId, apiToken, databaseId),
      fetchWorkerSettings(accountId, apiToken, serviceName),
    ])

    evidence.storage = projectKickStorage(dbInfo.fileSize)
    evidence.gates.storagePass = evidence.storage.pass === true
    evidence.serviceBindings = canaryBindingsFromSettings(settings)
    evidence.gates.exactBindingsPass = bindingsMatchTrigger(evidence.serviceBindings, trigger)
    evidence.gates.permanentDirectFlagAbsent = evidence.serviceBindings.categoryCaptureDirectFlagPresent === false

    const tableRows = runD1Select(normalConfigPath, `
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('collector_status', 'minute_snapshots', 'provider_category_dictionary', 'streamer_intraday_rollups')
ORDER BY name;
`.trim())
    evidence.schema.observedTables = tableRows.map((row) => String(row.name ?? '')).filter(Boolean)
    evidence.schema.missingTables = REQUIRED_TABLES.filter((name) => !evidence.schema.observedTables.includes(name))
    evidence.gates.schemaPass = evidence.schema.missingTables.length === 0

    if (evidence.gates.schemaPass) {
      const rows = runD1Select(normalConfigPath, `
SELECT COUNT(*) AS kick_dictionary_rows FROM provider_category_dictionary WHERE provider = 'kick';
SELECT COUNT(*) AS provider_leakage_rows FROM provider_category_dictionary WHERE provider != 'kick';
SELECT COUNT(*) AS category_payload_rows FROM minute_snapshots WHERE provider = 'kick' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT COALESCE(SUM(category_observed_samples), 0) AS observed_samples, COALESCE(SUM(category_missing_samples), 0) AS missing_samples FROM streamer_intraday_rollups WHERE provider = 'kick';
SELECT state, last_attempt_at, last_success_at, last_failure_at FROM collector_status WHERE provider = 'kick' LIMIT 1;
`.trim())

      evidence.data.kickDictionaryRows = numberFromRows(rows, 'kick_dictionary_rows')
      evidence.data.providerLeakageRows = numberFromRows(rows, 'provider_leakage_rows')
      evidence.data.categoryPayloadRows = numberFromRows(rows, 'category_payload_rows')
      evidence.data.observedSamples = numberFromRows(rows, 'observed_samples')
      evidence.data.missingSamples = numberFromRows(rows, 'missing_samples')
      evidence.data.collector = rows.find((row) => Object.hasOwn(row, 'state')) ?? null
      evidence.data.minutesSinceCollectorSuccess = minutesSince(evidence.data.collector?.last_success_at)

      evidence.gates.dictionaryPass = Number(evidence.data.kickDictionaryRows) > 0
      evidence.gates.categoryPayloadPass = Number(evidence.data.categoryPayloadRows) >= Number(contract.observation.minimumCategoryPayloadRows)
      evidence.gates.providerLeakagePass = Number(evidence.data.providerLeakageRows) <= Number(contract.observation.maximumProviderLeakageRows)
      evidence.gates.collectorStatePass = contract.observation.collectorStatesAccepted.includes(String(evidence.data.collector?.state ?? ''))
      evidence.gates.collectorFreshnessPass = Number.isFinite(evidence.data.minutesSinceCollectorSuccess)
        && evidence.data.minutesSinceCollectorSuccess <= Number(contract.observation.collectorFreshnessMinutesMax)
    }

    const required = [
      evidence.gates.triggerActive,
      evidence.gates.exactBindingsPass,
      evidence.gates.permanentDirectFlagAbsent,
      evidence.gates.storagePass,
      evidence.gates.schemaPass,
      evidence.gates.dictionaryPass,
      evidence.gates.categoryPayloadPass,
      evidence.gates.providerLeakagePass,
      evidence.gates.collectorStatePass,
      evidence.gates.collectorFreshnessPass,
    ]
    evidence.outcome = required.every(Boolean) ? 'accepted' : 'rejected'
  } catch (error) {
    evidence.error = safeError(error)
    evidence.outcome = 'rejected'
  }

  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, 'evidence.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('evidence_path', outputPath)
  writeOutput('outcome', evidence.outcome)
  console.log(JSON.stringify({
    outputPath,
    outcome: evidence.outcome,
    storage: evidence.storage,
    data: evidence.data,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))

  if (evidence.outcome !== 'accepted') process.exit(1)
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function tomlValue(source, key) {
  const match = source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))
  return match?.[1] ?? null
}

async function fetchD1Info(accountId, apiToken, databaseId) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`, {
    headers: { authorization: `Bearer ${apiToken}` },
  })
  const body = await response.json().catch(() => null)
  const fileSize = Number(body?.result?.file_size)
  if (!response.ok || body?.success !== true || !Number.isFinite(fileSize)) throw new Error(`d1_info_failed_http_${response.status}`)
  return { fileSize }
}

async function fetchWorkerSettings(accountId, apiToken, serviceName) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, {
    headers: { authorization: `Bearer ${apiToken}` },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) throw new Error(`worker_settings_failed_http_${response.status}`)
  return body
}

function runD1Select(configPath, sql) {
  if (!/^SELECT\b/i.test(sql.trim())) throw new Error('non_select_statement_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_kick_hot', '--remote', '--json', '--config', configPath, '--command', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout))
}

function parseLastJson(value) {
  const text = String(value ?? '').trim()
  for (let index = text.lastIndexOf('['); index >= 0; index = text.lastIndexOf('[', index - 1)) {
    try { return JSON.parse(text.slice(index)) } catch {}
  }
  for (let index = text.lastIndexOf('{'); index >= 0; index = text.lastIndexOf('{', index - 1)) {
    try { return JSON.parse(text.slice(index)) } catch {}
  }
  throw new Error('d1_json_output_missing')
}

function flattenRows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => Array.isArray(group?.results)
    ? group.results
    : Array.isArray(group?.result?.[0]?.results)
      ? group.result[0].results
      : [])
}

function numberFromRows(rows, key) {
  const row = rows.find((candidate) => Object.hasOwn(candidate, key))
  const value = Number(row?.[key])
  return Number.isFinite(value) ? value : null
}

function minutesSince(value) {
  const timestamp = new Date(String(value ?? '')).getTime()
  return Number.isFinite(timestamp) ? Math.round(((Date.now() - timestamp) / 60000) * 100) / 100 : null
}

function safeText(value) {
  return String(value ?? '').slice(0, 240)
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : error)
}

function writeOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
