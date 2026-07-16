import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inspectKickCanaryTrigger } from './inspect-12a4-kick-category-capture-canary-trigger.mjs'

const MB = 1024 * 1024
const KICK_INCREMENTAL_MB_WITH_SAFETY = 22.01
const KICK_OPERATIONAL_CEILING_MB = 450
const PROJECTED_SIZE_MAX_MB = 330
const PROJECTED_HEADROOM_MIN_MB = 100
const SERVICE_SETTINGS_RETRY_ATTEMPTS = 30
const SERVICE_SETTINGS_RETRY_MS = 5000

export function projectKickStorage(currentBytes) {
  const currentMb = Number(currentBytes) / MB
  const projectedNinetyDaySizeMb = currentMb + KICK_INCREMENTAL_MB_WITH_SAFETY
  const projectedProviderHeadroomMb = KICK_OPERATIONAL_CEILING_MB - projectedNinetyDaySizeMb
  return {
    currentBytes: Number(currentBytes),
    currentMb: round(currentMb),
    incrementalMbWithSafety: KICK_INCREMENTAL_MB_WITH_SAFETY,
    projectedNinetyDaySizeMb: round(projectedNinetyDaySizeMb),
    projectedProviderHeadroomMb: round(projectedProviderHeadroomMb),
    pass: projectedNinetyDaySizeMb <= PROJECTED_SIZE_MAX_MB
      && projectedProviderHeadroomMb >= PROJECTED_HEADROOM_MIN_MB,
  }
}

