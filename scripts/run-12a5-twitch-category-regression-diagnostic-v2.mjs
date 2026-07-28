import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIG = 'workers/collector-twitch/wrangler.toml'
const START_AT = '2026-07-20T11:40:00.000Z'

async function run() {
  const configPath = path.resolve(CONFIG)
  const config = fs.readFileSync(configPath, 'utf8')
  const databaseId = toml(config, 'database_id')
  const serviceName = toml(config, 'name')
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  if (!databaseId || !serviceName || !accountId || !apiToken) throw new Error('diagnostic_identity_or_credentials_missing')

  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a5-twitch-category-regression-diagnostic-v2')
  fs.mkdirSync(outputDir, { recursive: true })
  const rows = d1(configPath, `
SELECT
  MIN(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' THEN bucket_minute END) AS first_category_bucket,
  MAX(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' THEN bucket_minute END) AS last_category_bucket,
  MIN(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') IS NULL THEN bucket_minute END) AS first_normal_bucket,
  MAX(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') IS NULL THEN bucket_minute END) AS last_normal_bucket,
  COUNT(*) AS total_rows,
  SUM(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' THEN 1 ELSE 0 END) AS category_rows,
  SUM(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') IS NULL THEN 1 ELSE 0 END) AS normal_rows
FROM minute_snapshots
WHERE provider = 'twitch' AND collected_at >= '${START_AT}';
SELECT
  substr(bucket_minute, 1, 10) AS day,
  COUNT(*) AS total_rows,
  SUM(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1' THEN 1 ELSE 0 END) AS category_rows,
  SUM(CASE WHEN json_extract(payload_json, '$.categoryContractVersion') IS NULL THEN 1 ELSE 0 END) AS normal_rows,
  MIN(bucket_minute) AS first_bucket,
  MAX(bucket_minute) AS last_bucket
FROM minute_snapshots
WHERE provider = 'twitch' AND collected_at >= '${START_AT}'
GROUP BY substr(bucket_minute, 1, 10)
ORDER BY day;
SELECT * FROM collector_runs
WHERE provider = 'twitch' AND run_at >= '${START_AT}' AND status = 'error'
ORDER BY run_at;
SELECT sql AS collector_runs_schema FROM sqlite_master WHERE type = 'table' AND name = 'collector_runs';
WITH boundary AS (
  SELECT MAX(bucket_minute) AS last_category_bucket
  FROM minute_snapshots
  WHERE provider = 'twitch' AND collected_at >= '${START_AT}'
    AND json_extract(payload_json, '$.categoryContractVersion') = 'category-source-v1'
)
SELECT
  snapshots.bucket_minute,
  snapshots.collected_at,
  snapshots.source_mode,
  snapshots.stream_count,
  snapshots.total_viewers,
  json_extract(snapshots.payload_json, '$.categoryContractVersion') AS category_contract_version
FROM minute_snapshots AS snapshots, boundary
WHERE snapshots.provider = 'twitch'
  AND snapshots.bucket_minute >= datetime(boundary.last_category_bucket, '-30 minutes')
  AND snapshots.bucket_minute <= datetime(boundary.last_category_bucket, '+60 minutes')
ORDER BY snapshots.bucket_minute;
`.trim())

  const summary = rows.find((row) => Object.hasOwn(row, 'first_category_bucket')) ?? null
  const daily = rows.filter((row) => Object.hasOwn(row, 'day'))
  const schema = rows.find((row) => Object.hasOwn(row, 'collector_runs_schema'))?.collector_runs_schema ?? null
  const transition = rows.filter((row) => Object.hasOwn(row, 'bucket_minute')).map(sanitizeRow)
  const errors = rows.filter((row) => Object.hasOwn(row, 'run_at')).map(sanitizeRow)

  let deployments = null
  let deploymentsError = null
  try {
    const body = await cf(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/deployments`, apiToken)
    deployments = sanitize(body?.result ?? null)
  } catch (error) {
    deploymentsError = safe(error)
  }

  const settings = await cf(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, apiToken)
  const bindings = Array.isArray(settings?.result?.bindings) ? settings.result.bindings : []
  const plainBindings = bindings.filter((value) => value?.type === 'plain_text').map((value) => ({
    name: String(value.name ?? ''),
    text: value.name === 'CATEGORY_CAPTURE_ENABLED' ? String(value.text ?? '') : '[redacted-or-irrelevant]',
  }))

  const evidence = {
    schemaVersion: 'viewloom-12a5-twitch-category-regression-diagnostic-v2',
    observedAt: new Date().toISOString(),
    provider: 'twitch',
    readOnly: true,
    identity: { serviceName, databaseId },
    currentPlainBindings: plainBindings,
    summary,
    daily,
    collectorRunsSchema: schema,
    collectorErrors: errors,
    transition,
    deployments,
    deploymentsError,
  }
  const out = path.join(outputDir, 'diagnostic.json')
  fs.writeFileSync(out, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ out, summary, daily, collectorErrors: errors, transition, deploymentsError }, null, 2))
}

function d1(configPath, sql) {
  if (sql.split(';').map((part) => part.trim()).filter(Boolean).some((part) => !/^(SELECT|WITH)\b/i.test(part))) throw new Error('non_select_rejected')
  const result = spawnSync('pnpm', ['dlx', 'wrangler@4', 'd1', 'execute', 'vl_twitch_hot', '--remote', '--json', '--config', configPath, '--command', sql], { encoding: 'utf8', env: process.env, maxBuffer: 30 * 1024 * 1024 })
  if (result.status !== 0) throw new Error(`d1_failed:${safe(result.stderr || result.stdout)}`)
  return flatten(parseLastJson(result.stdout || result.stderr))
}
function flatten(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => Array.isArray(group?.results) ? group.results : Array.isArray(group?.result?.[0]?.results) ? group.result[0].results : [])
}
function parseLastJson(value) {
  const source = String(value ?? '').replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
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
async function cf(url, token) {
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  const body = await response.json().catch(() => null)
  if (!response.ok || body?.success !== true) throw new Error(`cloudflare_get_failed_${response.status}`)
  return body
}
function toml(source, key) { return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null }
function sanitizeRow(row) { return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, /error|message|detail/i.test(key) ? safe(value) : value])) }
function sanitize(value) { return JSON.parse(JSON.stringify(value, (key, item) => /token|secret|password|content/i.test(key) ? '[redacted]' : item)) }
function safe(value) { return String(value instanceof Error ? value.message : value ?? '').replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/[0-9a-f]{32,}/gi, '[redacted-id]').slice(0, 500) }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) run().catch((error) => { console.error(safe(error)); process.exit(1) })
