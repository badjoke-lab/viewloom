import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  bindingsMatchTrigger,
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
} from './run-12a4-kick-category-capture-canary-execution.mjs'

const CONTRACT_PATH = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json'
const CLEANUP_TRIGGER_PATH = 'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json'
const CATEGORY_TRIGGER_PATH = 'docs/audits/12a4-kick-category-capture-canary-trigger.json'

async function execute() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-canary-expiry-binding-cleanup')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const contract = json(CONTRACT_PATH)
  const cleanupTrigger = json(CLEANUP_TRIGGER_PATH)
  const categoryTrigger = json(CATEGORY_TRIGGER_PATH)
  const normalConfigPath = path.resolve(contract.cleanup.normalConfig)
  const normalConfig = fs.readFileSync(normalConfigPath, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseName = tomlValue(normalConfig, 'database_name')
  if (!serviceName || !databaseName) throw new Error('kick_normal_identity_missing')

  fs.mkdirSync(outputDir, { recursive: true })
  const cleanupStartedAt = new Date().toISOString()
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-canary-expiry-binding-cleanup-evidence-v1',
    provider: 'kick',
    observedAt: cleanupStartedAt,
    cleanupTrigger: sanitizeTrigger(cleanupTrigger),
    categoryTrigger: sanitizeCategoryTrigger(categoryTrigger),
    identity: { serviceName, databaseName, normalConfig: contract.cleanup.normalConfig },
    before: { serviceBindings: null, latestSnapshot: null },
    deployment: { required: false, attempted: false, exitCode: null, succeeded: false },
    after: {
      serviceBindings: null,
      latestSnapshot: null,
      minutesSinceSnapshot: null,
      categoryPayloadRowsAfterGrace: null,
      providerLeakageRows: null,
      pollAttemptsUsed: 0,
    },
    gates: {
      cleanupTriggerValid: false,
      categoryTriggerIdentityPass: false,
      categoryTriggerExpired: false,
      normalCronConfigured: false,
      serviceStateRecognized: false,
      deployPass: false,
      canaryBindingsAbsentAfterCleanup: false,
      permanentCategoryFlagAbsentAfterCleanup: false,
      newerSnapshotObserved: false,
      snapshotFreshnessPass: false,
      snapshotAuthenticatedPass: false,
      snapshotNonemptyPass: false,
      noCategoryPayloadAfterGracePass: false,
      providerLeakagePass: false,
      twitchChanged: false,
      manualCollectCalled: false,
      categoryCanaryRestarted: false,
      productionPermanentEnablementAuthorized: false,
    },
    outcome: 'rejected',
    error: null,
  }

  try {
    evidence.gates.cleanupTriggerValid = validateCleanupTrigger(cleanupTrigger, contract)
    evidence.gates.categoryTriggerIdentityPass = validateCategoryTriggerIdentity(categoryTrigger, contract)
    evidence.gates.categoryTriggerExpired = new Date(categoryTrigger.until).getTime() <= Date.now()
    evidence.gates.normalCronConfigured = normalConfig.includes(`crons = ["${contract.cleanup.expectedCron}"]`)
    if (!evidence.gates.cleanupTriggerValid) throw new Error('cleanup_trigger_invalid_or_expired')
    if (!evidence.gates.categoryTriggerIdentityPass) throw new Error('category_trigger_identity_mismatch')
    if (!evidence.gates.categoryTriggerExpired) throw new Error('category_trigger_not_expired')
    if (!evidence.gates.normalCronConfigured) throw new Error('normal_kick_cron_not_configured')
    if (/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig)) throw new Error('permanent_category_flag_in_normal_config')

    evidence.before.latestSnapshot = latestSnapshot(normalConfigPath, databaseName)
    const beforeSnapshotMs = snapshotTime(evidence.before.latestSnapshot)
    const settingsBefore = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.before.serviceBindings = canaryBindingsFromSettings(settingsBefore)
    const alreadyClean = canaryBindingsAbsent(evidence.before.serviceBindings)
    const exactExpiredBindings = bindingsMatchTrigger(evidence.before.serviceBindings, categoryTrigger)
    evidence.gates.serviceStateRecognized = alreadyClean || exactExpiredBindings
    if (!evidence.gates.serviceStateRecognized) {
      throw new Error(`unexpected_service_bindings:${JSON.stringify(evidence.before.serviceBindings)}`)
    }

    if (exactExpiredBindings) {
      evidence.deployment.required = true
      evidence.deployment.attempted = true
      const deployed = spawnSync('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', normalConfigPath], {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: process.env,
        maxBuffer: 8 * 1024 * 1024,
      })
      evidence.deployment.exitCode = deployed.status
      evidence.deployment.succeeded = deployed.status === 0
      if (deployed.status !== 0) throw new Error(`normal_kick_deploy_failed:${safeText(deployed.stderr || deployed.stdout)}`)
    }
    evidence.gates.deployPass = alreadyClean || evidence.deployment.succeeded

    const settingsAfter = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.after.serviceBindings = canaryBindingsFromSettings(settingsAfter)
    evidence.gates.canaryBindingsAbsentAfterCleanup = canaryBindingsAbsent(evidence.after.serviceBindings)
    evidence.gates.permanentCategoryFlagAbsentAfterCleanup = evidence.after.serviceBindings.categoryCaptureDirectFlagPresent === false
    if (!evidence.gates.canaryBindingsAbsentAfterCleanup || !evidence.gates.permanentCategoryFlagAbsentAfterCleanup) {
      throw new Error('normal_deploy_left_category_binding')
    }

    for (let attempt = 1; attempt <= Number(contract.cleanup.pollAttempts); attempt += 1) {
      evidence.after.pollAttemptsUsed = attempt
      const snapshot = latestSnapshot(normalConfigPath, databaseName)
      evidence.after.latestSnapshot = snapshot
      const afterSnapshotMs = snapshotTime(snapshot)
      evidence.gates.newerSnapshotObserved = Number.isFinite(afterSnapshotMs)
        && (!Number.isFinite(beforeSnapshotMs) || afterSnapshotMs > beforeSnapshotMs)
      evidence.after.minutesSinceSnapshot = minutesSince(snapshot?.collected_at ?? snapshot?.bucket_minute)
      evidence.gates.snapshotFreshnessPass = Number.isFinite(evidence.after.minutesSinceSnapshot)
        && evidence.after.minutesSinceSnapshot <= Number(contract.cleanup.freshnessMinutesMax)
      evidence.gates.snapshotAuthenticatedPass = snapshot?.source_mode === 'authenticated'
      evidence.gates.snapshotNonemptyPass = Number(snapshot?.stream_count) > 0
      if (
        evidence.gates.newerSnapshotObserved
        && evidence.gates.snapshotFreshnessPass
        && evidence.gates.snapshotAuthenticatedPass
        && evidence.gates.snapshotNonemptyPass
      ) break
      if (attempt < Number(contract.cleanup.pollAttempts)) await sleep(Number(contract.cleanup.pollIntervalSeconds) * 1000)
    }

    const graceUntil = new Date(new Date(categoryTrigger.until).getTime() + 10 * 60_000).toISOString()
    evidence.after.categoryPayloadRowsAfterGrace = countCategoryPayloadRowsAfter(normalConfigPath, databaseName, graceUntil)
    evidence.after.providerLeakageRows = providerLeakageRows(normalConfigPath, databaseName)
    evidence.gates.noCategoryPayloadAfterGracePass = Number(evidence.after.categoryPayloadRowsAfterGrace)
      <= Number(contract.cleanup.maximumCategoryPayloadRowsAfterGrace)
    evidence.gates.providerLeakagePass = Number(evidence.after.providerLeakageRows)
      <= Number(contract.cleanup.maximumProviderLeakageRows)

    evidence.outcome = [
      evidence.gates.cleanupTriggerValid,
      evidence.gates.categoryTriggerIdentityPass,
      evidence.gates.categoryTriggerExpired,
      evidence.gates.normalCronConfigured,
      evidence.gates.serviceStateRecognized,
      evidence.gates.deployPass,
      evidence.gates.canaryBindingsAbsentAfterCleanup,
      evidence.gates.permanentCategoryFlagAbsentAfterCleanup,
      evidence.gates.newerSnapshotObserved,
      evidence.gates.snapshotFreshnessPass,
      evidence.gates.snapshotAuthenticatedPass,
      evidence.gates.snapshotNonemptyPass,
      evidence.gates.noCategoryPayloadAfterGracePass,
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
    before: evidence.before,
    after: evidence.after,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))
  if (evidence.outcome !== 'accepted') process.exit(1)
}

