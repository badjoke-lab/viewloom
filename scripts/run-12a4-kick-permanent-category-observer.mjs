import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MB = 1024 * 1024
const CATEGORY_SAFETY_BYTES = 48.32 * MB
const PROVIDER_LIMIT_BYTES = 450 * MB
const ACCOUNT_LIMIT_BYTES = 4608 * MB
const REQUIRED_TABLES = [
  'minute_snapshots',
  'provider_category_dictionary',
  'streamer_intraday_rollups',
  'intraday_rollup_status',
]
const CANARY_BINDINGS = [
  'CATEGORY_CAPTURE_CANARY_ENABLED',
  'CATEGORY_CAPTURE_CANARY_PROVIDER',
  'CATEGORY_CAPTURE_CANARY_STARTED_AT',
  'CATEGORY_CAPTURE_CANARY_UNTIL',
  'CATEGORY_CAPTURE_CANARY_ATTEMPT',
]

export function projectStorage(providerBytes, accountBytes) {
  const providerCurrent = finite(providerBytes)
  const accountCurrent = finite(accountBytes)
  const projectedProvider = providerCurrent + CATEGORY_SAFETY_BYTES
  const projectedAccount = accountCurrent + CATEGORY_SAFETY_BYTES
  return {
    providerCurrentMb: mb(providerCurrent),
    accountCurrentMb: mb(accountCurrent),
    categorySafetyMb: mb(CATEGORY_SAFETY_BYTES),
    projectedNinetyDaySizeMb: mb(projectedProvider),
    projectedProviderHeadroomMb: mb(PROVIDER_LIMIT_BYTES - projectedProvider),
    projectedAccountWideSizeMb: mb(projectedAccount),
    projectedAccountWideHeadroomMb: mb(ACCOUNT_LIMIT_BYTES - projectedAccount),
    providerPass: projectedProvider <= 440 * MB && PROVIDER_LIMIT_BYTES - projectedProvider >= 10 * MB,
    accountPass: ACCOUNT_LIMIT_BYTES - projectedAccount >= 500 * MB,
  }
}

export function bindingState(settings) {
  const bindings = Array.isArray(settings?.result?.bindings)
    ? settings.result.bindings
    : Array.isArray(settings?.bindings)
      ? settings.bindings
      : []
  const text = new Map(bindings
    .filter((binding) => binding?.type === 'plain_text' && typeof binding?.name === 'string')
    .map((binding) => [binding.name, String(binding.text ?? '')]))
  return {
    permanentFlagPresent: text.has('CATEGORY_CAPTURE_ENABLED'),
    permanentFlagValue: text.get('CATEGORY_CAPTURE_ENABLED') ?? null,
    permanentCaptureEnabled: text.get('CATEGORY_CAPTURE_ENABLED')?.trim().toLowerCase() === 'true',
    obsoleteCanaryBindingsPresent: CANARY_BINDINGS.some((name) => text.has(name)),
  }
}

export function parseLastJson(value) {
  const source = stripAnsi(String(value ?? ''))
  const parsed = []
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '[' && source[start] !== '{') continue
    const end = balancedJsonEnd(source, start)
    if (end === null) continue
    try {
      parsed.push(JSON.parse(source.slice(start, end + 1)))
      start = end
    } catch {}
  }
  if (parsed.length === 0) throw new Error('json_output_missing')
  return parsed.at(-1)
}

