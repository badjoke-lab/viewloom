import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  const absolute = resolve(root, path)
  if (!existsSync(absolute)) {
    failures.push(`${path}: required file is missing`)
    return ''
  }
  return readFileSync(absolute, 'utf8')
}

function need(path, source, fragment, label = fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing ${label}`)
}

function needPattern(path, source, pattern, label) {
  if (!pattern.test(source)) failures.push(`${path}: missing ${label}`)
}

function numberFrom(path, source, pattern, label) {
  const match = source.match(pattern)
  if (!match) {
    failures.push(`${path}: could not read ${label}`)
    return null
  }
  const value = Number(match[1])
  if (!Number.isFinite(value)) {
    failures.push(`${path}: invalid ${label}`)
    return null
  }
  return value
}

function providerBlock(path, source, provider) {
  const marker = `  ${provider}: {`
  const start = source.indexOf(marker)
  if (start < 0) {
    failures.push(`${path}: missing ${provider} runtime block`)
    return ''
  }
  const remainder = source.slice(start + marker.length)
  const end = remainder.indexOf('\n  },')
  if (end < 0) {
    failures.push(`${path}: unterminated ${provider} runtime block`)
    return ''
  }
  return remainder.slice(0, end)
}

function forbidAssignedValue(path, source, names) {
  const activeLines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  for (const name of names) {
    if (activeLines.some((line) => line.startsWith(`${name}=`) || line.startsWith(`${name} =`))) {
      failures.push(`${path}: ${name} must not be committed in wrangler.toml`)
    }
  }
}

const twitchWranglerPath = 'workers/collector-twitch/wrangler.toml'
const kickWranglerPath = 'workers/collector-kick/wrangler.toml'
const twitchWorkerPath = 'workers/collector-twitch/src/index-category.ts'
const kickWorkerPath = 'workers/collector-kick/src/index-category.ts'
const twitchIndexPath = 'workers/collector-twitch/src/index.ts'
const kickIndexPath = 'workers/collector-kick/src/index.ts'
const twitchEntryPath = 'workers/collector-twitch/src/entry.ts'
const kickEntryPath = 'workers/collector-kick/src/entry.ts'
const kickOfficialLivestreamsPath = 'workers/collector-kick/src/official-livestreams.ts'
const kickScheduledObservationPath = 'workers/collector-kick/src/scheduled-observation.ts'
const runtimePath = 'apps/web/functions/_provider-runtime.ts'

const twitchWrangler = read(twitchWranglerPath)
const kickWrangler = read(kickWranglerPath)
const twitchWorker = read(twitchWorkerPath)
const kickWorker = read(kickWorkerPath)
const twitchIndex = read(twitchIndexPath)
const kickIndex = read(kickIndexPath)
const twitchEntry = read(twitchEntryPath)
const kickEntry = read(kickEntryPath)
const kickOfficialLivestreams = read(kickOfficialLivestreamsPath)
const kickScheduledObservation = read(kickScheduledObservationPath)
const runtime = read(runtimePath)

need(twitchWranglerPath, twitchWrangler, 'crons = ["*/5 * * * *"]', '5-minute cron')
need(twitchWranglerPath, twitchWrangler, 'binding = "DB_TWITCH_HOT"', 'DB_TWITCH_HOT binding')
need(twitchWranglerPath, twitchWrangler, 'database_name = "vl_twitch_hot"', 'vl_twitch_hot database')
forbidAssignedValue(twitchWranglerPath, twitchWrangler, [
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_INGEST_TOKEN',
  'CATEGORY_CAPTURE_ENABLED',
])

need(kickWranglerPath, kickWrangler, 'crons = ["*/5 * * * *"]', '5-minute cron')
need(kickWranglerPath, kickWrangler, 'binding = "DB_KICK_HOT"', 'DB_KICK_HOT binding')
need(kickWranglerPath, kickWrangler, 'database_name = "vl_kick_hot"', 'vl_kick_hot database')
forbidAssignedValue(kickWranglerPath, kickWrangler, [
  'KICK_CLIENT_ID',
  'KICK_CLIENT_SECRET',
  'KICK_ACCESS_TOKEN',
  'KICK_INGEST_TOKEN',
  'CATEGORY_CAPTURE_ENABLED',
])

need(twitchIndexPath, twitchIndex, "export { default } from './index-category'", 'Twitch active collector delegation')
need(kickIndexPath, kickIndex, "export { default } from './index-category'", 'Kick active collector delegation')
need(twitchEntryPath, twitchEntry, "import collector from './index'", 'Twitch accepted entry delegation')
need(kickEntryPath, kickEntry, "import collector from './index'", 'Kick accepted entry delegation')
need(kickEntryPath, kickEntry, "import { runKickScheduledObservation } from './scheduled-observation'", 'Kick scheduled observation wrapper import')
need(kickEntryPath, kickEntry, 'await runKickScheduledObservation(event, env, () => collector.scheduled(event, env))', 'Kick scheduled observation wrapper call')
need(kickOfficialLivestreamsPath, kickOfficialLivestreams, 'raw.slug ?? raw.channel_slug ?? channel?.slug', 'nested official channel slug normalization')
need(kickOfficialLivestreamsPath, kickOfficialLivestreams, 'channel?.username ?? channel?.name', 'nested official channel display-name normalization')
need(kickScheduledObservationPath, kickScheduledObservation, "event: 'kick_scheduled_collection_started'", 'scheduled start log')
need(kickScheduledObservationPath, kickScheduledObservation, "event: 'kick_scheduled_collection_completed'", 'scheduled completion log')
need(kickScheduledObservationPath, kickScheduledObservation, "event: 'kick_scheduled_collection_failed'", 'scheduled failure log')
need(kickScheduledObservationPath, kickScheduledObservation, "'empty-scheduled-observation'", 'honest empty scheduled snapshot source')
need(kickScheduledObservationPath, kickScheduledObservation, 'collector_completed_without_current_bucket_snapshot', 'empty scheduled observation reason')
need(kickScheduledObservationPath, kickScheduledObservation, 'INSERT OR REPLACE INTO minute_snapshots', 'empty scheduled snapshot write')

const twitchPageSize = numberFrom(twitchWorkerPath, twitchWorker, /const PAGE_SIZE = (\d+)/, 'Twitch page size')
const twitchMaxPages = numberFrom(twitchWorkerPath, twitchWorker, /const MAX_PAGES = (\d+)/, 'Twitch maximum pages')
const twitchBucketMinutes = numberFrom(twitchWorkerPath, twitchWorker, /const TWITCH_BUCKET_MINUTES = (\d+)/, 'Twitch bucket minutes')
need(twitchWorkerPath, twitchWorker, "sourceMode: 'real'", 'explicit Twitch real source mode')
need(twitchWorkerPath, twitchWorker, "unixepoch('now', '-30 days')", '30-day Twitch raw retention')
need(twitchWorkerPath, twitchWorker, "unixepoch('now', '-180 days')", '180-day Twitch rollup retention')
need(twitchWorkerPath, twitchWorker, 'game_id?: string', 'accepted Twitch game id field')
need(twitchWorkerPath, twitchWorker, 'game_name?: string', 'accepted Twitch game name field')

const kickOfficialLimit = numberFrom(kickWorkerPath, kickWorker, /const OFFICIAL_LIVESTREAM_LIMIT = (\d+)/, 'Kick official livestream limit')
need(kickWorkerPath, kickWorker, "'official-livestreams'", 'official-livestreams source mode')
need(kickWorkerPath, kickWorker, "type TargetSource = 'seed-list' | 'registry'", 'Kick seed-list and registry target modes')
need(kickWorkerPath, kickWorker, "unixepoch('now', '-60 days')", '60-day Kick raw retention')
need(kickWorkerPath, kickWorker, "unixepoch('now', '-180 days')", '180-day Kick rollup retention')
need(kickWorkerPath, kickWorker, "collectorMeta.sourceMode === 'official-livestreams'", 'Kick primary category source gate')

const twitchRuntime = providerBlock(runtimePath, runtime, 'twitch')
const kickRuntime = providerBlock(runtimePath, runtime, 'kick')
needPattern(runtimePath, twitchRuntime, /collectionCadenceMinutes:\s*5\b/, 'Twitch 5-minute runtime cadence')
needPattern(runtimePath, twitchRuntime, /collectionCadenceSeconds:\s*300\b/, 'Twitch 300-second runtime cadence')
needPattern(runtimePath, twitchRuntime, /topLimit:\s*300\b/, 'Twitch Top 300 runtime limit')
needPattern(runtimePath, twitchRuntime, /rawRetentionDays:\s*30\b/, 'Twitch 30-day raw retention')
needPattern(runtimePath, twitchRuntime, /rollupRetentionDays:\s*180\b/, 'Twitch 180-day rollup retention')
needPattern(runtimePath, kickRuntime, /collectionCadenceMinutes:\s*5\b/, 'Kick 5-minute runtime cadence')
needPattern(runtimePath, kickRuntime, /collectionCadenceSeconds:\s*300\b/, 'Kick 300-second runtime cadence')
needPattern(runtimePath, kickRuntime, /topLimit:\s*100\b/, 'Kick Top 100 runtime limit')
needPattern(runtimePath, kickRuntime, /rawRetentionDays:\s*60\b/, 'Kick 60-day raw retention')
needPattern(runtimePath, kickRuntime, /rollupRetentionDays:\s*180\b/, 'Kick 180-day rollup retention')

if (twitchPageSize !== null && twitchMaxPages !== null && twitchPageSize * twitchMaxPages !== 300) {
  failures.push(`${twitchWorkerPath}: PAGE_SIZE × MAX_PAGES must equal the public Twitch Top 300 window`)
}
if (twitchBucketMinutes !== null && twitchBucketMinutes !== 5) {
  failures.push(`${twitchWorkerPath}: Twitch bucket size must remain 5 minutes`)
}
if (kickOfficialLimit !== null && kickOfficialLimit !== 100) {
  failures.push(`${kickWorkerPath}: Kick official livestream limit must match the public Top 100 window`)
}

if (failures.length > 0) {
  console.error('ViewLoom collector contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom collector contract verification passed.')
console.log('- Twitch: 5m cadence, Top 300, raw 30d, rollup 180d')
console.log('- Kick: 5m cadence, Top 100, raw 60d, rollup 180d')
console.log('- Kick scheduled collections log lifecycle events and persist honest empty observations')
console.log('- category-aware collectors are active behind index.ts while CATEGORY_CAPTURE_ENABLED is not committed')
console.log('- D1 bindings and secret placement contracts are intact')
