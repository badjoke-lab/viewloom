import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MB = 1024 * 1024
const FIVE_MINUTES_MS = 5 * 60 * 1000
const CONTRACT_PATH = 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json'
const REQUIRED_TABLES = ['minute_snapshots', 'provider_category_dictionary', 'collector_runs', 'collector_status']
const CANARY_BINDINGS = [
  'CATEGORY_CAPTURE_CANARY_ENABLED',
  'CATEGORY_CAPTURE_CANARY_PROVIDER',
  'CATEGORY_CAPTURE_CANARY_STARTED_AT',
  'CATEGORY_CAPTURE_CANARY_UNTIL',
  'CATEGORY_CAPTURE_CANARY_ATTEMPT',
]

export async function runAudit(options = {}) {
  const contract = options.contract ?? json(CONTRACT_PATH)
  const mode = normalizeMode(options.mode ?? process.env.AUDIT_MODE ?? 'checkpoint')
  const observedAt = new Date(options.observedAt ?? Date.now())
  if (!Number.isFinite(observedAt.getTime())) throw new Error('invalid_observed_at')

  const window = resolveAuditWindow(contract, mode, observedAt)
  const twitchPermanentPath = path.resolve(contract.runtime.twitchPermanentConfig)
  const twitchRollbackPath = path.resolve(contract.runtime.twitchRollbackConfig)
  const kickPermanentPath = path.resolve(contract.runtime.kickPermanentConfig)
  const kickRollbackPath = path.resolve(contract.runtime.kickRollbackConfig)
  const twitchPermanent = fs.readFileSync(twitchPermanentPath, 'utf8')
  const twitchRollback = fs.readFileSync(twitchRollbackPath, 'utf8')
  const kickPermanent = fs.readFileSync(kickPermanentPath, 'utf8')
  const kickRollback = fs.readFileSync(kickRollbackPath, 'utf8')

  const identity = buildIdentity({
    twitchPermanent,
    twitchRollback,
    kickPermanent,
    kickRollback,
  })
  const outputDir = path.resolve(
    options.outputDir
      ?? process.env.OUTPUT_DIR
      ?? `artifacts/12a5-twitch-replacement-seven-day-audit/${mode}`,
  )
  fs.mkdirSync(outputDir, { recursive: true })

  const evidence = createEvidence({ contract, mode, observedAt, window, identity })

  try {
    evidence.gates.exactWindowStartPass = window.startAt === contract.window.startAt
    evidence.gates.windowEndPass = mode === 'final'
      ? window.endExclusiveAt === contract.window.endExclusiveAt
      : Date.parse(window.endExclusiveAt) <= Date.parse(contract.window.endExclusiveAt)
    evidence.gates.auditBoundaryReached = observedAt.getTime() >= Date.parse(contract.window.endExclusiveAt)
    evidence.gates.minimumElapsedDaysPass = evidence.gates.auditBoundaryReached
    evidence.gates.expectedSlotIdentityPass = mode === 'final'
      ? window.expectedSlots === Number(contract.window.expectedFinalSlots)
      : window.expectedSlots > 0
    evidence.gates.twitchIdentityPass = identity.twitch.serviceName === contract.runtime.twitchServiceName
      && identity.twitch.databaseName === contract.runtime.twitchDatabaseName
      && identity.twitch.databaseId
      && identity.twitch.databaseId === identity.twitch.rollbackDatabaseId
    evidence.gates.kickIdentityPass = identity.kick.serviceName === contract.runtime.kickServiceName
      && identity.kick.databaseName === contract.runtime.kickDatabaseName
      && identity.kick.databaseId
      && identity.kick.databaseId === identity.kick.rollbackDatabaseId
    evidence.gates.cadencePass = identity.twitch.cadence === contract.runtime.collectorCron
      && identity.twitch.rollbackCadence === contract.runtime.collectorCron
      && identity.kick.cadence === contract.runtime.collectorCron
      && identity.kick.rollbackCadence === contract.runtime.collectorCron
    evidence.gates.publicExposureStillUnauthorized = contract.readOnlyBoundary.publicExposureAuthorized === false
    evidence.gates.productionMutationUnauthorized = contract.readOnlyBoundary.workerDeploymentAuthorized === false
      && contract.readOnlyBoundary.d1MutationAuthorized === false
      && contract.readOnlyBoundary.bindingMutationAuthorized === false
      && contract.readOnlyBoundary.secretMutationAuthorized === false
    evidence.gates.checkpointNonAuthorizing = mode !== 'checkpoint'
      || contract.modes.checkpoint.authorizesAuditAcceptance === false
    evidence.gates.finalDoesNotExposeUi = contract.acceptanceBoundary.passingFinalAuditExposesUi === false

    const accountId = String(options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
    const apiToken = String(options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
    if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

    const [twitchDbInfo, accountDatabases, twitchSettings, kickSettings, twitchHtml, kickHtml] = await Promise.all([
      cloudflareJson(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(identity.twitch.databaseId)}`,
        apiToken,
      ),
      fetchAllD1Databases(accountId, apiToken),
      cloudflareJson(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(identity.twitch.serviceName)}/environments/production/settings`,
        apiToken,
      ),
      cloudflareJson(
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(identity.kick.serviceName)}/environments/production/settings`,
        apiToken,
      ),
      fetchText(new URL(contract.publicSurface.twitchHeatmapPath, contract.publicSurface.baseUrl).toString()),
      fetchText(new URL(contract.publicSurface.kickHeatmapPath, contract.publicSurface.baseUrl).toString()),
    ])

    evidence.bindings.twitch = bindingState(twitchSettings)
    evidence.bindings.kick = bindingState(kickSettings)
    evidence.gates.twitchPermanentBindingPass = evidence.bindings.twitch.permanentCaptureEnabled === true
      && evidence.bindings.twitch.obsoleteCanaryBindingsPresent === false
    evidence.gates.kickPermanentBaselinePass = evidence.bindings.kick.permanentCaptureEnabled === true
      && evidence.bindings.kick.obsoleteCanaryBindingsPresent === false

    const providerBytes = Number(twitchDbInfo?.result?.file_size ?? twitchDbInfo?.result?.fileSize ?? 0)
    const accountBytes = accountDatabases.reduce(
      (sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0),
      0,
    )
    evidence.storage = projectStorage(providerBytes, accountBytes, contract.thresholds)
    evidence.gates.storagePass = evidence.storage.providerPass && evidence.storage.accountPass

    evidence.publicSurface = evaluatePublicSurface({
      twitchHtml,
      kickHtml,
      forbiddenFragments: contract.publicSurface.forbiddenPublicFragments,
    })
    evidence.gates.publicSurfaceContainmentPass = evidence.publicSurface.pass

    const tables = runD1Select(
      twitchPermanentPath,
      identity.twitch.databaseName,
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('minute_snapshots','provider_category_dictionary','collector_runs','collector_status') ORDER BY name;`,
    )
    evidence.schema.observedTables = tables.map((row) => String(row.name ?? '')).filter(Boolean)
    evidence.schema.missingTables = REQUIRED_TABLES.filter(
      (name) => !evidence.schema.observedTables.includes(name),
    )
    evidence.gates.schemaPass = evidence.schema.missingTables.length === 0

    if (evidence.gates.schemaPass) {
      const rows = queryTwitchWindow({
        configPath: twitchPermanentPath,
        databaseName: identity.twitch.databaseName,
        startAt: window.startAt,
        endExclusiveAt: window.endExclusiveAt,
      })
      populateData(evidence, rows, window, contract)
    }

    const kickRows = runD1Select(
      kickPermanentPath,
      identity.kick.databaseName,
      `SELECT (
        (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'kick') +
        (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'kick')
      ) AS kick_provider_leakage_rows;`,
    )
    evidence.data.kickProviderLeakageRows = numberFromRows(kickRows, 'kick_provider_leakage_rows')
    evidence.gates.kickProviderLeakagePass = evidence.data.kickProviderLeakageRows === 0

    const decision = determineOutcome(mode, evidence.gates)
    evidence.status = decision.status
    evidence.outcome = decision.outcome
    evidence.hardStops = decision.failedGates
  } catch (error) {
    evidence.error = safeError(error)
    evidence.status = mode === 'final' ? 'rejected' : 'checkpoint_failed'
    evidence.outcome = evidence.status
    evidence.hardStops = unique([...evidence.hardStops, evidence.error])
  }

  const outputPath = path.join(outputDir, 'evidence.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `mode=${mode}\noutcome=${evidence.outcome}\nevidence_path=${outputPath}\n`,
    )
  }
  console.log(JSON.stringify({
    outputPath,
    mode,
    outcome: evidence.outcome,
    window: evidence.window,
    gates: evidence.gates,
    hardStops: evidence.hardStops,
    storage: evidence.storage,
    error: evidence.error,
  }, null, 2))

  if (!['accepted', 'checkpoint_healthy'].includes(evidence.status)) process.exitCode = 1
  return evidence
}

export function resolveAuditWindow(contract, modeInput, observedAtInput) {
  const mode = normalizeMode(modeInput)
  const observedAt = new Date(observedAtInput)
  const startMs = Date.parse(contract.window.startAt)
  const finalEndMs = Date.parse(contract.window.endExclusiveAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(finalEndMs) || finalEndMs <= startMs) {
    throw new Error('invalid_contract_window')
  }
  if ((finalEndMs - startMs) / FIVE_MINUTES_MS !== Number(contract.window.expectedFinalSlots)) {
    throw new Error('final_slot_identity_mismatch')
  }
  const observedMs = observedAt.getTime()
  if (!Number.isFinite(observedMs)) throw new Error('invalid_observed_at')
  if (mode === 'final' && observedMs < finalEndMs) throw new Error('final_audit_boundary_not_reached')

  const completedBoundaryMs = floorToFiveMinutes(observedMs)
  const endMs = mode === 'final'
    ? finalEndMs
    : Math.min(Math.max(completedBoundaryMs, startMs), finalEndMs)
  if (endMs <= startMs) throw new Error('checkpoint_window_empty')

  return {
    semantics: 'half_open',
    startAt: new Date(startMs).toISOString(),
    endExclusiveAt: new Date(endMs).toISOString(),
    finalEndExclusiveAt: new Date(finalEndMs).toISOString(),
    expectedSlots: (endMs - startMs) / FIVE_MINUTES_MS,
    expectedFinalSlots: (finalEndMs - startMs) / FIVE_MINUTES_MS,
    elapsedHoursAtObservation: round((observedMs - startMs) / 3_600_000),
  }
}

export function analyzeSlots(startAt, endExclusiveAt, observedBucketMinutes) {
  const startMs = Date.parse(startAt)
  const endMs = Date.parse(endExclusiveAt)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error('invalid_slot_window')
  }
  const expected = []
  for (let cursor = startMs; cursor < endMs; cursor += FIVE_MINUTES_MS) {
    expected.push(new Date(cursor).toISOString())
  }

  const counts = new Map()
  const invalid = []
  for (const value of observedBucketMinutes) {
    const timestamp = Date.parse(String(value ?? ''))
    if (!Number.isFinite(timestamp) || timestamp < startMs || timestamp >= endMs || timestamp % FIVE_MINUTES_MS !== 0) {
      invalid.push(String(value ?? ''))
      continue
    }
    const key = new Date(timestamp).toISOString()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const observedSet = new Set(counts.keys())
  const missing = expected.filter((slot) => !observedSet.has(slot))
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([slot, count]) => ({ slot, count }))

  let longestMissingRun = 0
  let currentMissingRun = 0
  for (const slot of expected) {
    if (observedSet.has(slot)) currentMissingRun = 0
    else {
      currentMissingRun += 1
      longestMissingRun = Math.max(longestMissingRun, currentMissingRun)
    }
  }

  return {
    expectedSlots: expected.length,
    observedDistinctSlots: observedSet.size,
    missingSlots: missing,
    missingSlotCount: missing.length,
    duplicateSlots: duplicates,
    duplicateSlotCount: duplicates.length,
    invalidBucketMinutes: invalid,
    invalidBucketCount: invalid.length,
    maximumConsecutiveMissingSlots: longestMissingRun,
    coverageRatio: ratio(observedSet.size, expected.length),
    firstObservedSlot: [...observedSet].sort().at(0) ?? null,
    latestObservedSlot: [...observedSet].sort().at(-1) ?? null,
  }
}

