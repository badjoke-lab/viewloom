import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_MAX_WAIT_MS = 3 * 60 * 60 * 1000

export function evaluateStartWait(trigger, now = new Date(), maxWaitMs = DEFAULT_MAX_WAIT_MS) {
  const start = parseDate(trigger?.startAt)
  const until = parseDate(trigger?.until)
  if (!start) return rejected('invalid_start_at', trigger?.startAt)
  if (!until) return rejected('invalid_until', trigger?.until)
  if (until.getTime() <= start.getTime()) return rejected('invalid_window', until.getTime() - start.getTime())

  const nowMs = now.getTime()
  if (!Number.isFinite(nowMs)) return rejected('invalid_now', now)
  if (nowMs >= until.getTime()) return rejected('trigger_expired_before_wait', now.toISOString())

  const waitMs = Math.max(0, start.getTime() - nowMs)
  if (waitMs > maxWaitMs) return rejected('start_wait_exceeds_limit', waitMs)

  return {
    ok: true,
    waitMs,
    startAt: start.toISOString(),
    until: until.toISOString(),
    reached: waitMs === 0,
    maximumWaitMs: maxWaitMs,
    failure: null,
  }
}

async function main() {
  const triggerPath = process.env.TRIGGER_PATH
    ?? 'docs/audits/12a4-twitch-category-capture-canary-trigger.json'
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  const state = evaluateStartWait(trigger)
  console.log(JSON.stringify(state, null, 2))
  if (!state.ok) process.exit(1)

  let remaining = state.waitMs
  while (remaining > 0) {
    const interval = Math.min(remaining, 60_000)
    await sleep(interval)
    remaining -= interval
  }

  const reachedAt = new Date()
  if (reachedAt.getTime() >= Date.parse(trigger.until)) {
    throw new Error('trigger_expired_while_waiting')
  }
  console.log(JSON.stringify({
    ok: true,
    startBoundaryReached: true,
    startAt: trigger.startAt,
    reachedAt: reachedAt.toISOString(),
    remainingUntilExpiryMs: Date.parse(trigger.until) - reachedAt.getTime(),
  }, null, 2))
}

function rejected(name, actual) {
  return {
    ok: false,
    waitMs: null,
    startAt: null,
    until: null,
    reached: false,
    maximumWaitMs: DEFAULT_MAX_WAIT_MS,
    failure: { name, actual },
  }
}

function parseDate(value) {
  const parsed = new Date(String(value ?? ''))
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error))
    process.exit(1)
  })
}
