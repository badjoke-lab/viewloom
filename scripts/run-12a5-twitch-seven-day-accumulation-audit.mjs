import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MB = 1024 * 1024
const CONTRACT_PATH = 'docs/audits/12a5-twitch-seven-day-accumulation-audit-contract.json'
const TWITCH_CONFIG = 'workers/collector-twitch/wrangler.toml'
const REQUIRED_TABLES = ['minute_snapshots', 'provider_category_dictionary', 'collector_runs', 'collector_status']
const CANARY_BINDINGS = [
  'CATEGORY_CAPTURE_CANARY_ENABLED',
  'CATEGORY_CAPTURE_CANARY_PROVIDER',
  'CATEGORY_CAPTURE_CANARY_STARTED_AT',
  'CATEGORY_CAPTURE_CANARY_UNTIL',
  'CATEGORY_CAPTURE_CANARY_ATTEMPT',
]

export async function runAudit(options = {}) {
  const contract = json(CONTRACT_PATH)
  const configPath = path.resolve(TWITCH_CONFIG)
  const config = fs.readFileSync(configPath, 'utf8')
  const serviceName = tomlValue(config, 'name')
  const databaseId = tomlValue(config, 'database_id')
  const databaseName = tomlValue(config, 'database_name')
  const cadence = cronValue(config)
  const outputDir = path.resolve(options.outputDir ?? process.env.OUTPUT_DIR ?? 'artifacts/12a5-twitch-seven-day-accumulation-audit')
  fs.mkdirSync(outputDir, { recursive: true })

  const observedAt = new Date()
  const startAt = String(contract.window.startAt)
  const earliestAuditAt = String(contract.window.earliestAuditAt)
  const elapsedHours = round((observedAt.getTime() - Date.parse(startAt)) / 3_600_000)
  const evidence = {
    schemaVersion: 'viewloom-12a5-twitch-seven-day-accumulation-audit-evidence-v1',
    status: 'rejected',
    provider: 'twitch',
    feature: 'heatmap_category_filter',
    trackingIssue: 650,
    parentTrackingIssue: 635,
    observedAt: observedAt.toISOString(),
    window: { startAt, earliestAuditAt, elapsedHours },
    identity: { serviceName, databaseName, databaseId, cadence },
    bindings: null,
    schema: { requiredTables: REQUIRED_TABLES, observedTables: [], missingTables: [] },
    storage: null,
    data: {
      totalSnapshotRows: null,
      categorySnapshotRows: null,
      expectedCategorySlots: null,
      categoryCoverageRatio: null,
      categoryRealRows: null,
      categoryNonemptyRows: null,
      structuredCategoryRows: null,
      alignedCategoryRows: null,
      firstBucketMinute: null,
      latestBucketMinute: null,
      maxGapMinutes: null,
      gapsOverTenMinutes: null,
      collectorErrorRuns: null,
      providerLeakageRows: null,
      dictionaryRows: null,
      dictionaryEmptyNames: null,
      dictionaryContractMismatches: null,
      distinctObservedCategoryIds: null,
      unresolvedCategoryIds: null,
      totalCategoryRefs: null,
      presentCategoryRefs: null,
      missingCategoryRefs: null,
      invalidCategoryRefs: null,
      categoryReferenceCoverageRatio: null,
      latestSnapshot: null,
      latestSnapshotFreshnessMinutes: null,
    },
    gates: {
      readOnly: true,
      auditBoundaryReached: false,
      minimumElapsedDaysPass: false,
      exactIdentityPass: false,
      cadencePass: false,
      schemaPass: false,
      bindingPass: false,
      storagePass: false,
      minimumCategoryRowsPass: false,
      categoryCoveragePass: false,
      categoryContinuityPass: false,
      categoryPayloadStructurePass: false,
      categoryRealPass: false,
      categoryNonemptyPass: false,
      categoryReferenceCoveragePass: false,
      categoryReferenceValidityPass: false,
      dictionaryPresencePass: false,
      dictionaryNamePass: false,
      dictionaryContractPass: false,
      dictionaryResolutionPass: false,
      collectorErrorsPass: false,
      providerLeakagePass: false,
      latestSnapshotFreshnessPass: false,
      latestSnapshotRealPass: false,
      latestSnapshotNonemptyPass: false,
      latestSnapshotCategoryPass: false,
      hiddenImplementationAccepted: false,
      publicExposureStillDisabled: false,
      kickMutationAuthorized: false,
      productionMutationAuthorized: false,
    },
    warnings: [],
    hardStops: [],
    outcome: 'rejected',
    error: null,
  }

  try {
    if (!serviceName || !databaseId || !databaseName) throw new Error('twitch_identity_missing')
    evidence.gates.auditBoundaryReached = observedAt.getTime() >= Date.parse(earliestAuditAt)
    evidence.gates.minimumElapsedDaysPass = elapsedHours >= Number(contract.window.minimumStableDays) * 24
    evidence.gates.exactIdentityPass = serviceName === contract.runtime.serviceName && databaseName === contract.runtime.databaseName
    evidence.gates.cadencePass = cadence === contract.runtime.collectorCron
    evidence.gates.hiddenImplementationAccepted = contract.hiddenImplementation.accepted === true
    evidence.gates.publicExposureStillDisabled = contract.hiddenImplementation.publicExposureAuthorized === false

    const accountId = String(options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
    const apiToken = String(options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
    if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

    const [dbInfo, databases, settings] = await Promise.all([
      cloudflareJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`, apiToken),
      fetchAllD1Databases(accountId, apiToken),
      cloudflareJson(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, apiToken),
    ])

    evidence.bindings = bindingState(settings)
    evidence.gates.bindingPass = evidence.bindings.permanentCaptureEnabled === true && evidence.bindings.obsoleteCanaryBindingsPresent === false

    const providerBytes = Number(dbInfo?.result?.file_size ?? dbInfo?.result?.fileSize ?? 0)
    const accountBytes = databases.reduce((sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0), 0)
    evidence.storage = projectStorage(providerBytes, accountBytes)
    evidence.gates.storagePass = evidence.storage.providerPass && evidence.storage.accountPass

    const tables = runD1Select(configPath, `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('minute_snapshots','provider_category_dictionary','collector_runs','collector_status') ORDER BY name;`)
    evidence.schema.observedTables = tables.map((row) => String(row.name ?? '')).filter(Boolean)
    evidence.schema.missingTables = REQUIRED_TABLES.filter((name) => !evidence.schema.observedTables.includes(name))
    evidence.gates.schemaPass = evidence.schema.missingTables.length === 0

    if (evidence.gates.schemaPass) {
      const start = sqlText(startAt)
      const rows = runD1Select(configPath, `
WITH scoped AS (
  SELECT
    bucket_minute,
    collected_at,
    stream_count,
    total_viewers,
    source_mode,
    payload_json,
    json_extract(payload_json, '$.categoryContractVersion') AS category_contract_version,
    json_type(payload_json, '$.categoryIds') AS category_ids_type,
    json_type(payload_json, '$.categoryRefs') AS category_refs_type,
    COALESCE(json_array_length(payload_json, '$.items'), json_array_length(payload_json, '$.data'), 0) AS item_count,
    COALESCE(json_array_length(payload_json, '$.categoryRefs'), 0) AS ref_count
  FROM minute_snapshots
  WHERE provider = 'twitch' AND collected_at >= '${start}'
),
ordered AS (
  SELECT *, LAG(bucket_minute) OVER (ORDER BY bucket_minute) AS previous_bucket_minute
  FROM scoped
)
SELECT
  COUNT(*) AS total_snapshot_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' THEN 1 ELSE 0 END) AS category_snapshot_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND source_mode = 'real' THEN 1 ELSE 0 END) AS category_real_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND stream_count > 0 THEN 1 ELSE 0 END) AS category_nonempty_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND category_ids_type = 'array' AND category_refs_type = 'array' THEN 1 ELSE 0 END) AS structured_category_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND item_count = ref_count THEN 1 ELSE 0 END) AS aligned_category_rows,
  MIN(bucket_minute) AS first_bucket_minute,
  MAX(bucket_minute) AS latest_bucket_minute,
  ROUND(MAX(CASE WHEN previous_bucket_minute IS NULL THEN 0 ELSE (julianday(bucket_minute) - julianday(previous_bucket_minute)) * 1440 END), 2) AS max_gap_minutes,
  SUM(CASE WHEN previous_bucket_minute IS NOT NULL AND (julianday(bucket_minute) - julianday(previous_bucket_minute)) * 1440 > 10.01 THEN 1 ELSE 0 END) AS gaps_over_ten_minutes
FROM ordered;
SELECT COUNT(*) AS collector_error_runs FROM collector_runs WHERE provider = 'twitch' AND run_at >= '${start}' AND status = 'error';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'twitch')
) AS provider_leakage_rows;
SELECT
  COUNT(*) AS dictionary_rows,
  SUM(CASE WHEN TRIM(COALESCE(category_name, '')) = '' THEN 1 ELSE 0 END) AS dictionary_empty_names,
  SUM(CASE WHEN contract_version != 'category-source-v1' THEN 1 ELSE 0 END) AS dictionary_contract_mismatches
FROM provider_category_dictionary
WHERE provider = 'twitch';
WITH observed_ids AS (
  SELECT DISTINCT CAST(ids.value AS TEXT) AS category_id
  FROM minute_snapshots AS snapshots, json_each(snapshots.payload_json, '$.categoryIds') AS ids
  WHERE snapshots.provider = 'twitch'
    AND snapshots.collected_at >= '${start}'
    AND json_extract(snapshots.payload_json, '$.categoryContractVersion') = 'category-source-v1'
), resolution AS (
  SELECT observed_ids.category_id, dictionary.category_id AS resolved_id
  FROM observed_ids
  LEFT JOIN provider_category_dictionary AS dictionary
    ON dictionary.provider = 'twitch' AND dictionary.category_id = observed_ids.category_id
)
SELECT
  COUNT(*) AS distinct_observed_category_ids,
  SUM(CASE WHEN resolved_id IS NULL THEN 1 ELSE 0 END) AS unresolved_category_ids
FROM resolution;
WITH category_snapshots AS (
  SELECT payload_json
  FROM minute_snapshots
  WHERE provider = 'twitch'
    AND collected_at >= '${start}'
    AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'
), refs AS (
  SELECT
    ref.value AS ref_value,
    ref.type AS ref_type,
    COALESCE(json_array_length(category_snapshots.payload_json, '$.categoryIds'), 0) AS category_id_count
  FROM category_snapshots, json_each(category_snapshots.payload_json, '$.categoryRefs') AS ref
)
SELECT
  COUNT(*) AS total_category_refs,
  SUM(CASE WHEN ref_type = 'integer' THEN 1 ELSE 0 END) AS present_category_refs,
  SUM(CASE WHEN ref_type = 'null' THEN 1 ELSE 0 END) AS missing_category_refs,
  SUM(CASE WHEN ref_type NOT IN ('integer','null') OR (ref_type = 'integer' AND (CAST(ref_value AS INTEGER) < 0 OR CAST(ref_value AS INTEGER) >= category_id_count)) THEN 1 ELSE 0 END) AS invalid_category_refs
FROM refs;
SELECT
  bucket_minute,
  collected_at,
  stream_count,
  total_viewers,
  source_mode,
  json_extract(payload_json, '$.categoryContractVersion') AS category_contract_version,
  COALESCE(json_array_length(payload_json, '$.categoryIds'), 0) AS category_id_count,
  COALESCE(json_array_length(payload_json, '$.categoryRefs'), 0) AS category_ref_count,
  COALESCE(json_array_length(payload_json, '$.items'), json_array_length(payload_json, '$.data'), 0) AS item_count
FROM minute_snapshots
WHERE provider = 'twitch'
ORDER BY bucket_minute DESC
LIMIT 1;
`.trim())

      evidence.data.totalSnapshotRows = numberFromRows(rows, 'total_snapshot_rows')
      evidence.data.categorySnapshotRows = numberFromRows(rows, 'category_snapshot_rows')
      evidence.data.categoryRealRows = numberFromRows(rows, 'category_real_rows')
      evidence.data.categoryNonemptyRows = numberFromRows(rows, 'category_nonempty_rows')
      evidence.data.structuredCategoryRows = numberFromRows(rows, 'structured_category_rows')
      evidence.data.alignedCategoryRows = numberFromRows(rows, 'aligned_category_rows')
      evidence.data.firstBucketMinute = valueFromRows(rows, 'first_bucket_minute')
      evidence.data.latestBucketMinute = valueFromRows(rows, 'latest_bucket_minute')
      evidence.data.maxGapMinutes = numberFromRows(rows, 'max_gap_minutes')
      evidence.data.gapsOverTenMinutes = numberFromRows(rows, 'gaps_over_ten_minutes')
      evidence.data.collectorErrorRuns = numberFromRows(rows, 'collector_error_runs')
      evidence.data.providerLeakageRows = numberFromRows(rows, 'provider_leakage_rows')
      evidence.data.dictionaryRows = numberFromRows(rows, 'dictionary_rows')
      evidence.data.dictionaryEmptyNames = numberFromRows(rows, 'dictionary_empty_names')
      evidence.data.dictionaryContractMismatches = numberFromRows(rows, 'dictionary_contract_mismatches')
      evidence.data.distinctObservedCategoryIds = numberFromRows(rows, 'distinct_observed_category_ids')
      evidence.data.unresolvedCategoryIds = numberFromRows(rows, 'unresolved_category_ids')
      evidence.data.totalCategoryRefs = numberFromRows(rows, 'total_category_refs')
      evidence.data.presentCategoryRefs = numberFromRows(rows, 'present_category_refs')
      evidence.data.missingCategoryRefs = numberFromRows(rows, 'missing_category_refs')
      evidence.data.invalidCategoryRefs = numberFromRows(rows, 'invalid_category_refs')
      evidence.data.latestSnapshot = rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null
      evidence.data.latestSnapshotFreshnessMinutes = minutesSince(evidence.data.latestSnapshot?.collected_at ?? evidence.data.latestSnapshot?.bucket_minute)

      const expectedSlots = expectedFiveMinuteSlots(startAt, evidence.data.latestBucketMinute)
      evidence.data.expectedCategorySlots = expectedSlots
      evidence.data.categoryCoverageRatio = ratio(evidence.data.categorySnapshotRows, expectedSlots)
      evidence.data.categoryReferenceCoverageRatio = ratio(evidence.data.presentCategoryRefs, evidence.data.totalCategoryRefs)

      const categoryRows = evidence.data.categorySnapshotRows ?? 0
      evidence.gates.minimumCategoryRowsPass = categoryRows >= Number(contract.thresholds.minimumCategorySnapshotRows)
      evidence.gates.categoryCoveragePass = evidence.data.categoryCoverageRatio >= Number(contract.thresholds.minimumCategoryCoverageRatio)
      evidence.gates.categoryContinuityPass = Number(evidence.data.maxGapMinutes) <= Number(contract.thresholds.maximumGapMinutes)
      evidence.gates.categoryPayloadStructurePass = categoryRows > 0
        && evidence.data.structuredCategoryRows === categoryRows
        && evidence.data.alignedCategoryRows === categoryRows
      evidence.gates.categoryRealPass = categoryRows > 0 && evidence.data.categoryRealRows === categoryRows
      evidence.gates.categoryNonemptyPass = categoryRows > 0 && evidence.data.categoryNonemptyRows === categoryRows
      evidence.gates.categoryReferenceCoveragePass = evidence.data.categoryReferenceCoverageRatio >= Number(contract.thresholds.minimumCategoryReferenceCoverageRatio)
      evidence.gates.categoryReferenceValidityPass = evidence.data.invalidCategoryRefs === 0
      evidence.gates.dictionaryPresencePass = Number(evidence.data.dictionaryRows) > 0 && Number(evidence.data.distinctObservedCategoryIds) > 0
      evidence.gates.dictionaryNamePass = evidence.data.dictionaryEmptyNames === 0
      evidence.gates.dictionaryContractPass = evidence.data.dictionaryContractMismatches === 0
      evidence.gates.dictionaryResolutionPass = evidence.data.unresolvedCategoryIds === 0
      evidence.gates.collectorErrorsPass = evidence.data.collectorErrorRuns === 0
      evidence.gates.providerLeakagePass = evidence.data.providerLeakageRows === 0
      evidence.gates.latestSnapshotFreshnessPass = Number.isFinite(evidence.data.latestSnapshotFreshnessMinutes)
        && evidence.data.latestSnapshotFreshnessMinutes <= Number(contract.thresholds.latestSnapshotFreshnessMinutesMax)
      evidence.gates.latestSnapshotRealPass = evidence.data.latestSnapshot?.source_mode === 'real'
      evidence.gates.latestSnapshotNonemptyPass = Number(evidence.data.latestSnapshot?.stream_count) > 0
      evidence.gates.latestSnapshotCategoryPass = evidence.data.latestSnapshot?.category_contract_version === 'category-source-v1'
        && Number(evidence.data.latestSnapshot?.category_ref_count) === Number(evidence.data.latestSnapshot?.item_count)
    }

    const required = Object.entries(evidence.gates)
      .filter(([name]) => !['kickMutationAuthorized', 'productionMutationAuthorized'].includes(name))
      .map(([, value]) => value)
    evidence.outcome = required.every((value) => value === true) ? 'eligible_for_public_cutover_pr' : 'rejected'
    evidence.status = evidence.outcome === 'eligible_for_public_cutover_pr' ? 'accepted' : 'rejected'
    evidence.hardStops = Object.entries(evidence.gates)
      .filter(([name, value]) => !['kickMutationAuthorized', 'productionMutationAuthorized'].includes(name) && value !== true)
      .map(([name]) => name)
  } catch (error) {
    evidence.error = safeError(error)
    evidence.hardStops.push(evidence.error)
  }

  const outputPath = path.join(outputDir, 'evidence.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `outcome=${evidence.outcome}\nevidence_path=${outputPath}\n`)
  console.log(JSON.stringify({ outputPath, outcome: evidence.outcome, gates: evidence.gates, data: evidence.data, storage: evidence.storage, error: evidence.error }, null, 2))
  if (evidence.status !== 'accepted') process.exitCode = 1
  return evidence
}

function projectStorage(providerBytes, accountBytes) {
  const providerCurrent = finite(providerBytes)
  const accountCurrent = finite(accountBytes)
  const projectedProvider = providerCurrent + 48.32 * MB
  const projectedAccount = accountCurrent + 48.32 * MB
  return {
    providerCurrentMb: mb(providerCurrent),
    accountCurrentMb: mb(accountCurrent),
    projectedNinetyDaySizeMb: mb(projectedProvider),
    projectedProviderHeadroomMb: mb(450 * MB - projectedProvider),
    projectedAccountWideSizeMb: mb(projectedAccount),
    projectedAccountWideHeadroomMb: mb(4608 * MB - projectedAccount),
    providerPass: projectedProvider <= 440 * MB && 450 * MB - projectedProvider >= 10 * MB,
    accountPass: 4608 * MB - projectedAccount >= 500 * MB,
  }
}

function bindingState(settings) {
  const bindings = Array.isArray(settings?.result?.bindings) ? settings.result.bindings : Array.isArray(settings?.bindings) ? settings.bindings : []
  const text = new Map(bindings.filter((binding) => binding?.type === 'plain_text' && typeof binding?.name === 'string').map((binding) => [binding.name, String(binding.text ?? '')]))
  return {
    permanentCaptureEnabled: text.get('CATEGORY_CAPTURE_ENABLED')?.trim().toLowerCase() === 'true',
    obsoleteCanaryBindingsPresent: CANARY_BINDINGS.some((name) => text.has(name)),
  }
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

function runD1Select(configPath, sql) {
  if (sql.split(';').map((part) => part.trim()).filter(Boolean).some((part) => !/^(SELECT|WITH)\b/i.test(part))) throw new Error('non_select_statement_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_twitch_hot', '--remote', '--json', '--config', configPath, '--command', sql], {
    cwd: process.cwd(), encoding: 'utf8', env: process.env, maxBuffer: 30 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function flattenRows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => Array.isArray(group?.results) ? group.results : Array.isArray(group?.result?.[0]?.results) ? group.result[0].results : [])
}

function parseLastJson(value) {
  const source = stripAnsi(String(value ?? ''))
  const parsed = []
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '[' && source[start] !== '{') continue
    const end = balancedJsonEnd(source, start)
    if (end === null) continue
    try { parsed.push(JSON.parse(source.slice(start, end + 1))); start = end } catch {}
  }
  if (parsed.length === 0) throw new Error('json_output_missing')
  return parsed.at(-1)
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

function expectedFiveMinuteSlots(startAt, latestBucketMinute) {
  const start = Date.parse(String(startAt))
  const latest = Date.parse(String(latestBucketMinute ?? ''))
  if (!Number.isFinite(start) || !Number.isFinite(latest) || latest < start) return 0
  return Math.floor((latest - start) / 300_000) + 1
}

function json(file) { return JSON.parse(fs.readFileSync(file, 'utf8')) }
function tomlValue(source, key) { return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null }
function cronValue(source) { return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null }
function sqlText(value) { return String(value ?? '').replace(/'/g, "''") }
function finite(value) { const parsed = Number(value); return Number.isFinite(parsed) ? Math.max(0, parsed) : 0 }
function mb(value) { return round(Number(value) / MB) }
function ratio(numerator, denominator) { const n = Number(numerator); const d = Number(denominator); return Number.isFinite(n) && Number.isFinite(d) && d > 0 ? round(n / d, 6) : 0 }
function round(value, digits = 2) { const factor = 10 ** digits; return Math.round(Number(value) * factor) / factor }
function numberFromRows(rows, key) { const value = Number(rows.find((row) => Object.hasOwn(row, key))?.[key]); return Number.isFinite(value) ? value : null }
function valueFromRows(rows, key) { return rows.find((row) => Object.hasOwn(row, key))?.[key] ?? null }
function minutesSince(value) { const timestamp = Date.parse(String(value ?? '')); return Number.isFinite(timestamp) ? round((Date.now() - timestamp) / 60_000) : null }
function stripAnsi(value) { return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '') }
function safeText(value) { return String(value ?? '').replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').replace(/[0-9a-f]{32,}/gi, '[redacted-id]').slice(0, 320) }
function safeError(error) { return safeText(error instanceof Error ? error.message : error) }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit().catch((error) => { console.error(safeError(error)); process.exit(1) })
}
