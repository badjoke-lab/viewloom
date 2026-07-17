import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  activeTomlValue,
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
  projectTwitchStorage,
} from './run-12a4-twitch-category-capture-canary-execution.mjs'

const REQUEST_CONFIRMATION = 'RUN_READ_ONLY_TWITCH_STORAGE_PREFLIGHT'
const LATEST_SNAPSHOT_FRESHNESS_MAX_MINUTES = 20
const REQUIRED_TABLES = [
  'minute_snapshots',
  'provider_category_dictionary',
  'streamer_intraday_rollups',
  'intraday_rollup_status',
]

export function inspectRequest(request, contract) {
  const failures = []
  const check = (name, condition, actual = undefined) => {
    if (!condition) failures.push({ name, actual })
  }

  check('request present', Boolean(request), request)
  if (request) {
    check(
      'request schema',
      request.schemaVersion === 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-request-v1',
      request.schemaVersion,
    )
    check('request status', request.status === 'requested', request.status)
    check('provider Twitch', request.provider === 'twitch', request.provider)
    check('one time', request.oneTime === true, request.oneTime)
    check('confirmation', request.confirmation === REQUEST_CONFIRMATION, request.confirmation)
    check('tracking issue', request.trackingIssue === 519, request.trackingIssue)
    check('package PR', request.acceptedPackagePr === contract.acceptedInputs.twitchPackagePr, request.acceptedPackagePr)
    check(
      'package merge',
      request.acceptedPackageMergeSha === contract.acceptedInputs.twitchPackageMergeSha,
      request.acceptedPackageMergeSha,
    )
    check('execution PR', request.acceptedExecutionPr === contract.acceptedInputs.twitchExecutionPr, request.acceptedExecutionPr)
    check(
      'execution merge',
      request.acceptedExecutionMergeSha === contract.acceptedInputs.twitchExecutionMergeSha,
      request.acceptedExecutionMergeSha,
    )
    check(
      'execution acceptance PR',
      request.acceptedExecutionAcceptancePr === contract.acceptedInputs.executionAcceptancePr,
      request.acceptedExecutionAcceptancePr,
    )
    check(
      'execution acceptance merge',
      request.acceptedExecutionAcceptanceMergeSha === contract.acceptedInputs.executionAcceptanceMergeSha,
      request.acceptedExecutionAcceptanceMergeSha,
    )
    check('read only', request.readOnly === true, request.readOnly)
    check('worker deployment forbidden', request.workerDeploymentAuthorized === false, request.workerDeploymentAuthorized)
    check('D1 mutation forbidden', request.d1MutationAuthorized === false, request.d1MutationAuthorized)
    check('trigger creation forbidden', request.triggerCreationAuthorized === false, request.triggerCreationAuthorized)
    check('runtime capture forbidden', request.runtimeCaptureAuthorized === false, request.runtimeCaptureAuthorized)
  }

  return { ok: failures.length === 0, failures }
}

export function assertReadOnlySql(sql) {
  const statements = String(sql)
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  if (statements.length === 0) throw new Error('readonly_sql_empty')
  for (const statement of statements) {
    if (!/^SELECT\b/i.test(statement)) {
      throw new Error(`readonly_sql_violation:${statement.slice(0, 120)}`)
    }
  }
  return statements.length
}