export function determineOutcome(modeInput, gates) {
  const mode = normalizeMode(modeInput)
  const nonAuthorizing = new Set([
    'auditBoundaryReached',
    'minimumElapsedDaysPass',
  ])
  const entries = Object.entries(gates)
    .filter(([name]) => !(mode === 'checkpoint' && nonAuthorizing.has(name)))
  const failedGates = entries.filter(([, value]) => value !== true).map(([name]) => name)
  if (mode === 'checkpoint') {
    return {
      status: failedGates.length === 0 ? 'checkpoint_healthy' : 'checkpoint_failed',
      outcome: failedGates.length === 0 ? 'checkpoint_healthy' : 'checkpoint_failed',
      failedGates,
    }
  }
  return {
    status: failedGates.length === 0 ? 'accepted' : 'rejected',
    outcome: failedGates.length === 0 ? 'accepted_for_separate_evidence_pr' : 'rejected',
    failedGates,
  }
}

function createEvidence({ contract, mode, observedAt, window, identity }) {
  return {
    schemaVersion: 'viewloom-12a5-twitch-replacement-seven-day-audit-evidence-v1',
    status: mode === 'final' ? 'rejected' : 'checkpoint_failed',
    mode,
    provider: 'twitch',
    feature: 'heatmap_category_filter',
    trackingIssue: contract.trackingIssue,
    parentTrackingIssue: contract.parentTrackingIssue,
    hiddenUiTrackingIssue: contract.hiddenUiTrackingIssue,
    observedAt: observedAt.toISOString(),
    governingMainSha: contract.governingMainSha,
    window,
    identity,
    bindings: { twitch: null, kick: null },
    schema: { requiredTables: REQUIRED_TABLES, observedTables: [], missingTables: [] },
    storage: null,
    publicSurface: null,
    data: {
      totalSnapshotRows: null,
      categorySnapshotRows: null,
      categoryRealRows: null,
      categoryNonemptyRows: null,
      structuredCategoryRows: null,
      alignedCategoryRows: null,
      slotAnalysis: null,
      collectorErrorRuns: null,
      twitchProviderLeakageRows: null,
      kickProviderLeakageRows: null,
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
      exactWindowStartPass: false,
      windowEndPass: false,
      auditBoundaryReached: false,
      minimumElapsedDaysPass: false,
      expectedSlotIdentityPass: false,
      twitchIdentityPass: false,
      kickIdentityPass: false,
      cadencePass: false,
      schemaPass: false,
      twitchPermanentBindingPass: false,
      kickPermanentBaselinePass: false,
      storagePass: false,
      publicSurfaceContainmentPass: false,
      slotCoveragePass: false,
      missingSlotsPass: false,
      consecutiveMissingSlotsPass: false,
      duplicateSlotsPass: false,
      invalidBucketMinutesPass: false,
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
      twitchProviderLeakagePass: false,
      kickProviderLeakagePass: false,
      latestSnapshotFreshnessPass: false,
      latestSnapshotRealPass: false,
      latestSnapshotNonemptyPass: false,
      latestSnapshotCategoryPass: false,
      publicExposureStillUnauthorized: false,
      productionMutationUnauthorized: false,
      checkpointNonAuthorizing: false,
      finalDoesNotExposeUi: false,
    },
    warnings: [],
    hardStops: [],
    outcome: mode === 'final' ? 'rejected' : 'checkpoint_failed',
    publicCutoverAuthorized: false,
    productionMutationPerformed: false,
    kickMutationPerformed: false,
    error: null,
  }
}