function validateCleanupTrigger(trigger, contract) {
  const createdAt = new Date(String(trigger.createdAt ?? '')).getTime()
  const expiresAt = new Date(String(trigger.expiresAt ?? '')).getTime()
  return trigger.schemaVersion === contract.trigger.schemaVersion
    && trigger.status === 'armed'
    && trigger.provider === 'kick'
    && trigger.oneTime === true
    && trigger.confirmation === contract.trigger.confirmation
    && trigger.attempt === 1
    && trigger.sourceWorkflowRunId === contract.rejectedAcceptanceEvidence.workflowRunId
    && trigger.sourceWorkflowJobId === contract.rejectedAcceptanceEvidence.workflowJobId
    && trigger.sourceArtifactId === contract.rejectedAcceptanceEvidence.artifactId
    && trigger.categoryCanaryAttempt === contract.acceptedCanaryIdentity.attempt
    && Number.isFinite(createdAt)
    && Number.isFinite(expiresAt)
    && expiresAt > Date.now()
    && expiresAt > createdAt
}

function validateCategoryTriggerIdentity(trigger, contract) {
  return trigger.schemaVersion === 'viewloom-12a4-kick-category-capture-canary-trigger-v1'
    && trigger.status === 'armed'
    && trigger.provider === 'kick'
    && trigger.attempt === contract.acceptedCanaryIdentity.attempt
    && trigger.startAt === contract.acceptedCanaryIdentity.startAt
    && trigger.until === contract.acceptedCanaryIdentity.until
    && trigger.confirmation === 'RUN_KICK_CATEGORY_CAPTURE_CANARY'
}

