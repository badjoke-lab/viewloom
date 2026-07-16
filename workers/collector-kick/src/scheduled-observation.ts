type ScheduledObservationEnv = {
  DB_KICK_HOT: D1Database
}

type LatestSnapshot = {
  bucket_minute: string
  collected_at: string
  stream_count: number
  source_mode: string
}

export async function runKickScheduledObservation(
  event: ScheduledEvent,
  env: ScheduledObservationEnv,
  collect: () => Promise<void>,
): Promise<void> {
  const startedAt = new Date()
  const scheduledAt = Number.isFinite(event.scheduledTime)
    ? new Date(event.scheduledTime).toISOString()
    : null

  console.log(JSON.stringify({
    event: 'kick_scheduled_collection_started',
    provider: 'kick',
    scheduledAt,
    startedAt: startedAt.toISOString(),
  }))

  try {
    await collect()

    const completedAt = new Date()
    const latest = await latestSnapshot(env)
    const currentBucket = floorMinute(completedAt)
    const latestCollectedAtMs = latest ? Date.parse(latest.collected_at) : Number.NaN
    const collectorWroteSnapshot = Number.isFinite(latestCollectedAtMs)
      && latestCollectedAtMs >= startedAt.getTime()
    const currentBucketAlreadyObserved = latest?.bucket_minute === currentBucket
    let synthesizedEmptyObservation = false

    if (!collectorWroteSnapshot && !currentBucketAlreadyObserved) {
      await writeEmptyObservation(env, currentBucket, scheduledAt, latest)
      synthesizedEmptyObservation = true
    }

    console.log(JSON.stringify({
      event: 'kick_scheduled_collection_completed',
      provider: 'kick',
      scheduledAt,
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      bucketMinute: currentBucket,
      collectorWroteSnapshot,
      currentBucketAlreadyObserved,
      synthesizedEmptyObservation,
      latestSnapshotMinute: synthesizedEmptyObservation ? currentBucket : latest?.bucket_minute ?? null,
      streamCount: synthesizedEmptyObservation ? 0 : latest?.stream_count ?? 0,
      sourceMode: synthesizedEmptyObservation ? 'empty-scheduled-observation' : latest?.source_mode ?? null,
    }))
  } catch (error) {
    const failedAt = new Date()
    console.error(JSON.stringify({
      event: 'kick_scheduled_collection_failed',
      provider: 'kick',
      scheduledAt,
      failedAt: failedAt.toISOString(),
      durationMs: failedAt.getTime() - startedAt.getTime(),
      error: sanitizeError(error),
    }))
    throw error
  }
}

async function latestSnapshot(env: ScheduledObservationEnv): Promise<LatestSnapshot | null> {
  return await env.DB_KICK_HOT.prepare(`
    SELECT bucket_minute, collected_at, stream_count, source_mode
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 1
  `).bind('kick').first<LatestSnapshot>()
}

async function writeEmptyObservation(
  env: ScheduledObservationEnv,
  bucketMinute: string,
  scheduledAt: string | null,
  previous: LatestSnapshot | null,
): Promise<void> {
  const collectedAt = new Date().toISOString()
  const payload = {
    items: [],
    collectorMeta: {
      sourceMode: 'empty-scheduled-observation',
      reason: 'collector_completed_without_current_bucket_snapshot',
      scheduledAt,
      previousSnapshotMinute: previous?.bucket_minute ?? null,
      previousCollectedAt: previous?.collected_at ?? null,
      previousStreamCount: previous?.stream_count ?? null,
      previousSourceMode: previous?.source_mode ?? null,
    },
  }

  await env.DB_KICK_HOT.prepare(`
    INSERT OR REPLACE INTO minute_snapshots (
      provider,
      bucket_minute,
      collected_at,
      total_viewers,
      stream_count,
      payload_json,
      source_mode
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    'kick',
    bucketMinute,
    collectedAt,
    0,
    0,
    JSON.stringify(payload),
    'empty-scheduled-observation',
  ).run()
}

function floorMinute(date: Date): string {
  const copy = new Date(date)
  copy.setUTCSeconds(0, 0)
  return copy.toISOString()
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]')
    .slice(0, 240)
}
