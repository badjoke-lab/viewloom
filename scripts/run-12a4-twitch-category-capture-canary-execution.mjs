import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectTwitchCanaryTrigger } from './inspect-12a4-twitch-category-capture-canary-trigger.mjs'

const MB = 1024 * 1024
const TWITCH_INCREMENTAL_MB_WITH_SAFETY = 48.32
const PROVIDER_OPERATIONAL_CEILING_MB = 450
const ACCOUNT_OPERATIONAL_CEILING_MB = 4608
const PROJECTED_SIZE_MAX_MB = 440
const PROJECTED_PROVIDER_HEADROOM_MIN_MB = 10
const PROJECTED_ACCOUNT_HEADROOM_MIN_MB = 500
const SERVICE_SETTINGS_RETRY_ATTEMPTS = 30
const SERVICE_SETTINGS_RETRY_MS = 5000

export function projectTwitchStorage(providerCurrentBytes, accountCurrentBytes) {
  const providerCurrentMb = Number(providerCurrentBytes) / MB
  const accountCurrentMb = Number(accountCurrentBytes) / MB
  const projectedNinetyDaySizeMb = providerCurrentMb + TWITCH_INCREMENTAL_MB_WITH_SAFETY
  const projectedProviderHeadroomMb = PROVIDER_OPERATIONAL_CEILING_MB - projectedNinetyDaySizeMb
  const projectedAccountWideSizeMb = accountCurrentMb + TWITCH_INCREMENTAL_MB_WITH_SAFETY
  const projectedAccountWideHeadroomMb = ACCOUNT_OPERATIONAL_CEILING_MB - projectedAccountWideSizeMb
  return {
    providerCurrentBytes: Number(providerCurrentBytes),
    providerCurrentMb: round(providerCurrentMb),
    accountCurrentBytes: Number(accountCurrentBytes),
    accountCurrentMb: round(accountCurrentMb),
    incrementalMbWithSafety: TWITCH_INCREMENTAL_MB_WITH_SAFETY,
    projectedNinetyDaySizeMb: round(projectedNinetyDaySizeMb),
    projectedProviderHeadroomMb: round(projectedProviderHeadroomMb),
    projectedAccountWideSizeMb: round(projectedAccountWideSizeMb),
    projectedAccountWideHeadroomMb: round(projectedAccountWideHeadroomMb),
    providerPass: projectedNinetyDaySizeMb <= PROJECTED_SIZE_MAX_MB
      && projectedProviderHeadroomMb >= PROJECTED_PROVIDER_HEADROOM_MIN_MB,
    accountPass: projectedAccountWideHeadroomMb >= PROJECTED_ACCOUNT_HEADROOM_MIN_MB,
    pass: projectedNinetyDaySizeMb <= PROJECTED_SIZE_MAX_MB
      && projectedProviderHeadroomMb >= PROJECTED_PROVIDER_HEADROOM_MIN_MB
      && projectedAccountWideHeadroomMb >= PROJECTED_ACCOUNT_HEADROOM_MIN_MB,
  }
}

export function renderActiveCanaryConfig(template, trigger) {
  const replacements = new Map([
    ['CATEGORY_CAPTURE_CANARY_ENABLED', 'true'],
    ['CATEGORY_CAPTURE_CANARY_PROVIDER', 'twitch'],
    ['CATEGORY_CAPTURE_CANARY_STARTED_AT', trigger.startAt],
    ['CATEGORY_CAPTURE_CANARY_UNTIL', trigger.until],
    ['CATEGORY_CAPTURE_CANARY_ATTEMPT', String(trigger.attempt)],
  ])
  let rendered = template
  for (const [key, value] of replacements) {
    const pattern = new RegExp(`^${key}\\s*=\\s*"[^"]*"$`, 'm')
    if (!pattern.test(rendered)) throw new Error(`canary_config_key_missing:${key}`)
    rendered = rendered.replace(pattern, `${key} = "${value}"`)
  }
  if (rendered.includes('CATEGORY_CAPTURE_ENABLED =')) throw new Error('direct_category_capture_flag_forbidden')
  return rendered
}

export function generatedCanaryConfigPath(templatePath, attempt) {
  const parsedAttempt = Number(attempt)
  if (!Number.isSafeInteger(parsedAttempt) || parsedAttempt <= 0) throw new Error('invalid_canary_attempt')
  return path.join(
    path.dirname(path.resolve(templatePath)),
    `.wrangler.category-canary.active-attempt-${parsedAttempt}.toml`,
  )
}