export async function runObserver(options = {}) {
  const mode = String(options.mode ?? process.env.MODE ?? 'preflight').trim().toLowerCase()
  if (!['preflight', 'observe', 'rollback'].includes(mode)) throw new Error('invalid_mode')
  const contract = json('docs/audits/12a4-kick-permanent-category-capture-package-contract.json')
  const normalConfigPath = path.resolve(contract.package.normalConfig)
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseId = tomlValue(normalConfig, 'database_id')
  const databaseName = tomlValue(normalConfig, 'database_name')
  const cadence = cronValue(normalConfig)
  if (!serviceName || !databaseId || !databaseName) throw new Error('kick_identity_missing')

  const outputDir = path.resolve(options.outputDir ?? process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-permanent-category')
  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-permanent-category-readonly-evidence-v1',
    provider: 'kick',
    mode,
    observedAt: new Date().toISOString(),
    identity: { serviceName, databaseName, databaseId, cadence },
    storage: null,
    bindings: null,
    schema: { requiredTables: REQUIRED_TABLES, observedTables: [], missingTables: [] },
    data: {
      kickDictionaryRows: null,
      providerLeakageRows: null,
      categoryPayloadRowsSinceStart: null,
      normalPayloadRowsSinceStart: null,
      collectorErrorRunsSinceStart: null,
      latestSnapshot: null,
      latestCategorySnapshot: null,
      latestNormalSnapshot: null,
      minutesSinceLatestSnapshot: null,
      minutesSinceLatestCategorySnapshot: null,
      minutesSinceLatestNormalSnapshot: null,
    },
    gates: {
      readOnly: true,
      exactIdentity: false,
      cadencePass: false,
      storagePass: false,
      schemaPass: false,
      providerLeakagePass: false,
      bindingsPass: false,
      latestSnapshotFreshnessPass: false,
      latestSnapshotRealPass: false,
      latestSnapshotNonemptyPass: false,
      categorySnapshotPass: mode !== 'observe',
      rollbackNormalSnapshotPass: mode !== 'rollback',
      productionMutationAuthorized: false,
      twitchMutationAuthorized: false,
    },
    outcome: 'rejected',
    error: null,
  }

  const accountId = String(options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  if (!accountId || !apiToken) {
    evidence.error = 'cloudflare_credentials_missing'
    return finish(evidence, outputDir, 1)
  }

  try {
    const [dbInfo, databases, settings] = await Promise.all([
      cloudflareJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`, apiToken),
      fetchAllD1Databases(accountId, apiToken),
      cloudflareJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, apiToken),
    ])
    const providerBytes = Number(dbInfo?.result?.file_size ?? dbInfo?.result?.fileSize ?? 0)
    const accountBytes = databases.reduce((sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0), 0)
    evidence.storage = projectStorage(providerBytes, accountBytes)
    evidence.bindings = bindingState(settings)
    evidence.gates.exactIdentity = serviceName === contract.runtimeContract.serviceName
      && databaseName === contract.runtimeContract.databaseName
      && databaseId === tomlValue(fs.readFileSync(contract.package.permanentConfig, 'utf8'), 'database_id')
    evidence.gates.cadencePass = cadence === contract.runtimeContract.collectorCron
    evidence.gates.storagePass = evidence.storage.providerPass && evidence.storage.accountPass
    evidence.gates.bindingsPass = evidence.bindings.obsoleteCanaryBindingsPresent === false
      && (mode === 'observe'
        ? evidence.bindings.permanentCaptureEnabled === true
        : evidence.bindings.permanentFlagPresent === false)

    const tables = runD1Select(normalConfigPath, databaseName, `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('minute_snapshots','provider_category_dictionary','streamer_intraday_rollups','intraday_rollup_status') ORDER BY name;`)
    evidence.schema.observedTables = tables.map((row) => String(row.name ?? '')).filter(Boolean)
    evidence.schema.missingTables = REQUIRED_TABLES.filter((name) => !evidence.schema.observedTables.includes(name))
    evidence.gates.schemaPass = evidence.schema.missingTables.length === 0

    if (evidence.gates.schemaPass) {
      const startAt = sqlText(options.startAt ?? process.env.START_AT ?? '1970-01-01T00:00:00.000Z')
      const rows = runD1Select(normalConfigPath, databaseName, `
SELECT COUNT(*) AS kick_dictionary_rows FROM provider_category_dictionary WHERE provider = 'kick';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'kick') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'kick') +
  (SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider != 'kick')
) AS provider_leakage_rows;
SELECT COUNT(*) AS category_payload_rows_since_start FROM minute_snapshots WHERE provider = 'kick' AND collected_at >= '${startAt}' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT COUNT(*) AS normal_payload_rows_since_start FROM minute_snapshots WHERE provider = 'kick' AND collected_at >= '${startAt}' AND json_extract(payload_json, '$.categoryContractVersion') IS NULL;
SELECT COUNT(*) AS collector_error_runs_since_start FROM collector_runs WHERE provider = 'kick' AND run_at >= '${startAt}' AND status = 'error';
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode, json_extract(payload_json, '$.categoryContractVersion') AS category_contract_version FROM minute_snapshots WHERE provider = 'kick' ORDER BY bucket_minute DESC LIMIT 1;
SELECT bucket_minute AS category_bucket_minute, collected_at AS category_collected_at, stream_count AS category_stream_count, total_viewers AS category_total_viewers, source_mode AS category_source_mode FROM minute_snapshots WHERE provider = 'kick' AND collected_at >= '${startAt}' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' ORDER BY bucket_minute DESC LIMIT 1;
SELECT bucket_minute AS normal_bucket_minute, collected_at AS normal_collected_at, stream_count AS normal_stream_count, total_viewers AS normal_total_viewers, source_mode AS normal_source_mode FROM minute_snapshots WHERE provider = 'kick' AND collected_at >= '${startAt}' AND json_extract(payload_json, '$.categoryContractVersion') IS NULL ORDER BY bucket_minute DESC LIMIT 1;
`.trim())
      evidence.data.kickDictionaryRows = numberFromRows(rows, 'kick_dictionary_rows')
      evidence.data.providerLeakageRows = numberFromRows(rows, 'provider_leakage_rows')
      evidence.data.categoryPayloadRowsSinceStart = numberFromRows(rows, 'category_payload_rows_since_start')
      evidence.data.normalPayloadRowsSinceStart = numberFromRows(rows, 'normal_payload_rows_since_start')
      evidence.data.collectorErrorRunsSinceStart = numberFromRows(rows, 'collector_error_runs_since_start')
      evidence.data.latestSnapshot = rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null
      evidence.data.latestCategorySnapshot = rows.find((row) => Object.hasOwn(row, 'category_bucket_minute')) ?? null
      evidence.data.latestNormalSnapshot = rows.find((row) => Object.hasOwn(row, 'normal_bucket_minute')) ?? null
      evidence.data.minutesSinceLatestSnapshot = minutesSince(evidence.data.latestSnapshot?.collected_at ?? evidence.data.latestSnapshot?.bucket_minute)
      evidence.data.minutesSinceLatestCategorySnapshot = minutesSince(evidence.data.latestCategorySnapshot?.category_collected_at ?? evidence.data.latestCategorySnapshot?.category_bucket_minute)
      evidence.data.minutesSinceLatestNormalSnapshot = minutesSince(evidence.data.latestNormalSnapshot?.normal_collected_at ?? evidence.data.latestNormalSnapshot?.normal_bucket_minute)
      evidence.gates.providerLeakagePass = evidence.data.providerLeakageRows === 0
      evidence.gates.latestSnapshotFreshnessPass = Number.isFinite(evidence.data.minutesSinceLatestSnapshot)
        && evidence.data.minutesSinceLatestSnapshot <= contract.readOnlyPreflight.latestSnapshotFreshnessMinutesMax
      evidence.gates.latestSnapshotRealPass = evidence.data.latestSnapshot?.source_mode === 'real'
      evidence.gates.latestSnapshotNonemptyPass = Number(evidence.data.latestSnapshot?.stream_count) > 0
      evidence.gates.categorySnapshotPass = mode !== 'observe' || (
        Number(evidence.data.categoryPayloadRowsSinceStart) >= contract.observation.initialConsecutiveCategorySnapshotsRequired
        && evidence.data.latestCategorySnapshot?.category_source_mode === 'real'
        && Number(evidence.data.latestCategorySnapshot?.category_stream_count) > 0
        && Number.isFinite(evidence.data.minutesSinceLatestCategorySnapshot)
        && evidence.data.minutesSinceLatestCategorySnapshot <= contract.readOnlyPreflight.latestSnapshotFreshnessMinutesMax
      )
      evidence.gates.rollbackNormalSnapshotPass = mode !== 'rollback' || (
        Number(evidence.data.normalPayloadRowsSinceStart) >= 1
        && evidence.data.latestNormalSnapshot?.normal_source_mode === 'real'
        && Number(evidence.data.latestNormalSnapshot?.normal_stream_count) > 0
        && Number.isFinite(evidence.data.minutesSinceLatestNormalSnapshot)
        && evidence.data.minutesSinceLatestNormalSnapshot <= contract.readOnlyPreflight.latestSnapshotFreshnessMinutesMax
      )
    }

    const required = [
      evidence.gates.exactIdentity,
      evidence.gates.cadencePass,
      evidence.gates.storagePass,
      evidence.gates.schemaPass,
      evidence.gates.providerLeakagePass,
      evidence.gates.bindingsPass,
      evidence.gates.latestSnapshotFreshnessPass,
      evidence.gates.latestSnapshotRealPass,
      evidence.gates.latestSnapshotNonemptyPass,
      evidence.gates.categorySnapshotPass,
      evidence.gates.rollbackNormalSnapshotPass,
    ]
    evidence.outcome = required.every(Boolean) ? 'accepted' : 'rejected'
  } catch (error) {
    evidence.error = safeError(error)
  }
  return finish(evidence, outputDir, evidence.outcome === 'accepted' ? 0 : 1)
}

async function fetchAllD1Databases(accountId, apiToken) {
  const collected = []
  for (let page = 1; page <= 100; page += 1) {
    const body = await cloudflareJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database?page=${page}&per_page=100`, apiToken)
    const rows = Array.isArray(body?.result) ? body.result : []
    collected.push(...rows)
    if (page >= Number(body?.result_info?.total_pages ?? 1) || rows.length === 0) break
  }
  if (collected.length === 0) throw new Error('account_d1_inventory_empty')
  return collected
}