function buildIdentity({ twitchPermanent, twitchRollback, kickPermanent, kickRollback }) {
  return {
    twitch: {
      serviceName: tomlValue(twitchPermanent, 'name'),
      databaseName: tomlValue(twitchPermanent, 'database_name'),
      databaseId: tomlValue(twitchPermanent, 'database_id'),
      cadence: cronValue(twitchPermanent),
      rollbackDatabaseId: tomlValue(twitchRollback, 'database_id'),
      rollbackCadence: cronValue(twitchRollback),
    },
    kick: {
      serviceName: tomlValue(kickPermanent, 'name'),
      databaseName: tomlValue(kickPermanent, 'database_name'),
      databaseId: tomlValue(kickPermanent, 'database_id'),
      cadence: cronValue(kickPermanent),
      rollbackDatabaseId: tomlValue(kickRollback, 'database_id'),
      rollbackCadence: cronValue(kickRollback),
    },
  }
}

function queryTwitchWindow({ configPath, databaseName, startAt, endExclusiveAt }) {
  const start = sqlText(startAt)
  const end = sqlText(endExclusiveAt)
  return runD1Select(configPath, databaseName, `
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
  WHERE provider = 'twitch'
    AND bucket_minute >= '${start}'
    AND bucket_minute < '${end}'
)
SELECT
  COUNT(*) AS total_snapshot_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' THEN 1 ELSE 0 END) AS category_snapshot_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND source_mode = 'real' THEN 1 ELSE 0 END) AS category_real_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND stream_count > 0 THEN 1 ELSE 0 END) AS category_nonempty_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND category_ids_type = 'array' AND category_refs_type = 'array' THEN 1 ELSE 0 END) AS structured_category_rows,
  SUM(CASE WHEN category_contract_version = 'category-source-v1' AND item_count = ref_count THEN 1 ELSE 0 END) AS aligned_category_rows
FROM scoped;
SELECT bucket_minute AS observed_bucket_minute
FROM scoped
WHERE category_contract_version = 'category-source-v1'
ORDER BY bucket_minute;
SELECT COUNT(*) AS collector_error_runs
FROM collector_runs
WHERE provider = 'twitch'
  AND run_at >= '${start}'
  AND run_at < '${end}'
  AND status = 'error';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'twitch')
) AS twitch_provider_leakage_rows;
SELECT
  COUNT(*) AS dictionary_rows,
  SUM(CASE WHEN TRIM(COALESCE(category_name, '')) = '' THEN 1 ELSE 0 END) AS dictionary_empty_names,
  SUM(CASE WHEN contract_version != 'category-source-v1' THEN 1 ELSE 0 END) AS dictionary_contract_mismatches
FROM provider_category_dictionary
WHERE provider = 'twitch';
WITH observed_ids AS (
  SELECT DISTINCT CAST(ids.value AS TEXT) AS category_id
  FROM minute_snapshots AS snapshots,
       json_each(snapshots.payload_json, '$.categoryIds') AS ids
  WHERE snapshots.provider = 'twitch'
    AND snapshots.bucket_minute >= '${start}'
    AND snapshots.bucket_minute < '${end}'
    AND json_extract(snapshots.payload_json, '$.categoryContractVersion') = 'category-source-v1'
), resolution AS (
  SELECT observed_ids.category_id, dictionary.category_id AS resolved_id
  FROM observed_ids
  LEFT JOIN provider_category_dictionary AS dictionary
    ON dictionary.provider = 'twitch'
   AND dictionary.category_id = observed_ids.category_id
)
SELECT
  COUNT(*) AS distinct_observed_category_ids,
  SUM(CASE WHEN resolved_id IS NULL THEN 1 ELSE 0 END) AS unresolved_category_ids
FROM resolution;
WITH category_snapshots AS (
  SELECT payload_json
  FROM minute_snapshots
  WHERE provider = 'twitch'
    AND bucket_minute >= '${start}'
    AND bucket_minute < '${end}'
    AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'
), refs AS (
  SELECT
    ref.value AS ref_value,
    ref.type AS ref_type,
    COALESCE(json_array_length(category_snapshots.payload_json, '$.categoryIds'), 0) AS category_id_count
  FROM category_snapshots,
       json_each(category_snapshots.payload_json, '$.categoryRefs') AS ref
)
SELECT
  COUNT(*) AS total_category_refs,
  SUM(CASE WHEN ref_type = 'integer' THEN 1 ELSE 0 END) AS present_category_refs,
  SUM(CASE WHEN ref_type = 'null' THEN 1 ELSE 0 END) AS missing_category_refs,
  SUM(CASE WHEN ref_type NOT IN ('integer','null') OR (ref_type = 'integer' AND (CAST(ref_value AS INTEGER) < 0 OR CAST(ref_value AS INTEGER) >= category_id_count)) THEN 1 ELSE 0 END) AS invalid_category_refs
FROM refs;
SELECT
  bucket_minute AS latest_bucket_minute,
  collected_at AS latest_collected_at,
  stream_count AS latest_stream_count,
  total_viewers AS latest_total_viewers,
  source_mode AS latest_source_mode,
  json_extract(payload_json, '$.categoryContractVersion') AS latest_category_contract_version,
  COALESCE(json_array_length(payload_json, '$.categoryIds'), 0) AS latest_category_id_count,
  COALESCE(json_array_length(payload_json, '$.categoryRefs'), 0) AS latest_category_ref_count,
  COALESCE(json_array_length(payload_json, '$.items'), json_array_length(payload_json, '$.data'), 0) AS latest_item_count
FROM minute_snapshots
WHERE provider = 'twitch'
ORDER BY bucket_minute DESC
LIMIT 1;
`.trim())
}

