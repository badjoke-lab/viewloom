const HEALTH_PATH = '/health'
const QUEUE_PATH = '/audit/kick-map-stable-id-review-queue'
const LIVESTREAM_LIMIT = 100
const CHANNEL_BATCH_SIZE = 50
const CHANNEL_REQUEST_MAX = 2

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === HEALTH_PATH) {
      if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405)
      return json({
        ok: true,
        mode: 'kick_stream_map_stable_id_review_queue_preview',
        productionDeployment: false,
        productionCollectorChange: false,
        d1Writes: 0,
        maxTokenRequests: 1,
        maxLivestreamRequests: 1,
        channelBatchSize: CHANNEL_BATCH_SIZE,
        maxChannelRequests: CHANNEL_REQUEST_MAX,
        credentialPresence: {
          kickClientId: Boolean(clean(env.KICK_CLIENT_ID)),
          kickClientSecret: Boolean(clean(env.KICK_CLIENT_SECRET)),
        },
      })
    }

    if (url.pathname !== QUEUE_PATH) return json({ ok: false, error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

    try {
      return json({ ok: true, result: await buildQueue(env) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      return json({ ok: false, error: safeError(message), errorClass: classifyError(message) }, 502)
    }
  },
}

async function buildQueue(env) {
  const clientId = clean(env.KICK_CLIENT_ID)
  const clientSecret = clean(env.KICK_CLIENT_SECRET)
  if (!clientId || !clientSecret) throw new Error('missing_kick_credentials')

  const token = await fetchAppToken(clientId, clientSecret)
  const requestCounts = { token: 1, livestreamsV2: 1, channelsV1: 0, legacyPublicFallback: 0 }

  const liveUrl = new URL('https://api.kick.com/public/v2/livestreams')
  liveUrl.searchParams.set('limit', String(LIVESTREAM_LIMIT))
  const liveResponse = await fetchJson(liveUrl, token)
  if (!liveResponse.ok) throw new Error(`kick_livestreams_v2_http_${liveResponse.status}`)

  const liveRows = extractRows(liveResponse.data).slice(0, LIVESTREAM_LIMIT)
  const population = liveRows.map((row, index) => ({
    rank: index + 1,
    slug: extractSlug(row),
    viewer_count: viewerCount(row?.viewer_count),
  })).filter((row) => row.slug)

  const uniqueSlugs = unique(population.map((row) => row.slug))
  const channelRows = []
  for (let index = 0; index < uniqueSlugs.length; index += CHANNEL_BATCH_SIZE) {
    if (requestCounts.channelsV1 >= CHANNEL_REQUEST_MAX) throw new Error('channel_request_budget_exceeded')
    const batch = uniqueSlugs.slice(index, index + CHANNEL_BATCH_SIZE)
    const channelUrl = new URL('https://api.kick.com/public/v1/channels')
    for (const slug of batch) channelUrl.searchParams.append('slug', slug)
    requestCounts.channelsV1 += 1
    const response = await fetchJson(channelUrl, token)
    if (!response.ok) throw new Error(`kick_channels_v1_http_${response.status}`)
    channelRows.push(...extractRows(response.data))
  }

  const identities = identitiesBySlug(channelRows)
  const observedAt = new Date().toISOString()
  const queue = population.map((stream) => {
    const ids = identities.get(stream.slug) ?? new Set()
    const stableId = ids.size === 1 ? [...ids][0] : null
    return {
      rank: stream.rank,
      slug: stream.slug,
      viewer_count: stream.viewer_count,
      broadcaster_user_id: stableId,
      identity_state: stableId ? 'ready' : ids.size > 1 ? 'ambiguous' : 'missing',
      observed_at: observedAt,
    }
  })

  const ready = queue.filter((row) => row.identity_state === 'ready').length
  const missing = queue.filter((row) => row.identity_state === 'missing').length
  const ambiguous = queue.filter((row) => row.identity_state === 'ambiguous').length

  return {
    schemaVersion: 'viewloom-kick-stream-map-stable-id-review-queue-v0.1',
    provider: 'kick',
    mode: 'read_only_preview',
    observedAt,
    population: {
      livestreamRows: liveRows.length,
      queueRows: queue.length,
      uniqueSlugs: uniqueSlugs.length,
    },
    identityCoverage: {
      ready,
      missing,
      ambiguous,
      readyPercent: queue.length > 0 ? Number((ready / queue.length).toFixed(6)) : 0,
    },
    requestCounts,
    queue,
    retention: {
      rawTitleStored: false,
      rawTagsStored: false,
      rawProfileDescriptionStored: false,
      geographyStored: false,
    },
    mutation: {
      productionDeployment: false,
      productionCollectorChange: false,
      d1Writes: 0,
      d1SchemaChange: false,
      collectorCadenceChange: false,
      automaticGeographyAcceptance: false,
      twitchEvidenceCopied: false,
    },
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      slugIsStableIdentity: false,
      ambiguousIdentityFailsClosed: true,
      missingIdentityFailsClosed: true,
    },
  }
}

function identitiesBySlug(rows) {
  const result = new Map()
  for (const row of rows) {
    const slug = extractSlug(row)
    const id = identifier(row?.broadcaster_user_id)
    if (!slug || !id) continue
    const ids = result.get(slug) ?? new Set()
    ids.add(id)
    result.set(slug, ids)
  }
  return result
}

async function fetchAppToken(clientId, clientSecret) {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  })
  const raw = await response.text()
  if (!response.ok) throw new Error(`kick_token_http_${response.status}`)
  let parsed = null
  try { parsed = JSON.parse(raw) } catch { parsed = null }
  const token = clean(parsed?.access_token)
  if (!token) throw new Error('missing_kick_access_token')
  return token
}

async function fetchJson(url, token) {
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'user-agent': 'ViewLoom kick-stream-map-stable-id-review-queue/0.1',
    },
  })
  const raw = await response.text()
  let data = null
  try { data = JSON.parse(raw) } catch { data = null }
  return { ok: response.ok, status: response.status, data }
}

function extractRows(data) {
  if (Array.isArray(data)) return data.filter(isRecord)
  if (Array.isArray(data?.data)) return data.data.filter(isRecord)
  if (isRecord(data?.data)) return [data.data]
  if (isRecord(data)) return [data]
  return []
}

function extractSlug(row) {
  return clean(row?.slug ?? row?.channel_slug ?? row?.channel?.slug ?? row?.broadcaster?.slug).toLowerCase()
}

function viewerCount(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function identifier(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return clean(value)
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function unique(values) {
  return [...new Set(values)]
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function classifyError(message) {
  if (message === 'missing_kick_credentials') return 'credentials_missing'
  if (message === 'missing_kick_access_token' || message.startsWith('kick_token_http_')) return 'oauth_failure'
  if (message.startsWith('kick_livestreams_v2_http_')) return 'livestreams_v2_failure'
  if (message.startsWith('kick_channels_v1_http_')) return 'channels_v1_failure'
  if (message === 'channel_request_budget_exceeded') return 'request_budget_failure'
  return 'unexpected_failure'
}

function safeError(message) {
  return String(message).replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 180)
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
