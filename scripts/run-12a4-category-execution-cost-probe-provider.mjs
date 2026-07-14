import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIRMATION = 'RUN_RESERVED_CATEGORY_COST_PROBE'
const PROVIDERS = new Set(['twitch', 'kick'])

export function snapshotLatencyMs(snapshot) {
  const bucket = Date.parse(String(snapshot?.bucket_minute ?? ''))
  const collected = Date.parse(String(snapshot?.collected_at ?? ''))
  if (!Number.isFinite(bucket) || !Number.isFinite(collected)) return Number.POSITIVE_INFINITY
  return Math.abs(collected - bucket)
}

export function collectorLatencyDeltaMs(preSnapshot, postSnapshot) {
  const before = snapshotLatencyMs(preSnapshot)
  const after = snapshotLatencyMs(postSnapshot)
  if (!Number.isFinite(before) || !Number.isFinite(after)) return Number.POSITIVE_INFINITY
  return Math.abs(after - before)
}

export function parseServiceName(configText) {
  const match = configText.match(/^name\s*=\s*"([^"]+)"/m)
  if (!match) throw new Error('worker_service_name_missing')
  return match[1]
}

export function validateRunId(value) {
  const runId = String(value ?? '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{7,63}$/.test(runId)) throw new Error('invalid_reserved_probe_run_id')
  return runId
}

export function sanitize(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .replace(/https:\/\/[^\s]+workers\.dev/gi, '[redacted-worker-url]')
    .slice(0, 240)
}

async function runProvider() {
  const provider = String(process.env.PROVIDER ?? '').trim().toLowerCase()
  const configPath = path.resolve(String(process.env.CONFIG_PATH ?? ''))
  const outputPath = path.resolve(String(process.env.OUTPUT_PATH ?? ''))
  const runId = validateRunId(process.env.RUN_ID)
  const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  const apiToken = String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim()
  const pollAttempts = positiveInteger(process.env.POLL_ATTEMPTS, 70)
  const pollIntervalMs = positiveInteger(process.env.POLL_INTERVAL_MS, 10000)

  if (!PROVIDERS.has(provider)) throw new Error('invalid_provider')
  if (!configPath || !fs.existsSync(configPath)) throw new Error('config_missing')
  if (!outputPath) throw new Error('output_path_missing')
  if (!accountId || !apiToken) throw new Error('cloudflare_credentials_missing')

  const configText = fs.readFileSync(configPath, 'utf8')
  if (!configText.includes(`PROVIDER = "${provider}"`)) throw new Error('provider_config_mismatch')
  const serviceName = parseServiceName(configText)
  const probeToken = randomBytes(32).toString('hex')
  const raw = {
    provider,
    attempted: true,
    observedAt: new Date().toISOString(),
    worker: null,
    preInspect: null,
    postInspect: null,
    collectorLatencyDeltaMs: Number.POSITIVE_INFINITY,
    lifecycle: {
      preexistingHttpStatus: 0,
      deployExitCode: Number.MAX_SAFE_INTEGER,
      secretExitCode: Number.MAX_SAFE_INTEGER,
      inspectHttpStatus: 0,
      probeHttpStatus: 0,
      pollAttempts: 0,
      naturalSnapshotObserved: false,
      deleteExitCode: Number.MAX_SAFE_INTEGER,
      deleteHttpStatus: 0,
    },
    errors: {
      runner: null,
      delete: null,
    },
  }

  let workerUrl = ''
  let preexistingWasAbsent = false

  try {
    raw.lifecycle.preexistingHttpStatus = await serviceStatus(accountId, apiToken, serviceName)
    preexistingWasAbsent = raw.lifecycle.preexistingHttpStatus === 404
    if (!preexistingWasAbsent) throw new Error(`temporary_worker_preexisting_http_${raw.lifecycle.preexistingHttpStatus}`)

    const deploy = runCommand('pnpm', ['dlx', 'wrangler@4', 'deploy', '--config', configPath])
    raw.lifecycle.deployExitCode = deploy.code
    if (deploy.code !== 0) throw new Error(`wrangler_deploy_failed:${sanitize(deploy.output)}`)
    workerUrl = extractWorkerUrl(deploy.output)
    if (!workerUrl) throw new Error('worker_url_missing')

    const secret = runCommand(
      'pnpm',
      ['dlx', 'wrangler@4', 'secret', 'put', 'PROBE_TOKEN', '--config', configPath],
      probeToken,
    )
    raw.lifecycle.secretExitCode = secret.code
    if (secret.code !== 0) throw new Error(`wrangler_secret_failed:${sanitize(secret.output)}`)

    const pre = await postJson(workerUrl, '/inspect', probeToken, { runId })
    raw.lifecycle.inspectHttpStatus = pre.status
    raw.preInspect = pre.body
    if (pre.status !== 200 || pre.body?.ok !== true) throw new Error(`pre_inspect_failed_http_${pre.status}`)

    const probe = await postJson(workerUrl, '/probe', probeToken, { runId }, {
      'x-viewloom-confirm': CONFIRMATION,
    })
    raw.lifecycle.probeHttpStatus = probe.status
    raw.worker = probe.body

    if (probe.status === 200 && probe.body?.ok === true) {
      const preCollectedAt = String(pre.body?.latestSnapshot?.collected_at ?? '')
      for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
        raw.lifecycle.pollAttempts = attempt
        const candidate = await postJson(workerUrl, '/inspect', probeToken, { runId })
        const candidateCollectedAt = String(candidate.body?.latestSnapshot?.collected_at ?? '')
        if (candidate.status === 200 && candidate.body?.ok === true && preCollectedAt && candidateCollectedAt && candidateCollectedAt !== preCollectedAt) {
          raw.postInspect = candidate.body
          raw.lifecycle.naturalSnapshotObserved = true
          raw.collectorLatencyDeltaMs = collectorLatencyDeltaMs(pre.body?.latestSnapshot, candidate.body?.latestSnapshot)
          break
        }
        await sleep(pollIntervalMs)
      }
    }
  } catch (error) {
    raw.errors.runner = sanitize(error instanceof Error ? error.message : error)
  } finally {
    if (preexistingWasAbsent) {
      try {
        const currentStatus = await serviceStatus(accountId, apiToken, serviceName)
        if (currentStatus !== 404) {
          const deletion = runCommand('pnpm', ['dlx', 'wrangler@4', 'delete', '--config', configPath, '--force'])
          raw.lifecycle.deleteExitCode = deletion.code
        } else {
          raw.lifecycle.deleteExitCode = 0
        }
        raw.lifecycle.deleteHttpStatus = await waitForDeleted(accountId, apiToken, serviceName)
      } catch (error) {
        raw.errors.delete = sanitize(error instanceof Error ? error.message : error)
      }
    }

    raw.observedAt = new Date().toISOString()
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify(raw, jsonReplacer, 2)}\n`)
    console.log(JSON.stringify({
      provider,
      outputPath,
      workerOk: raw.worker?.ok === true,
      naturalSnapshotObserved: raw.lifecycle.naturalSnapshotObserved,
      deleteHttpStatus: raw.lifecycle.deleteHttpStatus,
      runnerError: raw.errors.runner,
      deleteError: raw.errors.delete,
    }, null, 2))
  }
}

function runCommand(command, args, input = undefined) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    input,
    env: process.env,
    maxBuffer: 8 * 1024 * 1024,
  })
  return {
    code: Number.isInteger(result.status) ? result.status : 1,
    output: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim(),
  }
}

async function serviceStatus(accountId, apiToken, serviceName) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/services/${encodeURIComponent(serviceName)}`, {
    headers: { authorization: `Bearer ${apiToken}` },
  })
  return response.status
}

