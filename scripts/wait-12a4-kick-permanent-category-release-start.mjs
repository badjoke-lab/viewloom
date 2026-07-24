import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_MAX_WAIT_MS = 3 * 60 * 60 * 1000

export function evaluateReleaseStartWait(trigger, now = new Date(), maxWaitMs = DEFAULT_MAX_WAIT_MS) {
  const start = parseDate(trigger?.startAt)
  if (!start) return rejected('invalid_start_at', trigger?.startAt, maxWaitMs)
  const nowMs = now.getTime()
  if (!Number.isFinite(nowMs)) return rejected('invalid_now', now, maxWaitMs)
  const waitMs = Math.max(0, start.getTime() - nowMs)
  if (waitMs > maxWaitMs) return rejected('start_wait_exceeds_limit', waitMs, maxWaitMs)
  if (nowMs >= start.getTime() + maxWaitMs) return rejected('release_start_too_stale', now.toISOString(), maxWaitMs)
  return {
    ok: true,
    waitMs,
    startAt: start.toISOString(),
    reached: waitMs === 0,
    maximumWaitMs: maxWaitMs,
    failure: null,
  }
}

async function main() {
  const triggerPath = 'docs/audits/12a4-kick-permanent-category-release-trigger.json'
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  const state = evaluateReleaseStartWait(trigger)
  console.log(JSON.stringify(state, null, 2))
  if (!state.ok) process.exit(1)
  let remaining = state.waitMs
  while (remaining > 0) {
    const interval = Math.min(remaining, 60_000)
    await sleep(interval)
    remaining -= interval
  }
  const reachedAt = new Date()
  if (reachedAt.getTime() >= Date.parse(trigger.startAt) + DEFAULT_MAX_WAIT_MS) {
    throw new Error('release_start_became_stale_while_waiting')
  }
  console.log(JSON.stringify({
    ok: true,
    startBoundaryReached: true,
    startAt: trigger.startAt,
    reachedAt: reachedAt.toISOString(),
  }, null, 2))
}

function rejected(name, actual, maximumWaitMs) {
  return {
    ok: false,
    waitMs: null,
    startAt: null,
    reached: false,
    maximumWaitMs,
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