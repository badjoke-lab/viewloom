import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CONFIRMATION = 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY'
const MIN_WINDOW_MS = 23 * 60 * 60 * 1000
const MAX_WINDOW_MS = 25 * 60 * 60 * 1000

export function inspectTwitchCanaryTrigger({
  trigger,
  executionContract,
  packageContract,
  storagePreflight: suppliedStoragePreflight,
  eventName,
  now = new Date(),
}) {
  if (!trigger) return dormant('trigger_absent')
  const storagePreflight = suppliedStoragePreflight ?? loadStoragePreflight(executionContract)
  const failures = []
  const check = (name, condition, actual = undefined) => {
    if (!condition) failures.push({ name, actual })
  }

  check('trigger schema', trigger.schemaVersion === executionContract.trigger.schemaVersion, trigger.schemaVersion)
  check('trigger armed', trigger.status === 'armed', trigger.status)
  check('provider Twitch', trigger.provider === 'twitch', trigger.provider)
  check('one time', trigger.oneTime === true, trigger.oneTime)
  check('confirmation', trigger.confirmation === CONFIRMATION, trigger.confirmation)
  check('positive attempt', Number.isSafeInteger(trigger.attempt) && trigger.attempt > 0, trigger.attempt)
  check('package PR identity', trigger.packagePr === executionContract.trigger.exactPackagePr, trigger.packagePr)
  check('package merge identity', trigger.packageMergeSha === executionContract.trigger.exactPackageMergeSha, trigger.packageMergeSha)
  check('execution PR identity', trigger.executionPackagePr === executionContract.trigger.exactExecutionPackagePr, trigger.executionPackagePr)
  check('execution merge identity', trigger.executionPackageMergeSha === executionContract.trigger.exactExecutionPackageMergeSha, trigger.executionPackageMergeSha)
  check('accepted package', packageContract.status === 'accepted' && packageContract.acceptance?.pr === 590, packageContract.status)
  check('accepted execution package', executionContract.status === 'accepted', executionContract.status)
  check('execution merge identity recorded', executionContract.acceptance?.mergeShaRecorded === true, executionContract.acceptance)

  check('storage preflight present', Boolean(storagePreflight), storagePreflight)
  if (storagePreflight) {
    check('storage preflight schema', storagePreflight.schemaVersion === 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-v1', storagePreflight.schemaVersion)
    check('storage preflight accepted', storagePreflight.status === executionContract.trigger.storagePreflightStatusRequired, storagePreflight.status)
    check('storage preflight provider Twitch', storagePreflight.provider === 'twitch', storagePreflight.provider)
    check('storage preflight pass', storagePreflight.storage?.pass === true, storagePreflight.storage)
    check('storage preflight PR identity', trigger.storagePreflightPr === storagePreflight.acceptance?.pr, trigger.storagePreflightPr)
    check('storage preflight merge identity', trigger.storagePreflightMergeSha === storagePreflight.acceptance?.mergeSha, trigger.storagePreflightMergeSha)
    check('storage preflight observed identity', trigger.storagePreflightObservedAt === storagePreflight.observedAt, trigger.storagePreflightObservedAt)
    check('storage preflight digest identity', trigger.storagePreflightEvidenceDigest === storagePreflight.evidence?.digest, trigger.storagePreflightEvidenceDigest)
    if (eventName === 'push') {
      const observedAt = parseDate(storagePreflight.observedAt)
      const maximumAgeMs = Number(executionContract.trigger.maximumPreflightAgeMinutesAtStart) * 60 * 1000
      const ageMs = observedAt ? now.getTime() - observedAt.getTime() : Number.NaN
      check('storage preflight valid observedAt', Boolean(observedAt), storagePreflight.observedAt)
      check('storage preflight not from future', Number.isFinite(ageMs) && ageMs >= -5 * 60 * 1000, ageMs)
      check('storage preflight fresh at start', Number.isFinite(ageMs) && ageMs <= maximumAgeMs, ageMs)
    }
  }

  const start = parseDate(trigger.startAt)
  const until = parseDate(trigger.until)
  const windowMs = start && until ? until.getTime() - start.getTime() : Number.NaN
  check('valid start', Boolean(start), trigger.startAt)
  check('valid until', Boolean(until), trigger.until)
  check('bounded window', Number.isFinite(windowMs) && windowMs >= MIN_WINDOW_MS && windowMs <= MAX_WINDOW_MS, windowMs)

  if (failures.length) return { ok: false, present: true, action: 'reject', failures }

  const nowMs = now.getTime()
  let phase = 'before_start'
  if (nowMs >= until.getTime()) phase = 'after_expiry'
  else if (nowMs >= start.getTime()) phase = 'active_window'

  let action = 'noop'
  if (eventName === 'push') {
    action = phase === 'after_expiry' ? 'reject' : 'start'
  } else if (eventName === 'schedule') {
    action = phase === 'before_start' ? 'noop' : phase === 'active_window' ? 'monitor' : 'finalize'
  }

  return {
    ok: action !== 'reject',
    present: true,
    action,
    phase,
    attempt: trigger.attempt,
    provider: 'twitch',
    startAt: start.toISOString(),
    until: until.toISOString(),
    observationHours: windowMs / (60 * 60 * 1000),
    packageMergeSha: trigger.packageMergeSha,
    executionPackageMergeSha: trigger.executionPackageMergeSha,
    storagePreflightPr: trigger.storagePreflightPr,
    storagePreflightMergeSha: trigger.storagePreflightMergeSha,
    storagePreflightObservedAt: trigger.storagePreflightObservedAt,
    storagePreflightEvidenceDigest: trigger.storagePreflightEvidenceDigest,
    failures: action === 'reject' ? [{ name: 'trigger expired before start event', actual: now.toISOString() }] : [],
  }
}

function loadStoragePreflight(executionContract) {
  const preflightPath = executionContract?.trigger?.storagePreflightContract
  if (!preflightPath || !fs.existsSync(preflightPath)) return null
  return JSON.parse(fs.readFileSync(preflightPath, 'utf8'))
}

function dormant(reason) {
  return {
    ok: true,
    present: false,
    action: 'noop',
    phase: 'dormant',
    reason,
    failures: [],
  }
}

function parseDate(value) {
  const parsed = new Date(String(value ?? ''))
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function writeOutputs(result) {
  const output = process.env.GITHUB_OUTPUT
  if (!output) return
  const values = {
    present: String(result.present === true),
    action: String(result.action ?? 'noop'),
    phase: String(result.phase ?? 'dormant'),
    attempt: String(result.attempt ?? ''),
    start_at: String(result.startAt ?? ''),
    until: String(result.until ?? ''),
  }
  fs.appendFileSync(output, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n')
}

async function main() {
  const args = process.argv.slice(2)
  const triggerPath = valueAfter(args, '--trigger') ?? 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
  const eventName = valueAfter(args, '--event') ?? process.env.GITHUB_EVENT_NAME ?? 'pull_request'
  const requireArmed = args.includes('--require-armed')
  const trigger = fs.existsSync(triggerPath) ? JSON.parse(fs.readFileSync(triggerPath, 'utf8')) : null
  const executionContract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json', 'utf8'))
  const packageContract = JSON.parse(fs.readFileSync('docs/audits/12a4-twitch-category-capture-canary-package-contract.json', 'utf8'))
  const result = inspectTwitchCanaryTrigger({ trigger, executionContract, packageContract, eventName })
  if (requireArmed && (!result.present || result.action === 'noop')) {
    result.ok = false
    result.failures = [...(result.failures ?? []), { name: 'armed trigger required', actual: result.action }]
  }
  writeOutputs(result)
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exit(1)
}

function valueAfter(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