function sanitizeTrigger(trigger) {
  return {
    schemaVersion: trigger.schemaVersion,
    status: trigger.status,
    provider: trigger.provider,
    oneTime: trigger.oneTime,
    confirmation: trigger.confirmation,
    attempt: trigger.attempt,
    createdAt: trigger.createdAt,
    expiresAt: trigger.expiresAt,
    sourceWorkflowRunId: trigger.sourceWorkflowRunId,
    sourceWorkflowJobId: trigger.sourceWorkflowJobId,
    sourceArtifactId: trigger.sourceArtifactId,
    categoryCanaryAttempt: trigger.categoryCanaryAttempt,
  }
}

function sanitizeCategoryTrigger(trigger) {
  return {
    status: trigger.status,
    provider: trigger.provider,
    attempt: trigger.attempt,
    startAt: trigger.startAt,
    until: trigger.until,
  }
}

function latestSnapshot(configPath, databaseName) {
  return runD1Select(configPath, databaseName, `
SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
FROM minute_snapshots
WHERE provider = 'kick'
ORDER BY bucket_minute DESC
LIMIT 1;
`.trim())[0] ?? null
}

function countCategoryPayloadRowsAfter(configPath, databaseName, graceUntil) {
  const rows = runD1Select(configPath, databaseName, `
SELECT COUNT(*) AS category_payload_rows_after_grace
FROM minute_snapshots
WHERE provider = 'kick'
  AND collected_at > '${sqlText(graceUntil)}'
  AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1';
`.trim())
  return finiteNumber(rows[0]?.category_payload_rows_after_grace)
}

function providerLeakageRows(configPath, databaseName) {
  const rows = runD1Select(configPath, databaseName, `
SELECT COUNT(*) AS provider_leakage_rows
FROM provider_category_dictionary
WHERE provider != 'kick';
`.trim())
  return finiteNumber(rows[0]?.provider_leakage_rows)
}

function runD1Select(configPath, databaseName, sql) {
  if (!/^SELECT\b/i.test(sql.trim())) throw new Error('non_select_statement_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', databaseName, '--remote', '--json', '--config', configPath, '--command', sql], {
    cwd: process.cwd(), encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024,
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

function json(file) { return JSON.parse(fs.readFileSync(file, 'utf8')) }
function tomlValue(source, key) { return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null }
function sqlText(value) { return String(value ?? '').replace(/'/g, "''") }
function snapshotTime(snapshot) {
  const value = new Date(String(snapshot?.collected_at ?? snapshot?.bucket_minute ?? '')).getTime()
  return Number.isFinite(value) ? value : Number.NaN
}
function minutesSince(value) {
  const timestamp = new Date(String(value ?? '')).getTime()
  return Number.isFinite(timestamp) ? Math.round(((Date.now() - timestamp) / 60000) * 100) / 100 : null
}
function finiteNumber(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null }
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
    : Array.isArray(group?.result?.[0]?.results) ? group.result[0].results : [])
}
function safeText(value) {
  return String(value ?? '').replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').replace(/[0-9a-f]{32,}/gi, '[redacted-id]').slice(0, 320)
}
function safeError(error) { return safeText(error instanceof Error ? error.message : error) }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
function writeOutput(key, value) { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`) }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  execute().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
