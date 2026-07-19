import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
  projectTwitchStorage,
} from './run-12a4-twitch-category-capture-canary-execution.mjs'

const REQUIRED_TABLES = [
  'minute_snapshots',
  'provider_category_dictionary',
  'streamer_intraday_rollups',
]

async function execute() {
  const contract = json('docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json')
  const trigger = json(contract.acceptedInputs.triggerPath)
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-twitch-category-canary-post-rollback-acceptance')
  const normalConfigPath = path.resolve('workers/collector-twitch/wrangler.toml')
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseId = tomlValue(normalConfig, 'database_id')
  if (!serviceName || !databaseId) throw new Error('twitch_identity_missing')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-post-rollback-readonly-evidence-v1',
    provider: 'twitch',
    attempt: trigger.attempt,
    observedAt: new Date().toISOString(),
    trigger: {
      status: trigger.status,
      startAt: trigger.startAt,
      until: trigger.until,
      expired: false,
      graceUntil: addMinutes(trigger.until, Number(contract.observation.postExpiryGraceMinutes)),
      packageMergeSha: trigger.packageMergeSha,
      executionPackageMergeSha: trigger.executionPackageMergeSha,
      triggerMergeSha: contract.acceptedInputs.triggerMergeSha,
    },
    finalizer: contract.acceptedFinalizer,
    polling: {
      intervalSeconds: Number(contract.observation.pollIntervalSeconds),
      attemptsMax: Number(contract.observation.pollAttempts),
      attemptsUsed: 0,
    },
    identity: { serviceName, databaseId, cadence: cronFromConfig(normalConfig) },
    storage: null,
    serviceBindings: null,
    schema: {
      requiredTables: REQUIRED_TABLES,
      observedTables: [],
      missingTables: [],
    },
    data: {
      twitchDictionaryRows: null,
      providerLeakageRows: null,
      categoryPayloadRowsInCanaryWindow: null,
      categoryPayloadRowsAfterGrace: null,
      latestSnapshot: null,
      latestNormalSnapshotAfterExpiry: null,
      latestCategorySnapshotInWindow: null,
      minutesSinceLatestSnapshot: null,
      minutesSinceLatestNormalSnapshotAfterExpiry: null,
    },
    gates: {
      readOnly: true,
      triggerExpired: false,
      acceptedFinalizerPass: false,
      canaryBindingsAbsent: false,
      permanentDirectFlagAbsent: false,
      storagePass: false,
      providerStoragePass: false,
      accountStoragePass: false,
      schemaPass: false,
      dictionaryPass: false,
      canaryWindowPayloadPass: false,
      noCategoryPayloadAfterGracePass: false,
      providerLeakagePass: false,
      latestSnapshotFreshnessPass: false,
      normalSnapshotAfterExpiryPresent: false,
      normalSnapshotAfterExpiryFreshnessPass: false,
      normalSnapshotRealPass: false,
      normalSnapshotNonemptyPass: false,
      productionMutationAuthorized: false,
      permanentEnablementAuthorized: false,
      kickChangeAuthorized: false,
    },
    outcome: 'rejected',
    error: null,
  }

  const triggerUntilMs = new Date(trigger.until).getTime()
  evidence.trigger.expired = Number.isFinite(triggerUntilMs) && Date.now() >= triggerUntilMs
  evidence.gates.triggerExpired = evidence.trigger.expired
  evidence.gates.acceptedFinalizerPass = contract.acceptedFinalizer.outcome === 'finalized'
    && contract.acceptedFinalizer.rollbackExitCode === 0
    && contract.acceptedFinalizer.rollbackPass === true
    && contract.acceptedFinalizer.canaryBindingsAbsentAfterRollback === true
    && contract.acceptedFinalizer.permanentDirectFlagAbsentAfterRollback === true
    && contract.acceptedFinalizer.providerLeakageRows === 0
    && contract.acceptedFinalizer.kickChanged === false

  if (!evidence.trigger.expired) {
    evidence.outcome = contract.observation.preExpiryOutcome
    return finish(evidence, outputDir, 0)
  }

  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  if (!accountId || !apiToken) {
    evidence.error = 'cloudflare_credentials_missing'
    return finish(evidence, outputDir, 1)
  }

  try {
    const [dbInfo, accountDatabases] = await Promise.all([
      fetchD1Info(accountId, apiToken, databaseId),
      fetchAllD1Databases(accountId, apiToken),
    ])
    const accountCurrentBytes = accountDatabases.reduce((sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0), 0)
    evidence.storage = projectTwitchStorage(dbInfo.fileSize, accountCurrentBytes)
    evidence.gates.storagePass = evidence.storage.pass === true
    evidence.gates.providerStoragePass = evidence.storage.providerPass === true
      && Number(evidence.storage.projectedNinetyDaySizeMb) <= Number(contract.observation.projectedNinetyDaySizeMbMax)
      && Number(evidence.storage.projectedProviderHeadroomMb) >= Number(contract.observation.projectedProviderHeadroomMbMin)
    evidence.gates.accountStoragePass = evidence.storage.accountPass === true
      && Number(evidence.storage.projectedAccountWideHeadroomMb) >= Number(contract.observation.projectedAccountWideHeadroomMbMin)

    const tableRows = runD1Select(normalConfigPath, `
SELECT name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('minute_snapshots', 'provider_category_dictionary', 'streamer_intraday_rollups')
ORDER BY name;
`.trim())
    evidence.schema.observedTables = tableRows.map((row) => String(row.name ?? '')).filter(Boolean)
    evidence.schema.missingTables = REQUIRED_TABLES.filter((name) => !evidence.schema.observedTables.includes(name))
    evidence.gates.schemaPass = evidence.schema.missingTables.length === 0

    for (let attempt = 1; attempt <= evidence.polling.attemptsMax; attempt += 1) {
      evidence.polling.attemptsUsed = attempt
      const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
      evidence.serviceBindings = canaryBindingsFromSettings(settings)
      evidence.gates.canaryBindingsAbsent = canaryBindingsAbsent(evidence.serviceBindings)
      evidence.gates.permanentDirectFlagAbsent = evidence.serviceBindings.categoryCaptureDirectFlagPresent === false

      if (evidence.gates.schemaPass) {
        const startAtSql = sqlText(trigger.startAt)
        const untilSql = sqlText(trigger.until)
        const graceUntilSql = sqlText(evidence.trigger.graceUntil)
        const rows = runD1Select(normalConfigPath, `
SELECT COUNT(*) AS twitch_dictionary_rows FROM provider_category_dictionary WHERE provider = 'twitch';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider != 'twitch')
) AS provider_leakage_rows;
SELECT COUNT(*) AS category_payload_rows_in_canary_window FROM minute_snapshots WHERE provider = 'twitch' AND collected_at >= '${startAtSql}' AND collected_at <= '${graceUntilSql}' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT COUNT(*) AS category_payload_rows_after_grace FROM minute_snapshots WHERE provider = 'twitch' AND collected_at > '${graceUntilSql}' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode FROM minute_snapshots WHERE provider = 'twitch' ORDER BY bucket_minute DESC LIMIT 1;
SELECT bucket_minute AS normal_bucket_minute, collected_at AS normal_collected_at, stream_count AS normal_stream_count, total_viewers AS normal_total_viewers, source_mode AS normal_source_mode FROM minute_snapshots WHERE provider = 'twitch' AND collected_at > '${untilSql}' AND json_extract(payload_json, '$.categoryContractVersion') IS NULL ORDER BY bucket_minute DESC LIMIT 1;
SELECT bucket_minute AS category_bucket_minute, collected_at AS category_collected_at, stream_count AS category_stream_count, total_viewers AS category_total_viewers, source_mode AS category_source_mode FROM minute_snapshots WHERE provider = 'twitch' AND collected_at >= '${startAtSql}' AND collected_at <= '${graceUntilSql}' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' ORDER BY bucket_minute DESC LIMIT 1;
`.trim())

        evidence.data.twitchDictionaryRows = numberFromRows(rows, 'twitch_dictionary_rows')
        evidence.data.providerLeakageRows = numberFromRows(rows, 'provider_leakage_rows')
        evidence.data.categoryPayloadRowsInCanaryWindow = numberFromRows(rows, 'category_payload_rows_in_canary_window')
        evidence.data.categoryPayloadRowsAfterGrace = numberFromRows(rows, 'category_payload_rows_after_grace')
        evidence.data.latestSnapshot = rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null
        evidence.data.latestNormalSnapshotAfterExpiry = rows.find((row) => Object.hasOwn(row, 'normal_bucket_minute')) ?? null
        evidence.data.latestCategorySnapshotInWindow = rows.find((row) => Object.hasOwn(row, 'category_bucket_minute')) ?? null
        evidence.data.minutesSinceLatestSnapshot = minutesSince(
          evidence.data.latestSnapshot?.collected_at ?? evidence.data.latestSnapshot?.bucket_minute,
        )
        evidence.data.minutesSinceLatestNormalSnapshotAfterExpiry = minutesSince(
          evidence.data.latestNormalSnapshotAfterExpiry?.normal_collected_at
            ?? evidence.data.latestNormalSnapshotAfterExpiry?.normal_bucket_minute,
        )

        evidence.gates.dictionaryPass = Number(evidence.data.twitchDictionaryRows) >= Number(contract.observation.minimumTwitchDictionaryRows)
        evidence.gates.canaryWindowPayloadPass = Number(evidence.data.categoryPayloadRowsInCanaryWindow) >= Number(contract.observation.minimumCategoryPayloadRowsInCanaryWindow)
        evidence.gates.noCategoryPayloadAfterGracePass = Number(evidence.data.categoryPayloadRowsAfterGrace) <= Number(contract.observation.maximumCategoryPayloadRowsAfterGrace)
        evidence.gates.providerLeakagePass = Number(evidence.data.providerLeakageRows) <= Number(contract.observation.maximumProviderLeakageRows)
        evidence.gates.latestSnapshotFreshnessPass = Number.isFinite(evidence.data.minutesSinceLatestSnapshot)
          && evidence.data.minutesSinceLatestSnapshot <= Number(contract.observation.latestSnapshotFreshnessMinutesMax)
        evidence.gates.normalSnapshotAfterExpiryPresent = Boolean(evidence.data.latestNormalSnapshotAfterExpiry)
        evidence.gates.normalSnapshotAfterExpiryFreshnessPass = Number.isFinite(evidence.data.minutesSinceLatestNormalSnapshotAfterExpiry)
          && evidence.data.minutesSinceLatestNormalSnapshotAfterExpiry <= Number(contract.observation.latestSnapshotFreshnessMinutesMax)
        evidence.gates.normalSnapshotRealPass = evidence.data.latestNormalSnapshotAfterExpiry?.normal_source_mode === 'real'
        evidence.gates.normalSnapshotNonemptyPass = Number(evidence.data.latestNormalSnapshotAfterExpiry?.normal_stream_count) > 0
      }

      const required = [
        evidence.gates.triggerExpired,
        evidence.gates.acceptedFinalizerPass,
        evidence.gates.canaryBindingsAbsent,
        evidence.gates.permanentDirectFlagAbsent,
        evidence.gates.storagePass,
        evidence.gates.providerStoragePass,
        evidence.gates.accountStoragePass,
        evidence.gates.schemaPass,
        evidence.gates.dictionaryPass,
        evidence.gates.canaryWindowPayloadPass,
        evidence.gates.noCategoryPayloadAfterGracePass,
        evidence.gates.providerLeakagePass,
        evidence.gates.latestSnapshotFreshnessPass,
        evidence.gates.normalSnapshotAfterExpiryPresent,
        evidence.gates.normalSnapshotAfterExpiryFreshnessPass,
        evidence.gates.normalSnapshotRealPass,
        evidence.gates.normalSnapshotNonemptyPass,
      ]
      if (required.every(Boolean)) {
        evidence.outcome = 'accepted'
        break
      }
      if (attempt < evidence.polling.attemptsMax) await sleep(evidence.polling.intervalSeconds * 1000)
    }
  } catch (error) {
    evidence.error = safeError(error)
    evidence.outcome = 'rejected'
  }

  return finish(evidence, outputDir, evidence.outcome === 'accepted' ? 0 : 1)
}

