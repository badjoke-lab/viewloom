import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PROVIDER = 'twitch'
const DATABASE_NAME = 'vl_twitch_hot'
const QUERY_CONFIG = 'workers/collector-twitch/wrangler.category-permanent.toml'
const CANDIDATE_CONFIG = 'execution-packages/twitch-category-source-v2-observation/wrangler.toml'
const ROLLBACK_CONFIG = 'workers/collector-twitch/wrangler.category-permanent.toml'
const GENERATED_DIR = 'workers/collector-twitch/.generated-v2-observation'
const OUTPUT_DIR = process.env.OUTPUT_DIR || 'artifacts/12a5-twitch-category-source-v2-observation/run'
const POLL_INTERVAL_MS = 30_000
const MAX_OBSERVATION_MS = 16 * 60_000
const DEPLOY_TIMEOUT_MS = 8 * 60_000

fs.mkdirSync(OUTPUT_DIR, { recursive: true })
const evidence = {
  schemaVersion: 'viewloom-12a5-twitch-category-source-v2-observation-v1',
  status: 'observation_incomplete',
  phase: '12A-5B-R2',
  trackingIssue: 659,
  provider: PROVIDER,
  observedAt: new Date().toISOString(),
  package: {
    packagePr: 685,
    acceptedCandidatePackagePr: 682,
    acceptedCandidatePackageAcceptancePr: 684,
    contractVersion: 'category-source-v2-candidate',
  },
  executionBoundary: {
    immediateStart: true,
    preStartSleepMs: 0,
    pollIntervalMs: POLL_INTERVAL_MS,
    maximumObservationMs: MAX_OBSERVATION_MS,
    candidateConfig: CANDIDATE_CONFIG,
    rollbackConfig: ROLLBACK_CONFIG,
    directD1Statements: ['SELECT', 'WITH'],
  },
  preflight: null,
  generation: null,
  candidateDeployment: { attempted: false, success: false, summary: null },
  observation: {
    startedAt: null,
    completedAt: null,
    polls: 0,
    snapshots: [],
    consecutiveSnapshotPass: false,
    stateIntegrityPass: false,
    dictionaryResolutionPass: false,
    providerSeparationPass: false,
    freshnessPass: false,
  },
  rollback: { attempted: false, success: false, summary: null },
  decision: {
    semanticMappingAuthorized: false,
    stabilityClockStartAuthorized: false,
    finalModeAuthorized: false,
    publicCategoryUiAuthorized: false,
  },
  error: null,
}

