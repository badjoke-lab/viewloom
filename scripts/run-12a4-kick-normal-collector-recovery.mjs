import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
} from './run-12a4-kick-category-capture-canary-execution.mjs'

const CONTRACT_PATH = 'docs/audits/12a4-kick-normal-collector-recovery-contract.json'
const TRIGGER_PATH = 'docs/audits/12a4-kick-normal-collector-recovery-trigger.json'
const CATEGORY_TRIGGER_PATH = 'docs/audits/12a4-kick-category-capture-canary-trigger.json'
const NORMAL_CONFIG_PATH = 'workers/collector-kick/wrangler.toml'

async function execute() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-normal-collector-recovery')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const contract = json(CONTRACT_PATH)
  const trigger = json(TRIGGER_PATH)
  const normalConfig = fs.readFileSync(NORMAL_CONFIG_PATH, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseName = tomlValue(normalConfig, 'database_name')
  if (!serviceName || !databaseName) throw new Error('kick_normal_identity_missing')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-normal-collector-recovery-evidence-v1',
    provider: 'kick',
    attempt: trigger.attempt,
    observedAt: new Date().toISOString(),
    trigger: {
      status: trigger.status,
      createdAt: trigger.createdAt,
      expiresAt: trigger.expiresAt,
      confirmation: trigger.confirmation,
    },
    identity: {
      serviceName,
      databaseName,
      normalConfig: NORMAL_CONFIG_PATH,
      expectedCron: contract.recovery.expectedCron,
    },
    before: {
      snapshot: null,
      serviceBindings: null,
      providerLeakageRows: null,
    },
    deployment: {
      attempted: false,
      exitCode: null,
      succeeded: false,
    },
    after: {
      snapshot: null,
      serviceBindings: null,
      providerLeakageRows: null,
      minutesSinceSnapshot: null,
      pollAttemptsUsed: 0,
    },
    gates: {
      triggerValid: false,
      categoryCanaryTriggerAbsent: false,
      normalCronConfigured: false,
      deployPass: false,
      canaryBindingsAbsentAfterDeploy: false,
      permanentCategoryFlagAbsentAfterDeploy: false,
      newerSnapshotObserved: false,
      snapshotFreshnessPass: false,
      providerLeakagePass: false,
      twitchChanged: false,
      manualCollectCalled: false,
      categoryCaptureStarted: false,
    },
    outcome: 'rejected',
    error: null,
  }

  try {
    evidence.gates.triggerValid = validateTrigger(trigger)
    evidence.gates.categoryCanaryTriggerAbsent = !fs.existsSync(CATEGORY_TRIGGER_PATH)
    evidence.gates.normalCronConfigured = normalConfig.includes(`crons = ["${contract.recovery.expectedCron}"]`)
    if (!evidence.gates.triggerValid) throw new Error('recovery_trigger_invalid_or_expired')
    if (!evidence.gates.categoryCanaryTriggerAbsent) throw new Error('category_canary_trigger_still_present')
    if (!evidence.gates.normalCronConfigured) throw new Error('normal_kick_cron_not_configured')

    evidence.before.snapshot = latestSnapshot(NORMAL_CONFIG_PATH, databaseName)
    evidence.before.providerLeakageRows = providerLeakageRows(NORMAL_CONFIG_PATH, databaseName)
    const beforeSettings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.before.serviceBindings = canaryBindingsFromSettings(beforeSettings)

    evidence.deployment.attempted = true
    const deploy = spawnSync('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', NORMAL_CONFIG_PATH], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 8 * 1024 * 1024,
    })
    evidence.deployment.exitCode = deploy.status
    evidence.deployment.succeeded = deploy.status === 0
    evidence.gates.deployPass = deploy.status === 0
    if (deploy.status !== 0) throw new Error(`normal_kick_deploy_failed:${safeText(deploy.stderr || deploy.stdout)}`)

    const afterSettings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.after.serviceBindings = canaryBindingsFromSettings(afterSettings)
    evidence.gates.canaryBindingsAbsentAfterDeploy = canaryBindingsAbsent(evidence.after.serviceBindings)
    evidence.gates.permanentCategoryFlagAbsentAfterDeploy = evidence.after.serviceBindings.categoryCaptureDirectFlagPresent === false
    if (!evidence.gates.canaryBindingsAbsentAfterDeploy || !evidence.gates.permanentCategoryFlagAbsentAfterDeploy) {
      throw new Error('normal_deploy_left_category_capture_binding')
    }

    const beforeTime = snapshotTime(evidence.before.snapshot)
    for (let attempt = 1; attempt <= Number(contract.recovery.pollAttempts); attempt += 1) {
      evidence.after.pollAttemptsUsed = attempt
      const snapshot = latestSnapshot(NORMAL_CONFIG_PATH, databaseName)
      evidence.after.snapshot = snapshot
      const afterTime = snapshotTime(snapshot)
      evidence.gates.newerSnapshotObserved = Number.isFinite(afterTime)
        && (!Number.isFinite(beforeTime) || afterTime > beforeTime)
      evidence.after.minutesSinceSnapshot = minutesSince(snapshot?.collected_at ?? snapshot?.bucket_minute)
      evidence.gates.snapshotFreshnessPass = Number.isFinite(evidence.after.minutesSinceSnapshot)
        && evidence.after.minutesSinceSnapshot <= Number(contract.recovery.freshnessMinutesMax)
      if (evidence.gates.newerSnapshotObserved && evidence.gates.snapshotFreshnessPass) break
      if (attempt < Number(contract.recovery.pollAttempts)) await sleep(Number(contract.recovery.pollIntervalSeconds) * 1000)
    }

    evidence.after.providerLeakageRows = providerLeakageRows(NORMAL_CONFIG_PATH, databaseName)
    evidence.gates.providerLeakagePass = Number(evidence.after.providerLeakageRows) <= Number(contract.recovery.maximumProviderLeakageRows)

    evidence.outcome = [
      evidence.gates.triggerValid,
      evidence.gates.categoryCanaryTriggerAbsent,
      evidence.gates.normalCronConfigured,
      evidence.gates.deployPass,
      evidence.gates.canaryBindingsAbsentAfterDeploy,
      evidence.gates.permanentCategoryFlagAbsentAfterDeploy,
      evidence.gates.newerSnapshotObserved,
      evidence.gates.snapshotFreshnessPass,
      evidence.gates.providerLeakagePass,
    ].every(Boolean) ? 'accepted' : 'rejected'
  } catch (error) {
    evidence.error = safeError(error)
    evidence.outcome = 'rejected'
  }

  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, 'evidence.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('outcome', evidence.outcome)
  writeOutput('evidence_path', outputPath)
  console.log(JSON.stringify({
    outputPath,
    outcome: evidence.outcome,
    deployment: evidence.deployment,
    beforeSnapshot: evidence.before.snapshot,
    afterSnapshot: evidence.after.snapshot,
    minutesSinceSnapshot: evidence.after.minutesSinceSnapshot,
    providerLeakageRows: evidence.after.providerLeakageRows,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))

  if (evidence.outcome !== 'accepted') process.exit(1)
}

