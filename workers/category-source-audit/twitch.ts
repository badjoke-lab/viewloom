import productionCollector from '../collector-twitch/src/entry'
import { categoryFieldInventory, isRecord, numberValue, text, type Raw } from './shared'

const AUDIT_TOKEN = '__CATEGORY_AUDIT_TOKEN__'
const AUDIT_PATH = '/__viewloom_category_source_audit__'

type Env = {
  DB_TWITCH_HOT: D1Database
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
  TWITCH_INGEST_TOKEN?: string
  INTRADAY_GENERATION_ENABLED?: string
}

type ProductionCollector = {
  fetch(request: Request, env: Env): Promise<Response>
  scheduled(event: ScheduledEvent, env: Env): Promise<void>
}

const production = productionCollector as ProductionCollector

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== AUDIT_PATH) return production.fetch(request, env)
    if (request.method !== 'POST' || request.headers.get('authorization') !== `Bearer ${AUDIT_TOKEN}`) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    try {
      const evidence = await auditTwitchCategorySource(env)
      return Response.json(evidence, { headers: { 'cache-control': 'no-store' } })
    } catch (error) {
      return Response.json({
        ok: false,
        provider: 'twitch',
        error: sanitizeError(error),
      }, { status: 500, headers: { 'cache-control': 'no-store' } })
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await production.scheduled(event, env)
  },
}

async function auditTwitchCategorySource(env: Env) {
  const accessToken = await getAppAccessToken(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET)
  const endpoint = new URL('https://api.twitch.tv/helix/streams')
  endpoint.searchParams.set('first', '100')

  const response = await fetch(endpoint.toString(), {
    headers: {
      'Client-Id': env.TWITCH_CLIENT_ID || '',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': 'ViewLoom/12A-4-category-source-audit',
    },
  })
  const body = await response.json() as Raw
  const rows = Array.isArray(body.data) ? body.data.filter(isRecord) : []
  const inventory = categoryFieldInventory(rows)

  let gameIdKeyPresent = 0
  let gameNameKeyPresent = 0
  let pairedNonEmpty = 0
  let missingBoth = 0
  const distinctPairs = new Set<string>()

  for (const row of rows) {
    const hasIdKey = Object.prototype.hasOwnProperty.call(row, 'game_id')
    const hasNameKey = Object.prototype.hasOwnProperty.call(row, 'game_name')
    if (hasIdKey) gameIdKeyPresent += 1
    if (hasNameKey) gameNameKeyPresent += 1
    const gameId = text(row.game_id)
    const gameName = text(row.game_name)
    if (gameId && gameName) {
      pairedNonEmpty += 1
      distinctPairs.add(`${gameId}\u0000${gameName}`)
    }
    if (!gameId && !gameName) missingBoth += 1
  }

  return {
    ok: response.ok && rows.length > 0,
    schemaVersion: 'viewloom-12a4-category-source-probe-v1',
    provider: 'twitch',
    observedAt: new Date().toISOString(),
    source: {
      endpoint: 'https://api.twitch.tv/helix/streams',
      sourceMode: 'helix-streams',
      requestedLimit: 100,
      httpStatus: response.status,
    },
    inventory,
    canonicalCandidate: {
      providerIdPath: 'game_id',
      namePath: 'game_name',
      rowCount: rows.length,
      providerIdKeyPresent: gameIdKeyPresent,
      nameKeyPresent: gameNameKeyPresent,
      pairedNonEmpty,
      missingBoth,
      distinctPairCount: distinctPairs.size,
      viewerRowsPositive: rows.filter((row) => numberValue(row.viewer_count) > 0).length,
    },
    privacy: {
      channelIdentitiesIncluded: false,
      streamTitlesIncluded: false,
      rawRowsIncluded: false,
      credentialsIncluded: false,
    },
    boundaries: {
      readOnlyUpstreamProbe: true,
      d1ReadPerformed: false,
      d1WritePerformed: false,
      collectorScheduledBehaviorDelegated: true,
      providerSeparated: true,
    },
  }
}

async function getAppAccessToken(clientId: string | undefined, clientSecret: string | undefined): Promise<string> {
  if (!clientId || !clientSecret) throw new Error('twitch_credentials_missing')
  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')
  const response = await fetch(url.toString(), { method: 'POST' })
  if (!response.ok) throw new Error(`twitch_token_http_${response.status}`)
  const data = await response.json() as Raw
  const token = text(data.access_token)
  if (!token) throw new Error('twitch_token_missing')
  return token
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 200)
}