function populateData(evidence, rows, window, contract) {
  const data = evidence.data
  data.totalSnapshotRows = numberFromRows(rows, 'total_snapshot_rows')
  data.categorySnapshotRows = numberFromRows(rows, 'category_snapshot_rows')
  data.categoryRealRows = numberFromRows(rows, 'category_real_rows')
  data.categoryNonemptyRows = numberFromRows(rows, 'category_nonempty_rows')
  data.structuredCategoryRows = numberFromRows(rows, 'structured_category_rows')
  data.alignedCategoryRows = numberFromRows(rows, 'aligned_category_rows')
  data.collectorErrorRuns = numberFromRows(rows, 'collector_error_runs')
  data.twitchProviderLeakageRows = numberFromRows(rows, 'twitch_provider_leakage_rows')
  data.dictionaryRows = numberFromRows(rows, 'dictionary_rows')
  data.dictionaryEmptyNames = numberFromRows(rows, 'dictionary_empty_names')
  data.dictionaryContractMismatches = numberFromRows(rows, 'dictionary_contract_mismatches')
  data.distinctObservedCategoryIds = numberFromRows(rows, 'distinct_observed_category_ids')
  data.unresolvedCategoryIds = numberFromRows(rows, 'unresolved_category_ids')
  data.totalCategoryRefs = numberFromRows(rows, 'total_category_refs')
  data.presentCategoryRefs = numberFromRows(rows, 'present_category_refs')
  data.missingCategoryRefs = numberFromRows(rows, 'missing_category_refs')
  data.invalidCategoryRefs = numberFromRows(rows, 'invalid_category_refs')
  data.categoryReferenceCoverageRatio = ratio(data.presentCategoryRefs, data.totalCategoryRefs)
  data.latestSnapshot = {
    bucketMinute: valueFromRows(rows, 'latest_bucket_minute'),
    collectedAt: valueFromRows(rows, 'latest_collected_at'),
    streamCount: numberFromRows(rows, 'latest_stream_count'),
    totalViewers: numberFromRows(rows, 'latest_total_viewers'),
    sourceMode: valueFromRows(rows, 'latest_source_mode'),
    categoryContractVersion: valueFromRows(rows, 'latest_category_contract_version'),
    categoryIdCount: numberFromRows(rows, 'latest_category_id_count'),
    categoryRefCount: numberFromRows(rows, 'latest_category_ref_count'),
    itemCount: numberFromRows(rows, 'latest_item_count'),
  }
  data.latestSnapshotFreshnessMinutes = minutesSince(
    data.latestSnapshot.collectedAt ?? data.latestSnapshot.bucketMinute,
  )

  const observedBuckets = rows
    .filter((row) => Object.hasOwn(row, 'observed_bucket_minute'))
    .map((row) => row.observed_bucket_minute)
  data.slotAnalysis = analyzeSlots(window.startAt, window.endExclusiveAt, observedBuckets)

  const categoryRows = Number(data.categorySnapshotRows ?? 0)
  const thresholds = contract.thresholds
  evidence.gates.slotCoveragePass = data.slotAnalysis.coverageRatio >= Number(thresholds.minimumCategoryCoverageRatio)
  evidence.gates.missingSlotsPass = data.slotAnalysis.missingSlotCount <= Number(thresholds.maximumMissingSlots)
  evidence.gates.consecutiveMissingSlotsPass = data.slotAnalysis.maximumConsecutiveMissingSlots <= Number(thresholds.maximumConsecutiveMissingSlots)
  evidence.gates.duplicateSlotsPass = data.slotAnalysis.duplicateSlotCount === 0
  evidence.gates.invalidBucketMinutesPass = data.slotAnalysis.invalidBucketCount === 0
  evidence.gates.categoryPayloadStructurePass = categoryRows > 0
    && data.structuredCategoryRows === categoryRows
    && data.alignedCategoryRows === categoryRows
  evidence.gates.categoryRealPass = categoryRows > 0 && data.categoryRealRows === categoryRows
  evidence.gates.categoryNonemptyPass = categoryRows > 0 && data.categoryNonemptyRows === categoryRows
  evidence.gates.categoryReferenceCoveragePass = data.categoryReferenceCoverageRatio >= Number(thresholds.minimumCategoryReferenceCoverageRatio)
  evidence.gates.categoryReferenceValidityPass = data.invalidCategoryRefs <= Number(thresholds.invalidCategoryRefsMax)
  evidence.gates.dictionaryPresencePass = Number(data.dictionaryRows) > 0
    && Number(data.distinctObservedCategoryIds) > 0
  evidence.gates.dictionaryNamePass = data.dictionaryEmptyNames <= Number(thresholds.dictionaryEmptyNamesMax)
  evidence.gates.dictionaryContractPass = data.dictionaryContractMismatches <= Number(thresholds.dictionaryContractMismatchesMax)
  evidence.gates.dictionaryResolutionPass = data.unresolvedCategoryIds <= Number(thresholds.unresolvedCategoryIdsMax)
  evidence.gates.collectorErrorsPass = data.collectorErrorRuns <= Number(thresholds.collectorErrorRunsMax)
  evidence.gates.twitchProviderLeakagePass = data.twitchProviderLeakageRows <= Number(thresholds.providerLeakageRowsMax)
  evidence.gates.latestSnapshotFreshnessPass = Number.isFinite(data.latestSnapshotFreshnessMinutes)
    && data.latestSnapshotFreshnessMinutes <= Number(thresholds.latestSnapshotFreshnessMinutesMax)
  evidence.gates.latestSnapshotRealPass = data.latestSnapshot.sourceMode === 'real'
  evidence.gates.latestSnapshotNonemptyPass = Number(data.latestSnapshot.streamCount) > 0
  evidence.gates.latestSnapshotCategoryPass = data.latestSnapshot.categoryContractVersion === contract.runtime.categoryContractVersion
    && Number(data.latestSnapshot.categoryRefCount) === Number(data.latestSnapshot.itemCount)
}