export function evaluateLatestSnapshot(row, observedAt = new Date()) {
  if (!row) {
    return {
      present: false,
      freshnessMinutes: null,
      authenticated: false,
      nonempty: false,
      pass: false,
    }
  }

  const snapshotTime = parseDate(row.collected_at ?? row.bucket_minute)
  const freshnessMinutes = snapshotTime
    ? Math.max(0, (observedAt.getTime() - snapshotTime.getTime()) / 60000)
    : Number.NaN
  const sourceMode = String(row.source_mode ?? '').trim().toLowerCase()
  const authenticated = sourceMode === 'authenticated' || sourceMode === 'real'
  const streamCount = Number(row.stream_count)
  const totalViewers = Number(row.total_viewers)
  const nonempty = Number.isFinite(streamCount) && streamCount > 0

  return {
    present: true,
    bucketMinute: row.bucket_minute ?? null,
    collectedAt: row.collected_at ?? null,
    streamCount: Number.isFinite(streamCount) ? streamCount : null,
    totalViewers: Number.isFinite(totalViewers) ? totalViewers : null,
    sourceMode: row.source_mode ?? null,
    freshnessMinutes: Number.isFinite(freshnessMinutes) ? round(freshnessMinutes) : null,
    authenticated,
    nonempty,
    pass: Number.isFinite(freshnessMinutes)
      && freshnessMinutes <= LATEST_SNAPSHOT_FRESHNESS_MAX_MINUTES
      && authenticated
      && nonempty,
  }
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function evidenceDigest(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`
}

export function parseLastJson(output) {
  const source = stripAnsi(String(output ?? '')).trim()
  if (!source) throw new Error('wrangler_json_output_missing')

  for (let start = 0; start < source.length; start += 1) {
    const opening = source[start]
    if (opening !== '[' && opening !== '{') continue

    const stack = []
    let inString = false
    let escaped = false

    for (let index = start; index < source.length; index += 1) {
      const character = source[index]

      if (inString) {
        if (escaped) {
          escaped = false
        } else if (character === '\\') {
          escaped = true
        } else if (character === '"') {
          inString = false
        }
        continue
      }

      if (character === '"') {
        inString = true
        continue
      }

      if (character === '{' || character === '[') {
        stack.push(character)
        continue
      }

      if (character !== '}' && character !== ']') continue
      const expectedOpening = character === '}' ? '{' : '['
      if (stack.at(-1) !== expectedOpening) break
      stack.pop()

      if (stack.length === 0) {
        const candidate = source.slice(start, index + 1)
        try {
          return JSON.parse(candidate)
        } catch {
          break
        }
      }
    }
  }

  throw new Error('wrangler_json_output_missing')
}

async function execute() {
  const contractPath = process.env.CONTRACT_PATH
    ?? 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json'
  const requestPath = process.env.REQUEST_PATH
    ?? 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json'
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()

  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')
  if (process.env.GITHUB_REF && process.env.GITHUB_REF !== 'refs/heads/main') {
    throw new Error('main_ref_required')
  }

  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
  const request = fs.existsSync(requestPath)
    ? JSON.parse(fs.readFileSync(requestPath, 'utf8'))
    : null
  const inspected = inspectRequest(request, contract)
  if (!inspected.ok) {
    throw new Error(`preflight_request_rejected:${JSON.stringify(inspected.failures)}`)
  }

  const normalConfigPath = path.resolve('workers/collector-twitch/wrangler.toml')
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const serviceName = activeTomlValue(normalConfig, 'name')
  const databaseName = activeTomlValue(normalConfig, 'database_name')
  const databaseId = activeTomlValue(normalConfig, 'database_id')
  const cadence = cronFromConfig(normalConfig)

  if (
    serviceName !== contract.identity.serviceName
    || databaseName !== contract.identity.databaseName
    || databaseId !== contract.identity.databaseId
    || cadence !== contract.identity.normalCadence
  ) {
    throw new Error('twitch_identity_mismatch')
  }

  const observedAt = new Date()
  const [databaseInfo, accountDatabases, workerSettings] = await Promise.all([
    fetchD1Info(accountId, apiToken, databaseId),
    fetchAllD1Databases(accountId, apiToken),
    fetchWorkerSettings(accountId, apiToken, serviceName),
  ])

  const accountCurrentBytes = accountDatabases.reduce(
    (sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0),
    0,
  )
  const storage = projectTwitchStorage(
    databaseInfo.file_size ?? databaseInfo.fileSize ?? 0,
    accountCurrentBytes,
  )
  const bindings = canaryBindingsFromSettings(workerSettings)
  const bindingsPass = canaryBindingsAbsent(bindings)
  const queryEvidence = runReadOnlyQueries(normalConfigPath)
  const schemaPass = REQUIRED_TABLES.every((table) => queryEvidence.tables.includes(table))
  const providerLeakagePass = queryEvidence.providerLeakageRows === 0
  const latestSnapshot = evaluateLatestSnapshot(queryEvidence.latestSnapshot, observedAt)

  const coreEvidence = {
    schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-evidence-v1',
    provider: 'twitch',
    observedAt: observedAt.toISOString(),
    sourceCommitSha: process.env.GITHUB_SHA ?? null,
    request: {
      requestedAt: request.requestedAt,
      confirmation: request.confirmation,
      oneTime: request.oneTime,
    },
    identity: {
      serviceName,
      databaseName,
      databaseId,
      cadence,
    },
    readOnlyBoundary: {
      directCloudflareApiMethods: ['GET'],
      d1Statements: ['SELECT'],
      workerDeployment: false,
      workerDeletion: false,
      workerSettingsMutation: false,
      d1RowsWritten: 0,
      remoteMigration: false,
      triggerCreated: false,
      runtimeCaptureStarted: false,
      kickChanged: false,
    },
    storage,
    schema: {
      requiredTables: REQUIRED_TABLES,
      observedTables: queryEvidence.tables,
      pass: schemaPass,
    },
    bindings: {
      canaryEnabled: bindings.enabled,
      canaryProvider: bindings.provider,
      canaryStartedAt: bindings.startedAt,
      canaryUntil: bindings.until,
      canaryAttempt: bindings.attempt,
      categoryCaptureDirectFlagPresent: bindings.categoryCaptureDirectFlagPresent,
      pass: bindingsPass,
    },
    providerLeakageRows: queryEvidence.providerLeakageRows,
    providerLeakagePass,
    twitchDictionaryRows: queryEvidence.twitchDictionaryRows,
    latestCategoryStatus: queryEvidence.latestCategoryStatus,
    latestSnapshot,
    gates: {
      storagePass: storage.pass,
      providerStoragePass: storage.providerPass,
      accountStoragePass: storage.accountPass,
      schemaPass,
      providerLeakagePass,
      bindingsPass,
      latestSnapshotPass: latestSnapshot.pass,
      allReadOnlyGatesPass: storage.pass
        && schemaPass
        && providerLeakagePass
        && bindingsPass
        && latestSnapshot.pass,
      productionMutationPerformed: false,
      triggerCreated: false,
      runtimeCaptureStarted: false,
    },
    outcome: 'unknown',
  }

  coreEvidence.outcome = coreEvidence.gates.allReadOnlyGatesPass
    ? 'accepted_candidate'
    : 'rejected_candidate'

  const digest = evidenceDigest(coreEvidence)
  const evidence = {
    ...coreEvidence,
    evidence: {
      digestAlgorithm: 'sha256',
      digest,
      sanitizedJsonOnly: true,
      rawPayloadRowsReturned: false,
      channelIdentitiesReturned: false,
      credentialsReturned: false,
    },
  }

  const outputPath = path.resolve(contract.evidence.artifactPath)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)

  writeOutput('evidence_path', outputPath)
  writeOutput('outcome', evidence.outcome)
  writeOutput('observed_at', evidence.observedAt)
  writeOutput('evidence_digest', digest)
  writeOutput('provider_current_mb', storage.providerCurrentMb)
  writeOutput('projected_ninety_day_mb', storage.projectedNinetyDaySizeMb)
  writeOutput('projected_provider_headroom_mb', storage.projectedProviderHeadroomMb)
  writeOutput('projected_account_headroom_mb', storage.projectedAccountWideHeadroomMb)

  console.log(JSON.stringify({
    outputPath,
    outcome: evidence.outcome,
    observedAt: evidence.observedAt,
    digest,
    storage,
    gates: evidence.gates,
  }, null, 2))

  if (!evidence.gates.allReadOnlyGatesPass) process.exit(1)
}

function runReadOnlyQueries(configPath) {
  const sql = `
SELECT name AS table_name FROM sqlite_master WHERE type = 'table' AND name IN ('minute_snapshots', 'provider_category_dictionary', 'streamer_intraday_rollups', 'intraday_rollup_status');
SELECT COUNT(*) AS twitch_dictionary_rows FROM provider_category_dictionary WHERE provider = 'twitch';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider != 'twitch')
) AS provider_leakage_rows;
SELECT category_observed_streamers, category_observed_samples, category_missing_samples, category_coverage_state FROM intraday_rollup_status WHERE provider = 'twitch' ORDER BY day DESC LIMIT 1;
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode FROM minute_snapshots WHERE provider = 'twitch' ORDER BY bucket_minute DESC LIMIT 1;
`.trim()

  assertReadOnlySql(sql)
  const result = runCommand('pnpm', [
    'dlx',
    'wrangler@4',
    'd1',
    'execute',
    'vl_twitch_hot',
    '--remote',
    '--json',
    '--config',
    configPath,
    '--command',
    sql,
  ])

  if (result.code !== 0) {
    throw new Error(`d1_readonly_query_failed:${sanitize(result.output)}`)
  }

  const rows = flattenD1Rows(parseLastJson(result.stdout || result.output))
  return {
    tables: rows
      .filter((row) => Object.hasOwn(row, 'table_name'))
      .map((row) => String(row.table_name))
      .sort(),
    twitchDictionaryRows: numberFromRows(rows, 'twitch_dictionary_rows'),
    providerLeakageRows: numberFromRows(rows, 'provider_leakage_rows'),
    latestCategoryStatus: rows.find((row) => Object.hasOwn(row, 'category_coverage_state')) ?? null,
    latestSnapshot: rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null,
  }
}

async function fetchD1Info(accountId, apiToken, databaseId) {
  const payload = await cloudflareGet(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`,
    apiToken,
  )
  return payload.result ?? {}
}