export function activeTomlValue(source, key) {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`)))
    .find(Boolean)?.[1] ?? null
}

export function canaryBindingsFromSettings(settings) {
  const bindings = Array.isArray(settings?.result?.bindings) ? settings.result.bindings : []
  const values = {}
  for (const binding of bindings) {
    if (binding?.type === 'plain_text' && typeof binding.name === 'string') values[binding.name] = String(binding.text ?? '')
  }
  return {
    enabled: values.CATEGORY_CAPTURE_CANARY_ENABLED ?? null,
    provider: values.CATEGORY_CAPTURE_CANARY_PROVIDER ?? null,
    startedAt: values.CATEGORY_CAPTURE_CANARY_STARTED_AT ?? null,
    until: values.CATEGORY_CAPTURE_CANARY_UNTIL ?? null,
    attempt: values.CATEGORY_CAPTURE_CANARY_ATTEMPT ?? null,
    categoryCaptureDirectFlagPresent: Object.hasOwn(values, 'CATEGORY_CAPTURE_ENABLED'),
  }
}

export function bindingsMatchTrigger(bindings, trigger) {
  return bindings.enabled === 'true'
    && bindings.provider === 'twitch'
    && bindings.startedAt === trigger.startAt
    && bindings.until === trigger.until
    && bindings.attempt === String(trigger.attempt)
    && bindings.categoryCaptureDirectFlagPresent === false
}

export function canaryBindingsAbsent(bindings) {
  return bindings.enabled === null
    && bindings.provider === null
    && bindings.startedAt === null
    && bindings.until === null
    && bindings.attempt === null
    && bindings.categoryCaptureDirectFlagPresent === false
}

async function execute() {
  const action = String(process.env.ACTION ?? '').trim().toLowerCase()
  const triggerPath = process.env.TRIGGER_PATH ?? 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-twitch-category-canary')
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const githubEventName = action === 'start' ? 'push' : 'schedule'
  if (!['start', 'monitor', 'finalize'].includes(action)) throw new Error('invalid_execution_action')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  const executionContract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json', 'utf8'))
  const packageContract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-package-contract.json', 'utf8'))
  const inspected = inspectTwitchCanaryTrigger({ trigger, executionContract, packageContract, eventName: githubEventName })
  if (!inspected.ok || !inspected.present) throw new Error(`trigger_rejected:${JSON.stringify(inspected.failures ?? [])}`)

  const normalConfigPath = path.resolve(packageContract.package.normalConfig)
  const canaryTemplatePath = path.resolve(packageContract.package.committedConfig)
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const canaryTemplate = fs.readFileSync(canaryTemplatePath, 'utf8')
  const serviceName = activeTomlValue(normalConfig, 'name')
  const normalDatabaseId = activeTomlValue(normalConfig, 'database_id')
  const canaryDatabaseId = activeTomlValue(canaryTemplate, 'database_id')
  const normalCron = cronFromConfig(normalConfig)
  const canaryCron = cronFromConfig(canaryTemplate)
  if (!serviceName || !normalDatabaseId || normalDatabaseId !== canaryDatabaseId) throw new Error('twitch_identity_mismatch')
  if (normalCron !== '*/5 * * * *' || canaryCron !== normalCron) throw new Error('twitch_cadence_mismatch')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-twitch-category-capture-canary-runtime-evidence-v1',
    provider: 'twitch',
    attempt: trigger.attempt,
    action,
    observedAt: new Date().toISOString(),
    trigger: {
      startAt: trigger.startAt,
      until: trigger.until,
      packageMergeSha: trigger.packageMergeSha,
      executionPackageMergeSha: trigger.executionPackageMergeSha,
    },
    identity: { serviceName, databaseId: normalDatabaseId, cadence: normalCron },
    storage: null,
    serviceBindingsBefore: null,
    serviceBindingsAfter: null,
    queryEvidence: null,
    deployment: { canaryExitCode: null, rollbackExitCode: null },
    gates: {
      storagePass: false,
      providerStoragePass: false,
      accountStoragePass: false,
      triggerPass: true,
      providerLeakageRows: null,
      hardStop: false,
      rollbackRequired: false,
      rollbackPass: false,
      productionRuntimeCaptureAuthorizedBeyondCanary: false,
      permanentEnablementAuthorized: false,
      kickStartAuthorized: false,
    },
    outcome: 'unknown',
    error: null,
  }

  let shouldRollback = action === 'finalize'
  let canaryDeploySucceeded = false
  try {
    const [dbInfo, accountDatabases] = await Promise.all([
      fetchD1Info(accountId, apiToken, normalDatabaseId),
      fetchAllD1Databases(accountId, apiToken),
    ])
    const accountCurrentBytes = accountDatabases.reduce((sum, item) => sum + Number(item?.file_size ?? item?.fileSize ?? 0), 0)
    evidence.storage = projectTwitchStorage(dbInfo.file_size ?? dbInfo.fileSize ?? 0, accountCurrentBytes)
    evidence.gates.storagePass = evidence.storage.pass
    evidence.gates.providerStoragePass = evidence.storage.providerPass
    evidence.gates.accountStoragePass = evidence.storage.accountPass
    if (!evidence.storage.pass) {
      evidence.gates.hardStop = true
      shouldRollback = action !== 'start' || await serviceHasCanary(accountId, apiToken, serviceName)
      throw new Error('twitch_storage_preflight_failed')
    }

    const settingsBefore = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.serviceBindingsBefore = canaryBindingsFromSettings(settingsBefore)

    if (action === 'start') {
      if (!canaryBindingsAbsent(evidence.serviceBindingsBefore)) {
        shouldRollback = true
        throw new Error(`preexisting_canary_bindings:${JSON.stringify(evidence.serviceBindingsBefore)}`)
      }
      await waitUntil(new Date(trigger.startAt), 3 * 60 * 60 * 1000)
      const activeConfigPath = generatedCanaryConfigPath(canaryTemplatePath, trigger.attempt)
      let deployed
      try {
        fs.writeFileSync(activeConfigPath, renderActiveCanaryConfig(canaryTemplate, trigger))
        deployed = runCommand('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', activeConfigPath])
      } finally {
        fs.rmSync(activeConfigPath, { force: true })
      }
      evidence.deployment.canaryExitCode = deployed.code
      if (deployed.code !== 0) throw new Error(`canary_deploy_failed:${sanitize(deployed.output)}`)
      canaryDeploySucceeded = true
      const activeSettings = await waitForCanaryBindings(accountId, apiToken, serviceName, trigger)
      evidence.serviceBindingsAfter = canaryBindingsFromSettings(activeSettings)
      evidence.outcome = 'started'
    } else {
      if (canaryBindingsAbsent(evidence.serviceBindingsBefore)) {
        shouldRollback = false
        evidence.gates.rollbackPass = true
        evidence.serviceBindingsAfter = evidence.serviceBindingsBefore
        evidence.outcome = 'already_rolled_back_noop'
      } else if (!bindingsMatchTrigger(evidence.serviceBindingsBefore, trigger)) {
        evidence.gates.hardStop = true
        shouldRollback = true
        throw new Error(`canary_bindings_mismatch:${JSON.stringify(evidence.serviceBindingsBefore)}`)
      } else {
        evidence.queryEvidence = runTwitchEvidenceQueries(normalConfigPath)
        const leakage = Number(evidence.queryEvidence?.providerLeakageRows ?? Number.NaN)
        evidence.gates.providerLeakageRows = Number.isFinite(leakage) ? leakage : null
        if (!Number.isFinite(leakage) || leakage > 0) {
          evidence.gates.hardStop = true
          shouldRollback = true
        }
        if (action === 'monitor' && !shouldRollback) evidence.outcome = 'checkpoint_pass'
      }
    }
  } catch (error) {
    evidence.error = sanitize(error instanceof Error ? error.message : error)
    if (action !== 'start' || canaryDeploySucceeded) shouldRollback = true
    evidence.outcome = evidence.gates.hardStop ? 'hard_stop' : 'failed'
  } finally {
    if (shouldRollback) {
      evidence.gates.rollbackRequired = true
      const rollback = runCommand('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', normalConfigPath])
      evidence.deployment.rollbackExitCode = rollback.code
      if (rollback.code === 0) {
        const normalSettings = await waitForNormalBindings(accountId, apiToken, serviceName)
        evidence.serviceBindingsAfter = canaryBindingsFromSettings(normalSettings)
        evidence.gates.rollbackPass = true
        if (action === 'finalize' && !evidence.gates.hardStop && !evidence.error) evidence.outcome = 'finalized'
      } else {
        evidence.error = evidence.error ?? `rollback_deploy_failed:${sanitize(rollback.output)}`
      }
    }
    evidence.observedAt = new Date().toISOString()
    const outputPath = path.join(outputDir, `evidence-${action}-attempt-${trigger.attempt}.json`)
    fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
    writeGithubOutput('evidence_path', outputPath)
    writeGithubOutput('outcome', evidence.outcome)
    console.log(JSON.stringify({ outputPath, outcome: evidence.outcome, gates: evidence.gates, error: evidence.error }, null, 2))
  }

  const accepted = action === 'start'
    ? evidence.outcome === 'started'
    : evidence.outcome === 'checkpoint_pass'
      || evidence.outcome === 'finalized'
      || evidence.outcome === 'already_rolled_back_noop'
      || (evidence.gates.hardStop && evidence.gates.rollbackPass)
  if (!accepted) process.exit(1)
}

function cronFromConfig(source) {
  return source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
}

function runTwitchEvidenceQueries(configPath) {
  const sql = `
SELECT COUNT(*) AS twitch_dictionary_rows FROM provider_category_dictionary WHERE provider = 'twitch';
SELECT (
  (SELECT COUNT(*) FROM provider_category_dictionary WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM minute_snapshots WHERE provider != 'twitch') +
  (SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider != 'twitch')
) AS provider_leakage_rows;
SELECT COUNT(*) AS category_payload_rows FROM minute_snapshots WHERE provider = 'twitch' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT COALESCE(SUM(category_observed_samples), 0) AS observed_samples, COALESCE(SUM(category_missing_samples), 0) AS missing_samples FROM streamer_intraday_rollups WHERE provider = 'twitch';
SELECT category_observed_streamers, category_observed_samples, category_missing_samples, category_coverage_state FROM intraday_rollup_status WHERE provider = 'twitch' ORDER BY day DESC LIMIT 1;
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode FROM minute_snapshots WHERE provider = 'twitch' ORDER BY bucket_minute DESC LIMIT 1;
`.trim()
  const result = runCommand('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_twitch_hot', '--remote', '--json', '--config', configPath, '--command', sql])
  if (result.code !== 0) throw new Error(`d1_evidence_query_failed:${sanitize(result.output)}`)
  const parsed = parseLastJson(result.stdout || result.output)
  const rows = flattenD1Rows(parsed)
  return {
    twitchDictionaryRows: numberFromRows(rows, 'twitch_dictionary_rows'),
    providerLeakageRows: numberFromRows(rows, 'provider_leakage_rows'),
    categoryPayloadRows: numberFromRows(rows, 'category_payload_rows'),
    observedSamples: numberFromRows(rows, 'observed_samples'),
    missingSamples: numberFromRows(rows, 'missing_samples'),
    latestCategoryStatus: rows.find((row) => Object.hasOwn(row, 'category_coverage_state')) ?? null,
    latestSnapshot: rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null,
  }
}

async function fetchD1Info(accountId, apiToken, databaseId) {
  const payload = await cloudflareJson(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/d1/database/${encodeURIComponent(databaseId)}`,
    apiToken,
  )
  return payload.result ?? {}
}