function finish(evidence, outputDir, exitCode) {
  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, 'evidence.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('evidence_path', outputPath)
  writeOutput('outcome', evidence.outcome)
  console.log(JSON.stringify({
    outputPath,
    outcome: evidence.outcome,
    polling: evidence.polling,
    storage: evidence.storage,
    data: evidence.data,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))
  if (exitCode !== 0) process.exitCode = exitCode
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function tomlValue(source, key) {
  const match = source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))
  return match?.[1] ?? null
}

function cronFromConfig(source) {
  return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
}

function addMinutes(value, minutes) {
  const timestamp = new Date(String(value ?? '')).getTime()
  if (!Number.isFinite(timestamp) || !Number.isFinite(minutes)) throw new Error('invalid_trigger_grace_window')
  return new Date(timestamp + minutes * 60_000).toISOString()
}

function sqlText(value) {
  return String(value ?? '').replace(/'/g, "''")
}

async function fetchD1Info(accountId, apiToken, databaseId) {
  const body = await cloudflareJson(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`,
    apiToken,
  )
  const fileSize = Number(body?.result?.file_size ?? body?.result?.fileSize)
  if (!Number.isFinite(fileSize)) throw new Error('d1_info_file_size_missing')
  return { fileSize }
}

async function fetchAllD1Databases(accountId, apiToken) {
  const collected = []
  for (let page = 1; page <= 100; page += 1) {
    const body = await cloudflareJson(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database?page=${page}&per_page=100`,
      apiToken,
    )
    const result = Array.isArray(body.result) ? body.result : []
    collected.push(...result)
    const totalPages = Number(body?.result_info?.total_pages ?? 1)
    if (page >= totalPages || result.length === 0) break
  }
  if (collected.length === 0) throw new Error('account_d1_inventory_empty')
  return collected
}