async function fetchAllD1Databases(accountId, apiToken) {
  const collected = []
  for (let page = 1; page <= 100; page += 1) {
    const payload = await cloudflareGet(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database?page=${page}&per_page=100`,
      apiToken,
    )
    const result = Array.isArray(payload.result) ? payload.result : []
    collected.push(...result)
    const totalPages = Number(payload?.result_info?.total_pages ?? 1)
    if (page >= totalPages || result.length === 0) break
  }

  if (collected.length === 0) throw new Error('account_d1_inventory_empty')
  return collected
}

async function fetchWorkerSettings(accountId, apiToken, serviceName) {
  return cloudflareGet(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`,
    apiToken,
  )
}

async function cloudflareGet(url, apiToken) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${apiToken}`,
      accept: 'application/json',
    },
  })
  const text = await response.text()

  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`cloudflare_non_json_response:${response.status}`)
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(
      `cloudflare_get_failed:${response.status}:${sanitize(JSON.stringify(payload?.errors ?? payload))}`,
    )
  }
  return payload
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  const stdout = String(result.stdout ?? '').trim()
  const stderr = String(result.stderr ?? '').trim()
  return {
    code: result.status ?? 1,
    stdout,
    stderr,
    output: [stdout, stderr].filter(Boolean).join('\n'),
  }
}

function flattenD1Rows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload]
  const rows = []
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) rows.push(...batch.results)
    if (Array.isArray(batch?.result)) {
      for (const item of batch.result) {
        if (Array.isArray(item?.results)) rows.push(...item.results)
      }
    }
  }
  return rows
}

function numberFromRows(rows, key) {
  const row = rows.find((item) => Object.hasOwn(item, key))
  const value = Number(row?.[key])
  return Number.isFinite(value) ? value : null
}

function cronFromConfig(source) {
  return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
}

function parseDate(value) {
  const parsed = new Date(String(value ?? ''))
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function writeOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value)}\n`)
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Fa-f0-9]{32,}/g, '[redacted]')
    .slice(0, 4000)
}

function round(value) {
  return Math.round(Number(value) * 100) / 100
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute().catch((error) => {
    console.error(sanitize(error instanceof Error ? error.stack : error))
    process.exit(1)
  })
}
