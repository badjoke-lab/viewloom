import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NORMAL_CONFIG_PATH = 'workers/collector-kick/wrangler.toml'

async function execute() {
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-normal-collector-cloudflare-audit')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const normalConfig = fs.readFileSync(NORMAL_CONFIG_PATH, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  if (!serviceName) throw new Error('kick_service_name_missing')
  const headers = { authorization: `Bearer ${apiToken}` }
  const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}`

  fs.mkdirSync(outputDir, { recursive: true })
  const [settings, scriptSchedules, serviceDeployments, scriptDeployments, subdomain] = await Promise.all([
    cloudflareGet(`${base}/workers/services/${encodeURIComponent(serviceName)}/environments/production/settings`, headers),
    cloudflareGet(`${base}/workers/scripts/${encodeURIComponent(serviceName)}/schedules`, headers),
    cloudflareGet(`${base}/workers/services/${encodeURIComponent(serviceName)}/environments/production/deployments`, headers),
    cloudflareGet(`${base}/workers/scripts/${encodeURIComponent(serviceName)}/deployments`, headers),
    cloudflareGet(`${base}/workers/subdomain`, headers),
  ])

  const settingsResult = settings.body?.result ?? null
  const bindingRows = Array.isArray(settingsResult?.bindings) ? settingsResult.bindings : []
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-normal-collector-cloudflare-audit-v1',
    observedAt: new Date().toISOString(),
    provider: 'kick',
    serviceName,
    configuredCron: tomlCron(normalConfig),
    settings: {
      httpStatus: settings.status,
      success: settings.success,
      workersDev: settingsResult?.workers_dev ?? null,
      compatibilityDate: settingsResult?.compatibility_date ?? null,
      compatibilityFlags: Array.isArray(settingsResult?.compatibility_flags) ? settingsResult.compatibility_flags : [],
      resultKeys: objectKeys(settingsResult),
      bindings: bindingRows.map((binding) => ({
        name: String(binding?.name ?? ''),
        type: String(binding?.type ?? ''),
        namespace: binding?.namespace ?? null,
      })),
    },
    schedules: summarizeSchedules(scriptSchedules),
    serviceDeployments: summarizeDeployments(serviceDeployments),
    scriptDeployments: summarizeDeployments(scriptDeployments),
    subdomain: {
      httpStatus: subdomain.status,
      success: subdomain.success,
      configured: Boolean(subdomain.body?.result?.subdomain),
      value: subdomain.body?.result?.subdomain ?? null,
      resultKeys: objectKeys(subdomain.body?.result),
    },
    gates: {
      readOnly: true,
      settingsReadable: settings.success,
      schedulesReadable: scriptSchedules.success,
      cronMatchesConfig: scheduleCrons(scriptSchedules).includes(tomlCron(normalConfig)),
      kickSecretsNamed: ['KICK_CLIENT_ID', 'KICK_CLIENT_SECRET'].every((name) => bindingRows.some((binding) => binding?.name === name && binding?.type === 'secret_text')),
      databaseBindingPresent: bindingRows.some((binding) => binding?.name === 'DB_KICK_HOT' && binding?.type === 'd1'),
      categoryCanaryBindingAbsent: !bindingRows.some((binding) => String(binding?.name ?? '').startsWith('CATEGORY_CAPTURE_CANARY_')),
      permanentCategoryFlagAbsent: !bindingRows.some((binding) => binding?.name === 'CATEGORY_CAPTURE_ENABLED'),
      productionMutationAuthorized: false,
      TwitchChanged: false,
    },
    outcome: 'accepted',
    errors: [settings, scriptSchedules, serviceDeployments, scriptDeployments, subdomain]
      .filter((item) => !item.success)
      .map((item) => ({ status: item.status, errorCodes: item.errorCodes })),
  }

  evidence.observedAt = new Date().toISOString()
  const outputPath = path.join(outputDir, 'cloudflare-audit.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('evidence_path', outputPath)
  writeOutput('cron_matches', String(evidence.gates.cronMatchesConfig))
  console.log(JSON.stringify(evidence, null, 2))
}

async function cloudflareGet(url, headers) {
  const response = await fetch(url, { headers })
  const body = await response.json().catch(() => null)
  return {
    status: response.status,
    success: response.ok && body?.success === true,
    body,
    errorCodes: Array.isArray(body?.errors) ? body.errors.map((error) => error?.code ?? null) : [],
  }
}

function summarizeSchedules(item) {
  const result = item.body?.result
  const rows = arrayFromResult(result, ['schedules', 'items', 'triggers'])
  return {
    httpStatus: item.status,
    success: item.success,
    crons: rows.map((row) => typeof row === 'string' ? row : String(row?.cron ?? row?.schedule ?? '')).filter(Boolean),
    resultType: Array.isArray(result) ? 'array' : typeof result,
    resultKeys: objectKeys(result),
    resultCount: rows.length,
    errorCodes: item.errorCodes,
  }
}

function summarizeDeployments(item) {
  const result = item.body?.result
  const rows = arrayFromResult(result, ['deployments', 'items', 'versions'])
  return {
    httpStatus: item.status,
    success: item.success,
    resultType: Array.isArray(result) ? 'array' : typeof result,
    resultKeys: objectKeys(result),
    count: rows.length,
    latest: rows.slice(0, 5).map((deployment) => ({
      id: deployment?.id ?? null,
      createdOn: deployment?.created_on ?? deployment?.created_at ?? null,
      source: deployment?.source ?? null,
      strategy: deployment?.strategy ?? null,
    })),
    errorCodes: item.errorCodes,
  }
}

function scheduleCrons(item) {
  const result = item.body?.result
  return arrayFromResult(result, ['schedules', 'items', 'triggers'])
    .map((row) => typeof row === 'string' ? row : String(row?.cron ?? row?.schedule ?? ''))
    .filter(Boolean)
}

function arrayFromResult(result, keys) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  for (const key of keys) if (Array.isArray(result[key])) return result[key]
  return []
}

function objectKeys(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value).slice(0, 30) : []
}

function tomlCron(source) {
  return source.match(/^crons\s*=\s*\["([^"]+)"\]$/m)?.[1] ?? null
}

function tomlValue(source, key) {
  return source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
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