export function renderActiveCanaryConfig(template, trigger) {
  const replacements = new Map([
    ['CATEGORY_CAPTURE_CANARY_ENABLED', 'true'],
    ['CATEGORY_CAPTURE_CANARY_PROVIDER', 'kick'],
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
    && bindings.provider === 'kick'
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
  const triggerPath = process.env.TRIGGER_PATH ?? 'docs/audits/12a4-kick-category-capture-canary-trigger.json'
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-category-canary')
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const githubEventName = action === 'start' ? 'push' : 'schedule'
  if (!['start', 'monitor', 'finalize'].includes(action)) throw new Error('invalid_execution_action')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  const executionContract = JSON.parse(fs.readFileSync('docs/audits/12a4-kick-category-capture-canary-execution-contract.json', 'utf8'))
  const packageContract = JSON.parse(fs.readFileSync('docs/audits/12a4-kick-category-capture-canary-package-contract.json', 'utf8'))
  const inspected = inspectKickCanaryTrigger({ trigger, executionContract, packageContract, eventName: githubEventName })
  if (!inspected.ok || !inspected.present) throw new Error(`trigger_rejected:${JSON.stringify(inspected.failures ?? [])}`)

  const normalConfigPath = path.resolve(packageContract.package.normalConfig)
  const canaryTemplatePath = path.resolve(packageContract.package.committedConfig)
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const canaryTemplate = fs.readFileSync(canaryTemplatePath, 'utf8')
  const serviceName = activeTomlValue(normalConfig, 'name')
  const normalDatabaseId = activeTomlValue(normalConfig, 'database_id')
  const canaryDatabaseId = activeTomlValue(canaryTemplate, 'database_id')
  if (!serviceName || !normalDatabaseId || normalDatabaseId !== canaryDatabaseId) throw new Error('Kick_identity_mismatch')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-category-capture-canary-runtime-evidence-v1',
    provider: 'kick',
    attempt: trigger.attempt,
    action,
    observedAt: new Date().toISOString(),
    trigger: {
      startAt: trigger.startAt,
      until: trigger.until,
      packageMergeSha: trigger.packageMergeSha,
      executionPackageMergeSha: trigger.executionPackageMergeSha,
    },
    identity: { serviceName, databaseId: normalDatabaseId },
    storage: null,
    serviceBindingsBefore: null,
    serviceBindingsAfter: null,
    queryEvidence: null,
    deployment: { canaryExitCode: null, rollbackExitCode: null },
    gates: {
      storagePass: false,
      triggerPass: true,
      providerLeakageRows: null,
      hardStop: false,
      rollbackRequired: false,
      rollbackPass: false,
      productionRuntimeCaptureAuthorizedBeyondCanary: false,
      TwitchStartAuthorized: false,
    },
    outcome: 'unknown',
    error: null,
  }

  let shouldRollback = action === 'finalize'
  let canaryDeploySucceeded = false
  try {
    const dbInfo = await fetchD1Info(accountId, apiToken, normalDatabaseId)
    evidence.storage = projectKickStorage(dbInfo.fileSize)
    evidence.gates.storagePass = evidence.storage.pass
    if (!evidence.storage.pass) {
      evidence.gates.hardStop = true
      shouldRollback = action !== 'start' || await serviceHasCanary(accountId, apiToken, serviceName)
      throw new Error('Kick_storage_preflight_failed')
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
        evidence.queryEvidence = runKickEvidenceQueries(normalConfigPath)
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
    : action === 'monitor'
      ? evidence.outcome === 'checkpoint_pass'
        || evidence.outcome === 'already_rolled_back_noop'
        || (evidence.gates.hardStop && evidence.gates.rollbackPass)
      : (evidence.outcome === 'finalized' && evidence.gates.rollbackPass)
        || evidence.outcome === 'already_rolled_back_noop'
  if (!accepted) process.exit(1)
}

function runKickEvidenceQueries(configPath) {
  const sql = `
SELECT COUNT(*) AS kick_dictionary_rows FROM provider_category_dictionary WHERE provider = 'kick';
SELECT COUNT(*) AS provider_leakage_rows FROM provider_category_dictionary WHERE provider != 'kick';
SELECT COUNT(*) AS category_payload_rows FROM minute_snapshots WHERE provider = 'kick' AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
SELECT COALESCE(SUM(category_observed_samples), 0) AS observed_samples, COALESCE(SUM(category_missing_samples), 0) AS missing_samples FROM streamer_intraday_rollups WHERE provider = 'kick';
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode FROM minute_snapshots WHERE provider = 'kick' ORDER BY bucket_minute DESC LIMIT 1;
`.trim()
  const result = runCommand('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_kick_hot', '--remote', '--json', '--config', configPath, '--command', sql])
  if (result.code !== 0) throw new Error(`d1_evidence_query_failed:${sanitize(result.output)}`)
  const parsed = parseLastJson(result.output)
  const rows = flattenD1Rows(parsed)
  return {
    kickDictionaryRows: numberFromRows(rows, 'kick_dictionary_rows'),
    providerLeakageRows: numberFromRows(rows, 'provider_leakage_rows'),
    categoryPayloadRows: numberFromRows(rows, 'category_payload_rows'),
    observedSamples: numberFromRows(rows, 'observed_samples'),
    missingSamples: numberFromRows(rows, 'missing_samples'),
    latestSnapshot: rows.find((row) => Object.hasOwn(row, 'bucket_minute')) ?? null,
  }
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

async function serviceHasCanary(accountId, apiToken, serviceName) {
  try {
    const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    return !canaryBindingsAbsent(canaryBindingsFromSettings(settings))
  } catch {
    return false
  }
}

async function waitForCanaryBindings(accountId, apiToken, serviceName, trigger) {
  let last = null
  for (let attempt = 1; attempt <= SERVICE_SETTINGS_RETRY_ATTEMPTS; attempt += 1) {
    last = await fetchWorkerSettings(accountId, apiToken, serviceName)
    if (bindingsMatchTrigger(canaryBindingsFromSettings(last), trigger)) return last
    if (attempt < SERVICE_SETTINGS_RETRY_ATTEMPTS) await sleep(SERVICE_SETTINGS_RETRY_MS)
  }
  throw new Error(`canary_bindings_not_observed:${JSON.stringify(canaryBindingsFromSettings(last))}`)
}

async function waitForNormalBindings(accountId, apiToken, serviceName) {
  let last = null
  for (let attempt = 1; attempt <= SERVICE_SETTINGS_RETRY_ATTEMPTS; attempt += 1) {
    last = await fetchWorkerSettings(accountId, apiToken, serviceName)
    const bindings = canaryBindingsFromSettings(last)
    if (canaryBindingsAbsent(bindings)) return last
    if (attempt < SERVICE_SETTINGS_RETRY_ATTEMPTS) await sleep(SERVICE_SETTINGS_RETRY_MS)
  }
  throw new Error(`normal_bindings_not_observed:${JSON.stringify(canaryBindingsFromSettings(last))}`)
}

async function waitUntil(target, maximumWaitMs) {
  const waitMs = target.getTime() - Date.now()
  if (waitMs <= 0) return
  if (waitMs > maximumWaitMs) throw new Error('trigger_start_too_far_in_future')
  await sleep(waitMs)
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  return {
    code: Number.isInteger(result.status) ? result.status : 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}

function parseLastJson(value) {
  const text = String(value).trim()
  for (let index = text.lastIndexOf('['); index >= 0; index = text.lastIndexOf('[', index - 1)) {
    try { return JSON.parse(text.slice(index)) } catch {}
  }
  for (let index = text.lastIndexOf('{'); index >= 0; index = text.lastIndexOf('{', index - 1)) {
    try { return JSON.parse(text.slice(index)) } catch {}
  }
  throw new Error('d1_json_output_missing')
}

function flattenD1Rows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => Array.isArray(group?.results) ? group.results : Array.isArray(group?.result?.[0]?.results) ? group.result[0].results : [])
}

function numberFromRows(rows, key) {
  const row = rows.find((candidate) => Object.hasOwn(candidate, key))
  const value = Number(row?.[key])
  return Number.isFinite(value) ? value : null
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .replace(/https:\/\/[^\s]+workers\.dev/gi, '[redacted-worker-url]')
    .slice(0, 400)
}

function writeGithubOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

function round(value) {
  return Math.round(value * 100) / 100
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