let candidateDeploymentAttempted = false
try {
  const latest = firstRow(runD1Select(`
    SELECT
      bucket_minute,
      collected_at,
      stream_count,
      total_viewers,
      covered_pages,
      has_more,
      source_mode,
      json_extract(payload_json, '$.categoryContractVersion') AS category_contract_version,
      json_extract(payload_json, '$.provider') AS payload_provider
    FROM minute_snapshots
    WHERE provider = '${PROVIDER}'
    ORDER BY bucket_minute DESC
    LIMIT 1
  `))
  const status = firstRow(runD1Select(`
    SELECT provider,status,last_attempt_at,last_success_at,last_failure_at,last_error,
      latest_bucket_minute,latest_collected_at,latest_stream_count,latest_total_viewers,
      covered_pages,has_more,updated_at
    FROM collector_status
    WHERE provider = '${PROVIDER}'
  `))
  if (!latest?.bucket_minute || latest.source_mode !== 'real' || Number(latest.stream_count) <= 0) {
    throw new Error('preflight_latest_snapshot_invalid')
  }
  if (status?.status !== 'ok') throw new Error('preflight_collector_not_ok')
  evidence.preflight = { latest, status }

  evidence.generation = runCommand(process.execPath, [
    'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  ], 60_000)

  candidateDeploymentAttempted = true
  evidence.candidateDeployment.attempted = true
  evidence.candidateDeployment.summary = runWranglerDeploy(CANDIDATE_CONFIG)
  evidence.candidateDeployment.success = true
  evidence.observation.startedAt = new Date().toISOString()

  const deadline = Date.now() + MAX_OBSERVATION_MS
  while (Date.now() <= deadline) {
    evidence.observation.polls += 1
    const snapshots = queryCandidateSnapshots(latest.bucket_minute)
    const pair = findConsecutiveValidPair(snapshots)
    if (pair) {
      evidence.observation.snapshots = pair
      evidence.observation.consecutiveSnapshotPass = true
      evidence.observation.stateIntegrityPass = pair.every(snapshotStateIntegrityPass)
      evidence.observation.dictionaryResolutionPass = pair.every((row) => Number(row.unresolved_category_ids) === 0)
      evidence.observation.providerSeparationPass = pair.every((row) => row.payload_provider === PROVIDER)
      evidence.observation.freshnessPass = pair.every((row) => snapshotFresh(row.collected_at, 20))
      if (
        evidence.observation.stateIntegrityPass
        && evidence.observation.dictionaryResolutionPass
        && evidence.observation.providerSeparationPass
        && evidence.observation.freshnessPass
      ) break
    }
    if (Date.now() + POLL_INTERVAL_MS > deadline) break
    await sleep(POLL_INTERVAL_MS)
  }
  evidence.observation.completedAt = new Date().toISOString()
  if (!evidence.observation.consecutiveSnapshotPass) throw new Error('two_consecutive_v2_snapshots_missing')
  if (!evidence.observation.stateIntegrityPass) throw new Error('v2_snapshot_state_integrity_failed')
  if (!evidence.observation.dictionaryResolutionPass) throw new Error('v2_dictionary_resolution_failed')
  if (!evidence.observation.providerSeparationPass) throw new Error('v2_provider_separation_failed')
  if (!evidence.observation.freshnessPass) throw new Error('v2_snapshot_freshness_failed')
} catch (error) {
  evidence.error = safeError(error)
} finally {
  if (candidateDeploymentAttempted) {
    evidence.rollback.attempted = true
    try {
      evidence.rollback.summary = runWranglerDeploy(ROLLBACK_CONFIG)
      evidence.rollback.success = true
    } catch (error) {
      evidence.rollback.summary = { error: safeError(error) }
      evidence.rollback.success = false
      if (!evidence.error) evidence.error = `rollback_failed:${safeError(error)}`
    }
  }
  fs.rmSync(GENERATED_DIR, { recursive: true, force: true })
}

if (
  evidence.candidateDeployment.success
  && evidence.observation.consecutiveSnapshotPass
  && evidence.observation.stateIntegrityPass
  && evidence.observation.dictionaryResolutionPass
  && evidence.observation.providerSeparationPass
  && evidence.observation.freshnessPass
  && evidence.rollback.success
  && !evidence.error
) evidence.status = 'observation_complete'
else evidence.status = 'observation_failed'

const outputPath = path.join(OUTPUT_DIR, 'evidence.json')
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=${evidence.status}\noutput_path=${outputPath}\n`)
}
console.log(JSON.stringify({ status: evidence.status, outputPath, error: evidence.error }, null, 2))
if (evidence.status !== 'observation_complete') process.exitCode = 1

function queryCandidateSnapshots(afterBucket) {
  return runD1Select(`
    SELECT
      m.bucket_minute,
      m.collected_at,
      m.stream_count,
      m.total_viewers,
      m.covered_pages,
      m.has_more,
      m.source_mode,
      json_extract(m.payload_json, '$.provider') AS payload_provider,
      json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version,
      json_extract(m.payload_json, '$.categorySourceStateEncoding.format') AS state_encoding_format,
      CAST(json_extract(m.payload_json, '$.categorySourceStateEncoding.itemCount') AS INTEGER) AS state_item_count,
      length(CAST(json_extract(m.payload_json, '$.categorySourceStateEncoding.packedHex') AS TEXT)) AS packed_hex_characters,
      CAST(json_extract(m.payload_json, '$.categorySourceStateCounts.bothPresent') AS INTEGER) AS both_present,
      CAST(json_extract(m.payload_json, '$.categorySourceStateCounts.bothEmpty') AS INTEGER) AS both_empty,
      CAST(json_extract(m.payload_json, '$.categorySourceStateCounts.providerIdOnly') AS INTEGER) AS provider_id_only,
      CAST(json_extract(m.payload_json, '$.categorySourceStateCounts.categoryNameOnly') AS INTEGER) AS category_name_only,
      json_array_length(json_extract(m.payload_json, '$.categoryIds')) AS category_id_count,
      json_array_length(json_extract(m.payload_json, '$.categoryRefs')) AS category_ref_count,
      length(m.payload_json) AS payload_bytes,
      (
        SELECT COUNT(*) FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type = 'null'
      ) AS null_ref_count,
      (
        SELECT COUNT(*) FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type != 'null'
      ) AS present_ref_count,
      (
        SELECT COUNT(*) FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type != 'null'
          AND (CAST(ref.value AS INTEGER) < 0 OR CAST(ref.value AS INTEGER) >= json_array_length(json_extract(m.payload_json, '$.categoryIds')))
      ) AS invalid_ref_count,
      (
        SELECT COUNT(*)
        FROM json_each(json_extract(m.payload_json, '$.categoryIds')) AS category_id
        LEFT JOIN provider_category_dictionary AS d
          ON d.provider = '${PROVIDER}'
         AND d.category_id = CAST(category_id.value AS TEXT)
        WHERE d.category_id IS NULL
      ) AS unresolved_category_ids
    FROM minute_snapshots AS m
    WHERE m.provider = '${PROVIDER}'
      AND m.bucket_minute > '${sqlText(afterBucket)}'
      AND json_extract(m.payload_json, '$.categoryContractVersion') = 'category-source-v2-candidate'
    ORDER BY m.bucket_minute
    LIMIT 12
  `)
}

function findConsecutiveValidPair(rows) {
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1]
    const current = rows[index]
    if (bucketDifferenceMinutes(previous.bucket_minute, current.bucket_minute) !== 5) continue
    if (previous.source_mode !== 'real' || current.source_mode !== 'real') continue
    if (Number(previous.stream_count) <= 0 || Number(current.stream_count) <= 0) continue
    return [previous, current]
  }
  return null
}

function snapshotStateIntegrityPass(row) {
  const streamCount = Number(row.stream_count)
  const itemCount = Number(row.state_item_count)
  const bothPresent = Number(row.both_present)
  const bothEmpty = Number(row.both_empty)
  const providerOnly = Number(row.provider_id_only)
  const nameOnly = Number(row.category_name_only)
  const expectedHex = Math.ceil(itemCount / 4) * 2
  return row.category_contract_version === 'category-source-v2-candidate'
    && row.state_encoding_format === '2bit-hex-v1'
    && itemCount === streamCount
    && Number(row.category_ref_count) === streamCount
    && bothPresent + bothEmpty + providerOnly + nameOnly === streamCount
    && Number(row.present_ref_count) === bothPresent
    && Number(row.null_ref_count) === bothEmpty + providerOnly + nameOnly
    && Number(row.invalid_ref_count) === 0
    && Number(row.packed_hex_characters) === expectedHex
    && Number(row.payload_bytes) > 0
}

function runWranglerDeploy(config) {
  return runCommand('wrangler', ['deploy', '--config', config], DEPLOY_TIMEOUT_MS)
}

function runD1Select(sql) {
  const statements = sql.split(';').map((part) => part.trim()).filter(Boolean)
  if (statements.some((part) => !/^(SELECT|WITH)\b/i.test(part))) throw new Error('non_select_statement_rejected')
  const result = spawnSync('wrangler', [
    'd1', 'execute', DATABASE_NAME, '--remote', '--json', '--config', QUERY_CONFIG, '--command', sql,
  ], { encoding: 'utf8', env: process.env, maxBuffer: 40 * 1024 * 1024, timeout: 120_000 })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function runCommand(command, args, timeout) {
  const result = spawnSync(command, args, {
    encoding: 'utf8', env: process.env, maxBuffer: 40 * 1024 * 1024, timeout,
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`${command}_failed:${safeText(result.stderr || result.stdout)}`)
  return { command, args, output: safeText(result.stdout || result.stderr) }
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
    if (char === '"') inString = true
    else if (char === '[' || char === '{') stack.push(char)
    else if (char === ']' || char === '}') {
      const open = stack.pop()
      if ((char === ']' && open !== '[') || (char === '}' && open !== '{')) return null
      if (stack.length === 0) return index
    }
  }
  return null
}

function firstRow(rows) { return Array.isArray(rows) && rows.length > 0 ? rows[0] : null }
function bucketDifferenceMinutes(a, b) { return (Date.parse(b) - Date.parse(a)) / 60_000 }
function snapshotFresh(value, minutes) { const time = Date.parse(value); return Number.isFinite(time) && Date.now() - time <= minutes * 60_000 }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function sqlText(value) { return String(value).replaceAll("'", "''") }
function stripAnsi(value) { return value.replace(/\u001b\[[0-9;]*m/g, '') }
function safeText(value) { return stripAnsi(String(value ?? '')).replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(-4000) }
function safeError(error) { return safeText(error instanceof Error ? error.message : String(error)) }