function projectStorage(providerBytes, accountBytes, thresholds) {
  const providerCurrent = finite(providerBytes)
  const accountCurrent = finite(accountBytes)
  const additional = Number(thresholds.additionalNinetyDayCategoryMb) * MB
  const providerCapacity = Number(thresholds.providerCapacityMb) * MB
  const accountCapacity = Number(thresholds.accountCapacityMb) * MB
  const projectedProvider = providerCurrent + additional
  const projectedAccount = accountCurrent + additional
  return {
    providerCurrentMb: mb(providerCurrent),
    accountCurrentMb: mb(accountCurrent),
    projectedNinetyDaySizeMb: mb(projectedProvider),
    projectedProviderHeadroomMb: mb(providerCapacity - projectedProvider),
    projectedAccountWideSizeMb: mb(projectedAccount),
    projectedAccountWideHeadroomMb: mb(accountCapacity - projectedAccount),
    providerPass: projectedProvider <= Number(thresholds.providerProjectedNinetyDaySizeMbMax) * MB
      && providerCapacity - projectedProvider >= Number(thresholds.providerHeadroomMbMin) * MB,
    accountPass: accountCapacity - projectedAccount >= Number(thresholds.accountWideHeadroomMbMin) * MB,
  }
}

function bindingState(settings) {
  const bindings = Array.isArray(settings?.result?.bindings)
    ? settings.result.bindings
    : Array.isArray(settings?.bindings)
      ? settings.bindings
      : []
  const text = new Map(
    bindings
      .filter((binding) => binding?.type === 'plain_text' && typeof binding?.name === 'string')
      .map((binding) => [binding.name, String(binding.text ?? '')]),
  )
  return {
    permanentCaptureEnabled: text.get('CATEGORY_CAPTURE_ENABLED')?.trim().toLowerCase() === 'true',
    obsoleteCanaryBindingsPresent: CANARY_BINDINGS.some((name) => text.has(name)),
  }
}