async function fetchAllD1Databases(accountId, apiToken) {
  const collected = []
  for (let page = 1; page <= 100; page += 1) {
    const payload = await cloudflareJson(
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
  const payload = await cloudflareJson(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`,
    apiToken,
  )
  return payload
}

async function serviceHasCanary(accountId, apiToken, serviceName) {
  try {
    const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    return !canaryBindingsAbsent(canaryBindingsFromSettings(settings))
  } catch {
    return false
  }
}

async function waitForCanaryBindings(accountId, apiToken, serviceName, trigger) {
  for (let attempt = 1; attempt <= SERVICE_SETTINGS_RETRY_ATTEMPTS; attempt += 1) {
    const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    if (bindingsMatchTrigger(canaryBindingsFromSettings(settings), trigger)) return settings
    await sleep(SERVICE_SETTINGS_RETRY_MS)
  }
  throw new Error('canary_bindings_not_observed_after_deploy')
}

async function waitForNormalBindings(accountId, apiToken, serviceName) {
  for (let attempt = 1; attempt <= SERVICE_SETTINGS_RETRY_ATTEMPTS; attempt += 1) {
    const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    if (canaryBindingsAbsent(canaryBindingsFromSettings(settings))) return settings
    await sleep(SERVICE_SETTINGS_RETRY_MS)
  }
  throw new Error('normal_bindings_not_observed_after_rollback')
}

async function cloudflareJson(url, apiToken) {
  const response = await fetch(url, {
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
    throw new Error(`cloudflare_api_failed:${response.status}:${sanitize(JSON.stringify(payload?.errors ?? payload))}`)
  }
  return payload
}

async function waitUntil(target, maximumWaitMs) {
  const waitMs = target.getTime() - Date.now()
  if (waitMs <= 0) return
  if (waitMs > maximumWaitMs) throw new Error(`start_time_too_far_in_future:${target.toISOString()}`)
  await sleep(waitMs)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') inString = false
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
      if (stack.length !== 0) continue

      const candidate = source.slice(start, index + 1)
      try {
        return JSON.parse(candidate)
      } catch {
        break
      }
    }
  }

  throw new Error('wrangler_json_output_missing')
}

function stripAnsi(value) {
  return String(value ?? '').replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}

function flattenD1Rows(payload) {
  const batches = Array.isArray(payload) ? payload : [payload]
  const rows = []
  for (const batch of batches) {
    if (Array.isArray(batch?.results)) rows.push(...batch.results)
    if (Array.isArray(batch?.result)) {
      for (const item of batch.result) if (Array.isArray(item?.results)) rows.push(...item.results)
    }
  }
  return rows
}

function numberFromRows(rows, key) {
  const row = rows.find((item) => Object.hasOwn(item, key))
  const value = Number(row?.[key])
  return Number.isFinite(value) ? value : null
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Fa-f0-9]{32,}/g, '[redacted]')
    .slice(0, 4000)
}

function writeGithubOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${String(value)}\n`)
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
