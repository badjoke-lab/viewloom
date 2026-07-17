import collector from './entry'

type Env = {
  DB_TWITCH_HOT: D1Database
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
  TWITCH_INGEST_TOKEN?: string
  INTRADAY_GENERATION_ENABLED?: string
  CATEGORY_CAPTURE_ENABLED?: string
  CATEGORY_CAPTURE_CANARY_ENABLED?: string
  CATEGORY_CAPTURE_CANARY_PROVIDER?: string
  CATEGORY_CAPTURE_CANARY_STARTED_AT?: string
  CATEGORY_CAPTURE_CANARY_UNTIL?: string
  CATEGORY_CAPTURE_CANARY_ATTEMPT?: string
}

export type TwitchCategoryCanaryMode =
  | 'disabled'
  | 'invalid_provider'
  | 'invalid_attempt'
  | 'invalid_window'
  | 'pending'
  | 'active'
  | 'expired'

export type TwitchCategoryCanaryState = {
  provider: 'twitch'
  mode: TwitchCategoryCanaryMode
  active: boolean
  requested: boolean
  attempt: number | null
  startedAt: string | null
  expiresAt: string | null
  observationHours: number | null
  categoryCaptureEnabled: boolean
  automaticPermanentEnablement: false
}

const MIN_CANARY_WINDOW_MS = 23 * 60 * 60 * 1000
const MAX_CANARY_WINDOW_MS = 25 * 60 * 60 * 1000

export function resolveTwitchCategoryCaptureCanary(
  env: Pick<Env,
    | 'CATEGORY_CAPTURE_CANARY_ENABLED'
    | 'CATEGORY_CAPTURE_CANARY_PROVIDER'
    | 'CATEGORY_CAPTURE_CANARY_STARTED_AT'
    | 'CATEGORY_CAPTURE_CANARY_UNTIL'
    | 'CATEGORY_CAPTURE_CANARY_ATTEMPT'>,
  now = new Date(),
): TwitchCategoryCanaryState {
  const requested = env.CATEGORY_CAPTURE_CANARY_ENABLED?.trim().toLowerCase() === 'true'
  const provider = env.CATEGORY_CAPTURE_CANARY_PROVIDER?.trim().toLowerCase()
  const attempt = parsePositiveInteger(env.CATEGORY_CAPTURE_CANARY_ATTEMPT)
  const started = parseDate(env.CATEGORY_CAPTURE_CANARY_STARTED_AT)
  const expires = parseDate(env.CATEGORY_CAPTURE_CANARY_UNTIL)
  const observationMs = started && expires ? expires.getTime() - started.getTime() : null
  const base = {
    provider: 'twitch' as const,
    requested,
    attempt,
    startedAt: started?.toISOString() ?? null,
    expiresAt: expires?.toISOString() ?? null,
    observationHours: observationMs === null ? null : observationMs / (60 * 60 * 1000),
    automaticPermanentEnablement: false as const,
  }

  if (!requested) return { ...base, mode: 'disabled', active: false, categoryCaptureEnabled: false }
  if (provider !== 'twitch') return { ...base, mode: 'invalid_provider', active: false, categoryCaptureEnabled: false }
  if (attempt === null) return { ...base, mode: 'invalid_attempt', active: false, categoryCaptureEnabled: false }
  if (!started || !expires || observationMs === null || observationMs < MIN_CANARY_WINDOW_MS || observationMs > MAX_CANARY_WINDOW_MS) {
    return { ...base, mode: 'invalid_window', active: false, categoryCaptureEnabled: false }
  }
  if (now.getTime() < started.getTime()) return { ...base, mode: 'pending', active: false, categoryCaptureEnabled: false }
  if (now.getTime() >= expires.getTime()) return { ...base, mode: 'expired', active: false, categoryCaptureEnabled: false }
  return { ...base, mode: 'active', active: true, categoryCaptureEnabled: true }
}

function canaryEnv(env: Env, state: TwitchCategoryCanaryState): Env {
  return {
    ...env,
    CATEGORY_CAPTURE_ENABLED: state.active ? 'true' : 'false',
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const state = resolveTwitchCategoryCaptureCanary(env)
    const url = new URL(request.url)
    if (url.pathname === '/category-canary-status') {
      return Response.json({ ok: true, ...state }, { headers: { 'cache-control': 'no-store' } })
    }
    return collector.fetch(request, canaryEnv(env, state))
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const state = resolveTwitchCategoryCaptureCanary(env)
    console.log(JSON.stringify({ event: 'twitch_category_capture_canary_state', ...state }))
    await collector.scheduled(event, canaryEnv(env, state))
  },
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed : null
}

function parsePositiveInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}