async function cloudflareJson(url, apiToken) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${apiToken}` } })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) throw new Error(`cloudflare_get_failed_http_${response.status}`)
  return body
}

function runD1Select(configPath, databaseName, sql) {
  const normalized = String(sql).trim()
  const statements = normalized.split(';').map((item) => item.trim()).filter(Boolean)
  if (statements.length === 0 || statements.some((statement) => !/^SELECT\b/i.test(statement))) {
    throw new Error('non_select_statement_rejected')
  }
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', databaseName, '--remote', '--json', '--config', configPath, '--command', normalized], {
    cwd: process.cwd(), encoding: 'utf8', env: process.env, maxBuffer: 20 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function flattenRows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => Array.isArray(group?.results)
    ? group.results
    : Array.isArray(group?.result?.[0]?.results)
      ? group.result[0].results
      : [])
}

function balancedJsonEnd(text, start) {
  const stack = []
  let inString = false
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') { inString = true; continue }
    if (char === '[' || char === '{') stack.push(char)
    else if (char === ']' || char === '}') {
      if (stack.pop() !== (char === ']' ? '[' : '{')) return null
      if (stack.length === 0) return index
    }
  }
  return null
}

function finish(evidence, outputDir, exitCode) {
  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, `evidence-${evidence.mode}.json`)
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `outcome=${evidence.outcome}\nevidence_path=${outputPath}\n`)
  console.log(JSON.stringify({ outputPath, outcome: evidence.outcome, gates: evidence.gates, storage: evidence.storage, data: evidence.data, error: evidence.error }, null, 2))
  if (exitCode !== 0) process.exitCode = exitCode
  return evidence
}

function json(file) { return JSON.parse(fs.readFileSync(file, 'utf8')) }
function tomlValue(source, key) { return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null }
function cronValue(source) { return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null }
function sqlText(value) { return String(value ?? '').replace(/'/g, "''") }
function finite(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }
function mb(value) { return Math.round((Number(value) / MB) * 100) / 100 }
function numberFromRows(rows, key) { const value = Number(rows.find((row) => Object.hasOwn(row, key))?.[key]); return Number.isFinite(value) ? value : null }
function minutesSince(value) { const timestamp = Date.parse(String(value ?? '')); return Number.isFinite(timestamp) ? Math.round(((Date.now() - timestamp) / 60000) * 100) / 100 : null }
function stripAnsi(value) { return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '') }
function safeText(value) { return String(value ?? '').replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').replace(/[0-9a-f]{32,}/gi, '[redacted-id]').slice(0, 240) }
function safeError(error) { return safeText(error instanceof Error ? error.message : error) }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runObserver().catch((error) => { console.error(safeError(error)); process.exit(1) })
}