function evaluatePublicSurface({ twitchHtml, kickHtml, forbiddenFragments }) {
  const twitchMatches = forbiddenFragments.filter((fragment) => twitchHtml.includes(fragment))
  const kickMatches = forbiddenFragments.filter((fragment) => kickHtml.includes(fragment))
  return {
    twitchForbiddenFragments: twitchMatches,
    kickForbiddenFragments: kickMatches,
    twitchHtmlNonempty: twitchHtml.trim().length > 0,
    kickHtmlNonempty: kickHtml.trim().length > 0,
    pass: twitchMatches.length === 0
      && kickMatches.length === 0
      && twitchHtml.trim().length > 0
      && kickHtml.trim().length > 0,
  }
}

async function fetchAllD1Databases(accountId, apiToken) {
  const collected = []
  for (let page = 1; page <= 100; page += 1) {
    const body = await cloudflareJson(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database?page=${page}&per_page=100`,
      apiToken,
    )
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
  if (!response.ok || body?.success !== true) {
    throw new Error(`cloudflare_get_failed_http_${response.status}`)
  }
  return body
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'ViewLoom-read-only-audit/1.0' },
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`public_surface_get_failed_http_${response.status}`)
  return response.text()
}

function runD1Select(configPath, databaseName, sql) {
  const statements = sql.split(';').map((part) => part.trim()).filter(Boolean)
  if (statements.some((part) => !/^(SELECT|WITH)\b/i.test(part))) {
    throw new Error('non_select_statement_rejected')
  }
  const result = spawnSync(
    'pnpm',
    [
      'dlx',
      'wrangler@4',
      'd1',
      'execute',
      databaseName,
      '--remote',
      '--json',
      '--config',
      configPath,
      '--command',
      sql,
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 40 * 1024 * 1024,
    },
  )
  if (result.status !== 0) {
    throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  }
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function flattenRows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => {
    if (Array.isArray(group?.results)) return group.results
    if (Array.isArray(group?.result?.[0]?.results)) return group.result[0].results
    return []
  })
}

function parseLastJson(value) {
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
    if (char === '"') {
      inString = true
      continue
    }
    if (char === '[' || char === '{') stack.push(char)
    else if (char === ']' || char === '}') {
      if (stack.pop() !== (char === ']' ? '[' : '{')) return null
      if (stack.length === 0) return index
    }
  }
  return null
}

function normalizeMode(value) {
  const mode = String(value ?? '').trim().toLowerCase()
  if (!['checkpoint', 'final'].includes(mode)) throw new Error('invalid_audit_mode')
  return mode
}

function floorToFiveMinutes(timestamp) {
  return Math.floor(timestamp / FIVE_MINUTES_MS) * FIVE_MINUTES_MS
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function tomlValue(source, key) {
  return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
}

function cronValue(source) {
  return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
}

function sqlText(value) {
  return String(value ?? '').replace(/'/g, "''")
}

function finite(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function mb(value) {
  return round(Number(value) / MB)
}

function ratio(numerator, denominator) {
  const n = Number(numerator)
  const d = Number(denominator)
  return Number.isFinite(n) && Number.isFinite(d) && d > 0 ? round(n / d, 6) : 0
}

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(Number(value) * factor) / factor
}

function numberFromRows(rows, key) {
  const value = Number(rows.find((row) => Object.hasOwn(row, key))?.[key])
  return Number.isFinite(value) ? value : null
}

function valueFromRows(rows, key) {
  return rows.find((row) => Object.hasOwn(row, key))?.[key] ?? null
}

function minutesSince(value) {
  const timestamp = Date.parse(String(value ?? ''))
  return Number.isFinite(timestamp) ? round((Date.now() - timestamp) / 60_000) : null
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}

function safeText(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .slice(0, 480)
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : error)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit().catch((error) => {
    console.error(safeError(error))
    process.exit(1)
  })
}
