#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

const ORIGIN = process.env.VIEWLOOM_ORIGIN || 'https://vl.badjoke-lab.com'
const OUTPUT = resolve(process.argv[2] || 'artifacts/12a0-capacity-baseline/evidence.json')
const TIMING_SAMPLES = positiveInt(process.env.TIMING_SAMPLES, 5)
const REQUEST_TIMEOUT_MS = positiveInt(process.env.REQUEST_TIMEOUT_MS, 30_000)

const providers = ['twitch', 'kick']
const generatedAt = new Date().toISOString()
const today = generatedAt.slice(0, 10)

await mkdir(dirname(OUTPUT), { recursive: true })

const dataAudit = await getJson('/api/data-audit')
const statusByProvider = Object.fromEntries(await Promise.all(
  providers.map(async (provider) => [provider, await getJson(`/api/${provider}-status`)]),
))

const historyWindows = historyWindowPairs(today)
const historyEvidence = {}
for (const provider of providers) {
  const windows = []
  for (const window of historyWindows) {
    const query = new URLSearchParams({ from: window.from, to: window.to, metric: 'viewer_minutes' })
    const payload = await getJson(`/api/${provider === 'twitch' ? 'history' : 'kick-history'}?${query}`)
    const readPath = readPathFromNotes(payload.notes)
    windows.push({
      ...window,
      requestedDays: inclusiveDayCount(window.from, window.to),
      responseDays: Array.isArray(payload.daily) ? payload.daily.length : 0,
      observedDays: Array.isArray(payload.daily)
        ? payload.daily.filter((day) => day?.coverageState !== 'missing').length
        : 0,
      readPath,
      state: payload.state ?? null,
      coverageState: payload.coverage?.state ?? null,
    })
  }
  historyEvidence[provider] = {
    windows,
    observedRollupDays: windows
      .filter((window) => window.readPath === 'daily_rollups')
      .reduce((sum, window) => sum + window.observedDays, 0),
    allWindowsUseDailyRollups: windows.every((window) => window.readPath === 'daily_rollups'),
  }
}

const timingTargets = [
  ['data_audit', '/api/data-audit'],
  ['twitch_status', '/api/twitch-status'],
  ['kick_status', '/api/kick-status'],
  ['twitch_history_30d', `/api/history?${lastNDaysQuery(today, 30)}`],
  ['kick_history_30d', `/api/kick-history?${lastNDaysQuery(today, 30)}`],
  ['twitch_day_flow', '/api/day-flow'],
  ['kick_day_flow', '/api/kick-day-flow'],
  ['twitch_battle_lines', '/api/battle-lines'],
  ['kick_battle_lines', '/api/kick-battle-lines'],
]

const queryTimings = {}
for (const [key, path] of timingTargets) {
  const samples = []
  for (let index = 0; index < TIMING_SAMPLES; index += 1) {
    samples.push(await timedGet(path))
  }
  queryTimings[key] = summarizeTimings(path, samples)
}

const auditRows = new Map((Array.isArray(dataAudit.providers) ? dataAudit.providers : []).map((row) => [row.provider, row]))
const providerEvidence = {}
for (const provider of providers) {
  const audit = auditRows.get(provider) ?? {}
  const status = statusByProvider[provider] ?? {}
  providerEvidence[provider] = {
    storage: {
      binding: status.storage?.binding ?? null,
      database: status.storage?.database ?? null,
      rawRows: numberOrNull(audit.rows),
      rows24h: numberOrNull(audit.rows24h),
      expectedRows24h: numberOrNull(audit.expectedRows24h),
      averagePayloadBytes: numberOrNull(audit.avgPayloadBytes),
      maximumPayloadBytes: numberOrNull(audit.maxPayloadBytes),
      retainedPayloadMb: numberOrNull(audit.payloadMb),
      estimatedPayloadMbPerDay: numberOrNull(audit.estimatedPayloadMbPerDay),
      estimatedPayloadMbAtRetention: numberOrNull(audit.estimatedPayloadMbAtRetention),
      rawRetentionDays: numberOrNull(audit.rawRetentionDays),
      rollupRetentionDays: numberOrNull(audit.rollupRetentionDays),
      oldestRawBucket: audit.oldest ?? null,
      latestRawBucket: audit.latest ?? null,
      dailyRollupObservedDays: historyEvidence[provider].observedRollupDays,
      dailyRollupReadPathVerified: historyEvidence[provider].allWindowsUseDailyRollups,
    },
    collection: collectionEvidence(provider, status, audit),
    history: historyEvidence[provider],
  }
}

