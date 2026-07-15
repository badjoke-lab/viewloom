import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NORMAL_CONFIG_PATH = 'workers/collector-kick/wrangler.toml'
const TAIL_DURATION_SECONDS = 420
const EMERGENCY_KILL_MS = (TAIL_DURATION_SECONDS + 20) * 1000
const MAX_EVENTS = 40

async function execute() {
  const outputDir = path.resolve(process.env.OUTPUT_DIR ?? 'artifacts/12a4-kick-normal-collector-tail-audit')
  const normalConfig = fs.readFileSync(NORMAL_CONFIG_PATH, 'utf8')
  const serviceName = tomlValue(normalConfig, 'name')
  if (!serviceName || !/^[A-Za-z0-9_-]+$/.test(serviceName)) throw new Error('kick_service_name_missing_or_invalid')
  if (!String(process.env.CLOUDFLARE_API_TOKEN ?? '').trim() || !String(process.env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()) {
    throw new Error('cloudflare_credentials_missing')
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const evidence = {
    schemaVersion: 'viewloom-12a4-kick-normal-collector-tail-audit-v1',
    provider: 'kick',
    serviceName,
    startedAt: new Date().toISOString(),
    completedAt: null,
    durationSeconds: TAIL_DURATION_SECONDS,
    command: 'timeout 420s wrangler tail <kick-service> --format json',
    productionMutationAuthorized: false,
    rawRequestDataStored: false,
    rawLogArtifactStored: false,
    events: [],
    cli: {
      exitCode: null,
      signal: null,
      spawnError: null,
      stderrSummary: [],
      boundedTimeoutExitAccepted: false,
    },
    summary: {
      jsonEventsObserved: 0,
      scheduledEventsObserved: 0,
      successfulEvents: 0,
      failedEvents: 0,
      exceptionsObserved: 0,
      logMessagesObserved: 0,
    },
    outcome: 'diagnostic_complete',
  }

  const child = spawn('timeout', [
    '--signal=INT',
    '--kill-after=10s',
    `${TAIL_DURATION_SECONDS}s`,
    'pnpm',
    'dlx',
    'wrangler@4',
    'tail',
    serviceName,
    '--format',
    'json',
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stdoutBuffer = ''
  let stderrBuffer = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')

  child.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk
    const lines = stdoutBuffer.split(/\r?\n/)
    stdoutBuffer = lines.pop() ?? ''
    for (const line of lines) consumeLine(line, evidence)
  })
  child.stderr.on('data', (chunk) => {
    stderrBuffer += chunk
    if (stderrBuffer.length > 64 * 1024) stderrBuffer = stderrBuffer.slice(-64 * 1024)
  })
  child.on('error', (error) => {
    evidence.cli.spawnError = safeText(error.message, 500)
  })

  const emergencyTimer = setTimeout(() => {
    if (!child.killed) child.kill('SIGKILL')
  }, EMERGENCY_KILL_MS)

  const close = await new Promise((resolve) => {
    child.on('close', (code, signal) => resolve({ code, signal }))
  })
  clearTimeout(emergencyTimer)
  if (stdoutBuffer.trim()) consumeLine(stdoutBuffer, evidence)

  evidence.cli.exitCode = close.code
  evidence.cli.signal = close.signal
  evidence.cli.boundedTimeoutExitAccepted = close.code === 124 || close.code === 130 || close.signal === 'SIGINT'
  evidence.cli.stderrSummary = stderrBuffer
    .split(/\r?\n/)
    .map((line) => safeText(line, 500))
    .filter(Boolean)
    .slice(-20)
  evidence.completedAt = new Date().toISOString()

  const outputPath = path.join(outputDir, 'tail-audit.json')
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
  writeOutput('evidence_path', outputPath)
  writeOutput('failed_events', String(evidence.summary.failedEvents))
  writeOutput('exceptions', String(evidence.summary.exceptionsObserved))
  console.log(JSON.stringify({
    outputPath,
    summary: evidence.summary,
    cli: evidence.cli,
    events: evidence.events,
  }, null, 2))
}

function consumeLine(line, evidence) {
  const text = String(line ?? '').trim()
  if (!text) return
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return
  }

  evidence.summary.jsonEventsObserved += 1
  if (evidence.events.length >= MAX_EVENTS) return
  const sanitized = sanitizeTailEvent(parsed)
  evidence.events.push(sanitized)
  if (sanitized.eventType === 'scheduled') evidence.summary.scheduledEventsObserved += 1
  if (sanitized.outcome === 'ok') evidence.summary.successfulEvents += 1
  else if (sanitized.outcome) evidence.summary.failedEvents += 1
  evidence.summary.exceptionsObserved += sanitized.exceptions.length
  evidence.summary.logMessagesObserved += sanitized.logs.length
}

function sanitizeTailEvent(value) {
  const event = record(value?.event)
  const scheduled = record(event?.scheduled)
  const logs = Array.isArray(value?.logs) ? value.logs : []
  const exceptions = Array.isArray(value?.exceptions) ? value.exceptions : []
  return {
    timestamp: isoOrNull(value?.eventTimestamp ?? value?.timestamp),
    eventType: eventType(event),
    scheduledTime: isoOrNull(scheduled?.scheduledTime ?? event?.scheduledTime),
    cron: safeText(scheduled?.cron ?? event?.cron ?? '', 100) || null,
    outcome: safeText(value?.outcome ?? '', 100) || null,
    scriptName: safeText(value?.scriptName ?? value?.script_name ?? '', 120) || null,
    logs: logs.slice(0, 20).map((entry) => ({
      level: safeText(entry?.level ?? '', 40) || null,
      message: safeMessage(entry?.message ?? entry),
      timestamp: isoOrNull(entry?.timestamp),
    })),
    exceptions: exceptions.slice(0, 10).map((entry) => ({
      name: safeText(entry?.name ?? 'Error', 120),
      message: safeMessage(entry?.message ?? entry),
      timestamp: isoOrNull(entry?.timestamp),
    })),
  }
}

function eventType(event) {
  if (record(event?.scheduled) || Object.hasOwn(event, 'scheduledTime') || Object.hasOwn(event, 'cron')) return 'scheduled'
  if (record(event?.request)) return 'request_redacted'
  return safeText(event?.type ?? 'unknown', 80)
}

function safeMessage(value) {
  const text = Array.isArray(value) ? value.map((part) => stringifyPart(part)).join(' ') : stringifyPart(value)
  return safeText(text, 800)
}

function stringifyPart(value) {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  try { return JSON.stringify(value) } catch { return String(value) }
}

function safeText(value, max) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/https?:\/\/[^\s"']+/gi, '[redacted-url]')
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '[redacted-id]')
    .replace(/[A-Za-z0-9_-]{40,}/g, '[redacted-token]')
    .slice(0, max)
}

function isoOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(String(value))
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
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
