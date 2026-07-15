import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  canaryBindingsAbsent,
  canaryBindingsFromSettings,
} from './run-12a4-kick-category-capture-canary-execution.mjs'

const CONTRACT_PATH = 'docs/audits/12a4-kick-normal-collector-recovery-acceptance-contract.json'
const NORMAL_CONFIG_PATH = 'workers/collector-kick/wrangler.toml'
const CATEGORY_TRIGGER_PATH = 'docs/audits/12a4-kick-category-capture-canary-trigger.json'

async function execute() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-normal-collector-recovery-acceptance')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const contract = json(CONTRACT_PATH)
  const normalConfig = fs.readFileSync(NORMAL_CONFIG_PATH, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  const databaseName = tomlValue(normalConfig, 'database_name')
  if (!serviceName || !databaseName) throw new Error('kick_normal_identity_missing')

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-normal-collector-recovery-acceptance-evidence-v1',
    provider: 'kick',
    observedAt: new Date().toISOString(),
    recovery: {
      packagePr: contract.recoveryPackagePr,
      packageMergeSha: contract.recoveryPackageMergeSha,
      executionPr: contract.recoveryExecutionPr,
      executionMergeSha: contract.recoveryExecutionMergeSha,
      attempt: contract.recoveryAttempt,
    },
    polling: {
      intervalSeconds: contract.acceptance.pollIntervalSeconds,
      attemptsMax: contract.acceptance.pollAttempts,
      attemptsUsed: 0,
    },
    snapshot: null,
    minutesSinceSnapshot: null,
    serviceBindings: null,
    providerLeakageRows: null,
    gates: {
      readOnly: true,
      categoryCanaryTriggerAbsent: false,
      snapshotPresent: false,
      snapshotNewerThanIncident: false,
      snapshotFreshnessPass: false,
      canaryBindingsAbsent: false,
      permanentCategoryFlagAbsent: false,
      providerLeakagePass: false,
      twitchChanged: false,
      productionMutationAuthorized: false,
    },
    outcome: 'rejected',
    error: null,
  }

  try {
    evidence.gates.categoryCanaryTriggerAbsent = !fs.existsSync(CATEGORY_TRIGGER_PATH)
    const incidentTime = new Date(contract.incidentSnapshot.collectedAt).getTime()

    for (let attempt = 1; attempt <= Number(contract.acceptance.pollAttempts); attempt += 1) {
      evidence.polling.attemptsUsed = attempt
      evidence.snapshot = latestSnapshot(NORMAL_CONFIG_PATH, databaseName)
      evidence.gates.snapshotPresent = Boolean(evidence.snapshot)
      evidence.minutesSinceSnapshot = minutesSince(evidence.snapshot?.collected_at ?? evidence.snapshot?.bucket_minute)
      const currentTime = new Date(String(evidence.snapshot?.collected_at ?? evidence.snapshot?.bucket_minute ?? '')).getTime()
      evidence.gates.snapshotNewerThanIncident = Number.isFinite(currentTime) && currentTime > incidentTime
      evidence.gates.snapshotFreshnessPass = Number.isFinite(evidence.minutesSinceSnapshot)
        && evidence.minutesSinceSnapshot <= Number(contract.acceptance.freshnessMinutesMax)
      if (evidence.gates.snapshotPresent && evidence.gates.snapshotNewerThanIncident && evidence.gates.snapshotFreshnessPass) break
      if (attempt < Number(contract.acceptance.pollAttempts)) await sleep(Number(contract.acceptance.pollIntervalSeconds) * 1000)
    }

    const settings = await fetchWorkerSettings(accountId, apiToken, serviceName)
    evidence.serviceBindings = canaryBindingsFromSettings(settings)
    evidence.gates.canaryBindingsAbsent = canaryBindingsAbsent(evidence.serviceBindings)
    evidence.gates.permanentCategoryFlagAbsent = evidence.serviceBindings.categoryCaptureDirectFlagPresent === false

    evidence.providerLeakageRows = providerLeakageRows(NORMAL_CONFIG_PATH, databaseName)
    evidence.gates.providerLeakagePass = Number(evidence.providerLeakageRows) <= Number(contract.acceptance.maximumProviderLeakageRows)

    evidence.outcome = [
      evidence.gates.categoryCanaryTriggerAbsent,
      evidence.gates.snapshotPresent,
      evidence.gates.snapshotNewerThanIncident,
      evidence.gates.snapshotFreshnessPass,
      evidence.gates.canaryBindingsAbsent,
      evidence.gates.permanentCategoryFlagAbsent,
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
    recovery: evidence.recovery,
    polling: evidence.polling,
    snapshot: evidence.snapshot,
    minutesSinceSnapshot: evidence.minutesSinceSnapshot,
    providerLeakageRows: evidence.providerLeakageRows,
    gates: evidence.gates,
    error: evidence.error,
  }, null, 2))
  if (evidence.outcome !== 'accepted') process.exit(1)
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