function validateTrigger(trigger) {
  const expiresAt = new Date(String(trigger.expiresAt ?? '')).getTime()
  const createdAt = new Date(String(trigger.createdAt ?? '')).getTime()
  return trigger.schemaVersion === 'viewloom-12a4-kick-normal-collector-recovery-trigger-v1'
    && trigger.status === 'armed'
    && trigger.provider === 'kick'
    && trigger.oneTime === true
    && trigger.confirmation === 'RECOVER_KICK_NORMAL_COLLECTOR'
    && Number.isSafeInteger(trigger.attempt)
    && trigger.attempt > 0
    && Number.isFinite(createdAt)
    && Number.isFinite(expiresAt)
    && expiresAt > Date.now()
    && expiresAt > createdAt
}

function latestSnapshot(configPath, databaseName) {
  const rows = runD1Select(configPath, databaseName, `
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 1;
`.trim())
  return rows[0] ?? null
}

function providerLeakageRows(configPath, databaseName) {
  const rows = runD1Select(configPath, databaseName, `
SELECT COUNT(*) AS provider_leakage_rows
FROM provider_category_dictionary
WHERE provider != 'kick';
`.trim())
  const value = Number(rows[0]?.provider_leakage_rows)
  return Number.isFinite(value) ? value : null
}

function runD1Select(configPath, databaseName, sql) {
  if (!/^SELECT\b/i.test(sql.trim())) throw new Error('non_select_statement_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', databaseName, '--remote', '--json', '--config', configPath, '--command', sql], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  if (result.status !== 0) throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  return flattenRows(parseLastJson(result.stdout))
}

async function fetchWorkerSettings(accountId, apiToken, serviceName) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, {
    headers: { authorization: `Bearer ${apiToken}` },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) throw new Error(`worker_settings_failed_http_${response.status}`)
  return body
}

function json(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function tomlValue(source, key) {
  const match = source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))
  return match?.[1] ?? null
}

function snapshotTime(snapshot) {
  const value = new Date(String(snapshot?.collected_at ?? snapshot?.bucket_minute ?? '')).getTime()
  return Number.isFinite(value) ? value : Number.NaN
}

function minutesSince(value) {
  const timestamp = new Date(String(value ?? '')).getTime()
  return Number.isFinite(timestamp) ? Math.round(((Date.now() - timestamp) / 60000) * 100) / 100 : null
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

function safeText(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .slice(0, 320)
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : error)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