const evidence = {
  schemaVersion: 'viewloom-12a0-capacity-baseline-v1',
  workstream: '12A-0 current data and capacity baseline',
  generatedAt,
  origin: ORIGIN,
  evidenceMode: 'read-only-production-observation',
  providerSeparated: true,
  runtimeChanged: false,
  providers: providerEvidence,
  queryTimings: {
    sampleCountPerTarget: TIMING_SAMPLES,
    timeoutMs: REQUEST_TIMEOUT_MS,
    targets: queryTimings,
  },
  schedules: {
    cadence: {
      twitch: { minutes: 5, source: 'workers/collector-twitch/wrangler.toml' },
      kick: { minutes: 5, source: 'workers/collector-kick/wrangler.toml' },
    },
    dailyRollupRefresh: {
      twitch: { utcWindows: ['00:20-00:24', '12:20-12:24'], source: 'workers/collector-twitch/src/index.ts' },
      kick: { utcWindows: ['00:20-00:24', '12:20-12:24'], source: 'workers/collector-kick/src/index.ts' },
    },
    retentionCleanup: {
      twitch: { utcWindow: '00:30-00:34', rawDays: 30, dailyRollupDays: 180, source: 'workers/collector-twitch/src/index.ts' },
      kick: { utcWindow: '00:30-00:34', rawDays: 60, dailyRollupDays: 180, source: 'workers/collector-kick/src/index.ts' },
    },
  },
  fieldMatrix: currentFieldMatrix(),
  upstreamDiscardAudit: upstreamDiscardAudit(),
  collectorDuration: collectorDurationEvidence(statusByProvider),
  budgets: buildBudgets(providerEvidence, queryTimings),
  limitations: [
    'Collector wall-clock duration is not persisted by the current production data model. The recorded bucket completion offset is a proxy that includes dispatch delay, collection, and write time.',
    'Daily-rollup counts are observed through provider-specific History responses only when the response reports read_path=daily_rollups; missing calendar days are excluded from observedRollupDays.',
    'Query timings are end-to-end production HTTP timings from GitHub Actions and include network latency in addition to server and D1 work.',
    'Twitch and Kick observations are bounded provider-specific windows and are not complete provider-wide coverage claims.',
  ],
}

await writeFile(OUTPUT, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`12A-0 capacity baseline evidence written to ${OUTPUT}`)
console.log(`origin=${ORIGIN}`)
console.log(`generatedAt=${generatedAt}`)
for (const provider of providers) {
  const row = providerEvidence[provider]
  console.log(`${provider}: rawRows=${row.storage.rawRows} rows24h=${row.storage.rows24h} payloadMb=${row.storage.retainedPayloadMb} rollupObservedDays=${row.storage.dailyRollupObservedDays}`)
}