async function waitForDeleted(accountId, apiToken, serviceName) {
  let status = 0
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    status = await serviceStatus(accountId, apiToken, serviceName)
    if (status === 404) return status
    await sleep(2000)
  }
  return status
}

async function postJson(baseUrl, pathname, token, body, extraHeaders = {}) {
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    })
    const text = await response.text()
    let parsed = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = { ok: false, error: 'non_json_response', preview: sanitize(text) }
    }
    return { status: response.status, body: parsed }
  } catch (error) {
    return { status: 0, body: { ok: false, error: sanitize(error instanceof Error ? error.message : error) } }
  }
}

function extractWorkerUrl(output) {
  const matches = String(output).match(/https:\/\/[^\s]+\.workers\.dev/g)
  return matches?.at(-1)?.replace(/[),]+$/, '') ?? ''
}

function positiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jsonReplacer(_key, value) {
  return value === Number.POSITIVE_INFINITY ? null : value
}

async function main() {
  try {
    await runProvider()
  } catch (error) {
    const outputPath = path.resolve(String(process.env.OUTPUT_PATH ?? 'artifacts/12a4-category-execution-cost-probe/provider-runner-failure.json'))
    const provider = String(process.env.PROVIDER ?? 'unknown')
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, `${JSON.stringify({
      provider,
      attempted: false,
      worker: null,
      collectorLatencyDeltaMs: null,
      lifecycle: {},
      errors: { runner: sanitize(error instanceof Error ? error.message : error) },
    }, null, 2)}\n`)
    console.error(sanitize(error instanceof Error ? error.message : error))
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()