async function fetchWorkerSettings(accountId, apiToken, serviceName) {
  return cloudflareJson(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`,
    apiToken,
  )
}

async function cloudflareJson(url, apiToken) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${apiToken}` } })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) throw new Error(`cloudflare_get_failed_http_${response.status}`)
  return body
}

function runD1Select(configPath, sql) {
  if (!/^SELECT\b/i.test(sql.trim())) throw new Error('non_select_statement_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_twitch_hot', '--remote', '--json', '--config', configPath, '--command', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function parseLastJson(value) {
  const text = stripAnsi(String(value ?? ''))
  const parsed = []
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '[' && text[index] !== '{') continue
    const end = balancedJsonEnd(text, index)
    if (end === null) continue
    try {
      parsed.push(JSON.parse(text.slice(index, end + 1)))
      index = end
    } catch {}
  }
  if (parsed.length === 0) throw new Error('d1_json_output_missing')
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
      const expected = char === ']' ? '[' : '{'
      if (stack.pop() !== expected) return null
      if (stack.length === 0) return index
    }
  }
  return null
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
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
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .slice(0, 240)
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : error)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function writeOutput(key, value) {
  const file = process.env.GITHUB_OUTPUT
  if (file) fs.appendFileSync(file, `${key}=${value}\n`)
}

await execute()