async function getJson(path) {
  const result = await fetchWithTiming(path)
  if (result.status !== 200) throw new Error(`${path}: expected HTTP 200, got ${result.status}`)
  try {
    return JSON.parse(result.body)
  } catch (error) {
    throw new Error(`${path}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function timedGet(path) {
  const result = await fetchWithTiming(path)
  return {
    durationMs: round(result.durationMs, 2),
    status: result.status,
    bytes: Buffer.byteLength(result.body),
  }
}

async function fetchWithTiming(path) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const url = new URL(path, ORIGIN).toString()
  const started = performance.now()
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'ViewLoom 12A-0 capacity baseline evidence collector' },
      signal: controller.signal,
    })
    const body = await response.text()
    return { status: response.status, body, durationMs: performance.now() - started }
  } finally {
    clearTimeout(timeout)
  }
}

function summarizeTimings(path, samples) {
  const durations = samples.map((sample) => sample.durationMs).sort((a, b) => a - b)
  const statuses = [...new Set(samples.map((sample) => sample.status))]
  const bytes = samples.map((sample) => sample.bytes)
  return {
    path,
    samples,
    statusCodes: statuses,
    durationMs: {
      min: round(durations[0] ?? 0, 2),
      median: round(median(durations), 2),
      max: round(durations.at(-1) ?? 0, 2),
    },
    responseBytes: {
      min: Math.min(...bytes),
      max: Math.max(...bytes),
    },
  }
}

function collectionEvidence(provider, status, audit) {
  const latest = status.latestSnapshot ?? {}
  const collector = status.collector ?? {}
  const coverage = status.coverage ?? {}
  const rows24h = numberOrNull(audit.rows24h)
  const expectedRows24h = numberOrNull(audit.expectedRows24h)
  return {
    sourceMode: status.sourceMode ?? null,
    state: status.state ?? null,
    coverageMode: provider === 'kick' ? status.coverageMode ?? null : 'top-window',
    targetSource: provider === 'kick' ? status.targetSource ?? null : 'helix-streams-pages',
    collectorState: collector.state ?? null,
    runCadenceSeconds: numberOrNull(collector.runCadenceSeconds),
    latestBucketMinute: latest.bucketMinute ?? null,
    latestCollectedAt: latest.collectedAt ?? collector.lastSuccessAt ?? null,
    observedCount: numberOrNull(latest.observedCount ?? latest.streamCount),
    topLimit: numberOrNull(latest.topLimit),
    coveredPages: numberOrNull(latest.coveredPages),
    hasMore: typeof latest.hasMore === 'boolean' ? latest.hasMore : null,
    coverageState: coverage.state ?? null,
    rows24h,
    expectedRows24h,
    cadenceRatio: rows24h != null && expectedRows24h ? round(rows24h / expectedRows24h, 4) : null,
    cadenceExact: rows24h != null && expectedRows24h != null ? rows24h === expectedRows24h : null,
    sourceModes: provider === 'kick' && Array.isArray(status.sourceModes) ? status.sourceModes : undefined,
  }
}

function collectorDurationEvidence(statusByProvider) {
  const result = {}
  for (const provider of providers) {
    const status = statusByProvider[provider] ?? {}
    const bucket = status.latestSnapshot?.bucketMinute ?? null
    const completed = status.latestSnapshot?.collectedAt ?? status.collector?.lastSuccessAt ?? status.freshness?.lastSuccessAt ?? null
    result[provider] = {
      measurementStatus: 'not_persisted',
      proxyMetric: 'bucket_completion_offset_seconds',
      proxySeconds: secondsBetween(bucket, completed),
      bucketMinute: bucket,
      completionTimestamp: completed,
      interpretation: 'Upper-bound-style operational proxy only; includes cron dispatch delay plus collection and write time, not pure collector execution duration.',
      followUpOwner: '12A-3 bounded intraday rollup generation',
    }
  }
  return result
}

function buildBudgets(providerEvidence, timings) {
  const storage = {}
  for (const provider of providers) {
    const row = providerEvidence[provider].storage
    storage[provider] = {
      currentRetainedPayloadMb: row.retainedPayloadMb,
      estimatedPayloadMbPerDay: row.estimatedPayloadMbPerDay,
      acceptedRawRetentionDays: row.rawRetentionDays,
      estimatedPayloadMbAtAcceptedRetention: row.estimatedPayloadMbAtRetention,
      migrationRule: '12A-2 must estimate compact-rollup rows/day and bytes/day against this provider-specific baseline before migration.',
    }
  }
  const query = Object.fromEntries(Object.entries(timings).map(([key, value]) => [key, {
    medianMs: value.durationMs.median,
    maxMs: value.durationMs.max,
    baselineOnly: true,
  }]))
  return {
    storage,
    query,
    decisionBoundary: 'No 12A-2 migration is authorized by this evidence alone; its row/byte/query delta must be compared against these baselines.',
  }
}

function currentFieldMatrix() {
  return [
    { fact: 'provider_channel_id', twitch: 'stored', kick: 'stored', longTermRollup: 'top_30_only' },
    { fact: 'display_name', twitch: 'stored', kick: 'stored', longTermRollup: 'top_30_only' },
    { fact: 'viewer_count_at_snapshot', twitch: 'stored', kick: 'stored', longTermRollup: 'aggregated' },
    { fact: 'snapshot_time', twitch: 'stored', kick: 'stored', longTermRollup: 'day_only' },
    { fact: 'stream_title', twitch: 'not_stored', kick: 'stored', longTermRollup: 'not_stored' },
    { fact: 'category_game', twitch: 'not_stored', kick: 'not_stored_as_category', longTermRollup: 'not_stored' },
    { fact: 'language', twitch: 'not_stored', kick: 'not_stored', longTermRollup: 'not_stored' },
    { fact: 'upstream_start_time', twitch: 'fetched_used_then_discarded', kick: 'not_retained', longTermRollup: 'not_stored' },
    { fact: 'session_id', twitch: 'not_stored', kick: 'not_stored', longTermRollup: 'not_stored' },
    { fact: 'exact_stream_end', twitch: 'unavailable', kick: 'unavailable', longTermRollup: 'unavailable' },
    { fact: 'authoritative_offline_state', twitch: 'unavailable', kick: 'unavailable', longTermRollup: 'unavailable' },
    { fact: 'daily_viewer_minutes', twitch: 'derived', kick: 'derived', longTermRollup: 'stored' },
    { fact: 'daily_peak', twitch: 'derived', kick: 'derived', longTermRollup: 'stored' },
    { fact: 'daily_observed_minutes', twitch: 'derived', kick: 'derived', longTermRollup: 'stored' },
    { fact: 'current_momentum', twitch: 'stored_in_raw_payload', kick: 'derived_by_consumer', longTermRollup: 'not_stored' },
    { fact: 'activity_chat_heat', twitch: 'activity_proxy_only', kick: 'unavailable', longTermRollup: 'unavailable' },
    { fact: 'latest_observed_membership', twitch: 'available', kick: 'available', longTermRollup: 'not_stored' },
  ]
}

function upstreamDiscardAudit() {
  return {
    twitch: [
      {
        field: 'started_at',
        upstreamEndpoint: 'https://api.twitch.tv/helix/streams',
        fetched: true,
        retained: false,
        currentUse: 'derives activity from stream age before payload write',
        evidenceStrength: 'code-path verified',
      },
    ],
    kick: [
      {
        field: 'category',
        fetchedWhenPresent: true,
        retainedAsCategory: false,
        currentUse: 'official channel normalization may use category.name only as a title fallback',
        evidenceStrength: 'code-path verified',
      },
    ],
    explicitlyNotClassedAsFetchedThenDiscarded: {
      twitch: ['stream title', 'game/category id', 'game/category name', 'language', 'session id'],
      kick: ['language', 'session id', 'upstream start time'],
    },
  }
}

function historyWindowPairs(toDay) {
  const end = new Date(`${toDay}T00:00:00.000Z`)
  const secondFrom = shiftDay(end, -89)
  const firstTo = shiftDay(secondFrom, -1)
  const firstFrom = shiftDay(firstTo, -89)
  return [
    { from: isoDay(firstFrom), to: isoDay(firstTo) },
    { from: isoDay(secondFrom), to: isoDay(end) },
  ]
}

function lastNDaysQuery(toDay, days) {
  const to = new Date(`${toDay}T00:00:00.000Z`)
  const from = shiftDay(to, -(days - 1))
  return new URLSearchParams({ from: isoDay(from), to: isoDay(to), metric: 'viewer_minutes' }).toString()
}

function readPathFromNotes(notes) {
  if (!Array.isArray(notes)) return null
  for (const note of notes) {
    const match = String(note).match(/read_path=([A-Za-z0-9_-]+)/)
    if (match) return match[1]
  }
  return null
}

function secondsBetween(from, to) {
  if (!from || !to) return null
  const delta = (Date.parse(to) - Date.parse(from)) / 1000
  return Number.isFinite(delta) && delta >= 0 ? round(delta, 3) : null
}

function inclusiveDayCount(from, to) {
  return Math.floor((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86_400_000) + 1
}

function shiftDay(date, delta) {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + delta)
  return copy
}

function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

function median(values) {
  if (!values.length) return 0
  const middle = Math.floor(values.length / 2)
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2
}

function numberOrNull(value) {
  const number = Number(value)
  return value !== null && value !== undefined && Number.isFinite(number) ? number : null
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function positiveInt(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}
