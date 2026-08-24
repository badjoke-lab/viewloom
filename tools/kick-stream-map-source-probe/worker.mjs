const HEALTH_PATH = '/health'
const PROBE_PATH = '/audit/kick-map-source-probe'
const LIVESTREAM_LIMIT = 100
const CHANNEL_LOOKUP_MAX = 10

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === HEALTH_PATH) {
      if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405)
      return json({
        ok: true,
        mode: 'kick_stream_map_source_probe_preview',
        productionDeployment: false,
        d1Writes: 0,
        maxLivestreamRequests: 1,
        maxChannelRequests: CHANNEL_LOOKUP_MAX,
        legacyPublicFallbackRequests: 0,
        credentialPresence: {
          kickClientId: Boolean(String(env.KICK_CLIENT_ID ?? '').trim()),
          kickClientSecret: Boolean(String(env.KICK_CLIENT_SECRET ?? '').trim()),
        },
      })
    }

    if (url.pathname !== PROBE_PATH) return json({ ok: false, error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

    try {
      return json({ ok: true, result: await runProbe(env) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      return json({ ok: false, error: safeError(message), errorClass: classifyError(message) }, 502)
    }
  },
}

async function runProbe(env) {
  const clientId = String(env.KICK_CLIENT_ID ?? '').trim()
  const clientSecret = String(env.KICK_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('missing_kick_credentials')

  const token = await fetchAppToken(clientId, clientSecret)
  const requestCounts = { token: 1, livestreamsV2: 0, channelsV1: 0, legacyPublicFallback: 0 }
  const responseBytes = { token: 0, livestreamsV2: 0, channelsV1Total: 0 }

  requestCounts.livestreamsV2 += 1
  const livestreamUrl = new URL('https://api.kick.com/public/v2/livestreams')
  livestreamUrl.searchParams.set('limit', String(LIVESTREAM_LIMIT))
  const liveResponse = await fetchJson(livestreamUrl, token)
  responseBytes.livestreamsV2 = liveResponse.bytes
  if (!liveResponse.ok) throw new Error(`kick_livestreams_v2_http_${liveResponse.status}`)

  const liveRows = extractRows(liveResponse.data)
  const liveSummary = summarizeLivestreamRows(liveRows)
  const slugs = unique(liveRows.map(extractSlug).filter(Boolean)).slice(0, CHANNEL_LOOKUP_MAX)

  const channelResults = []
  for (const slug of slugs) {
    requestCounts.channelsV1 += 1
    const channelUrl = new URL('https://api.kick.com/public/v1/channels')
    channelUrl.searchParams.set('slug', slug)
    const channelResponse = await fetchJson(channelUrl, token)
    responseBytes.channelsV1Total += channelResponse.bytes
    channelResults.push({
      status: channelResponse.status,
      ok: channelResponse.ok,
      rows: channelResponse.ok ? extractRows(channelResponse.data) : [],
      bytes: channelResponse.bytes,
    })
  }

  const channelSummary = summarizeChannelResponses(channelResults)

  return {
    provider: 'kick',
    mode: 'stream_map_official_source_probe_v0.1',
    observedAt: new Date().toISOString(),
    officialEndpoints: {
      livestreams: '/public/v2/livestreams',
      channels: '/public/v1/channels',
    },
    sample: {
      livestreamRows: liveRows.length,
      channelLookupsAttempted: channelResults.length,
      channelRows: channelResults.reduce((sum, item) => sum + item.rows.length, 0),
    },
    requestCounts,
    responseBytes,
    livestreams: liveSummary,
    channels: channelSummary,
    persistence: {
      d1Writes: 0,
      productionDeployment: false,
      rawProfileTextStored: false,
      rawTitleTextStored: false,
      rawTagTextStored: false,
      geographyStored: false,
      twitchEvidenceCopied: false,
    },
    decisionInputs: {
      boundedPopulationRequestSufficient: liveRows.length > 0,
      channelLookupCoverageObserved: channelResults.length > 0,
      legacyFallbackNeededForProbe: false,
      automaticGeographyAcceptanceAllowed: false,
    },
  }
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
  const text = await response.text()
  if (!response.ok) throw new Error(`kick_token_http_${response.status}`)
  let parsed = null
  try { parsed = JSON.parse(text) } catch { parsed = null }
  const token = String(parsed?.access_token ?? '').trim()
  if (!token) throw new Error('missing_kick_access_token')
  return token
}

async function fetchJson(url, token) {
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
      'user-agent': 'ViewLoom kick-stream-map-source-probe/0.1',
    },
  })
  const text = await response.text()
  let data = null
  try { data = JSON.parse(text) } catch { data = null }
  return { ok: response.ok, status: response.status, bytes: new TextEncoder().encode(text).byteLength, data }
}

function summarizeLivestreamRows(rows) {
  const rowKeys = unionKeys(rows)
  const tagShapes = countShapes(rows.map((row) => row?.custom_tags))
  const customTagsPresent = rows.filter((row) => hasNonEmpty(row?.custom_tags)).length
  const titlePresent = rows.filter((row) => hasText(row?.stream_title ?? row?.session_title ?? row?.title)).length
  const categoryPresent = rows.filter((row) => isRecord(row?.category)).length
  const categoryKeys = unionKeys(rows.map((row) => row?.category).filter(isRecord))
  return {
    rowKeys,
    customTagsPresent,
    customTagShapes: tagShapes,
    titlePresent,
    categoryPresent,
    categoryKeys,
    stableIdentityCoverage: {
      broadcasterUserId: rows.filter((row) => hasIdentifier(row?.broadcaster_user_id)).length,
      userId: rows.filter((row) => hasIdentifier(row?.user_id)).length,
      channelId: rows.filter((row) => hasIdentifier(row?.channel?.id)).length,
    },
    slugCoverage: {
      slug: rows.filter((row) => hasText(row?.slug)).length,
      channelSlug: rows.filter((row) => hasText(row?.channel_slug)).length,
      nestedChannelSlug: rows.filter((row) => hasText(row?.channel?.slug)).length,
    },
    fieldTypes: selectedFieldTypes(rows, ['broadcaster_user_id', 'user_id', 'slug', 'channel_slug', 'viewer_count', 'custom_tags', 'category', 'stream_title', 'session_title', 'title']),
  }
}

function summarizeChannelResponses(results) {
  const rows = results.flatMap((item) => item.rows)
  const rowKeys = unionKeys(rows)
  const descriptionCandidateKeys = rowKeys.filter((key) => /description/i.test(key))
  return {
    httpStatusCounts: countValues(results.map((item) => String(item.status))),
    successfulLookups: results.filter((item) => item.ok).length,
    rowKeys,
    descriptionCandidateKeys,
    channelDescriptionPresent: rows.filter((row) => hasText(row?.channel_description)).length,
    descriptionPresent: rows.filter((row) => hasText(row?.description)).length,
    customTagsPresent: rows.filter((row) => hasNonEmpty(row?.custom_tags)).length,
    customTagShapes: countShapes(rows.map((row) => row?.custom_tags)),
    stableIdentityCoverage: {
      broadcasterUserId: rows.filter((row) => hasIdentifier(row?.broadcaster_user_id)).length,
      userId: rows.filter((row) => hasIdentifier(row?.user_id)).length,
      id: rows.filter((row) => hasIdentifier(row?.id)).length,
    },
    fieldTypes: selectedFieldTypes(rows, ['broadcaster_user_id', 'user_id', 'id', 'slug', 'channel_description', 'description', 'custom_tags', 'category']),
  }
}

function extractRows(data) {
  if (Array.isArray(data)) return data.filter(isRecord)
  if (Array.isArray(data?.data)) return data.data.filter(isRecord)
  if (isRecord(data?.data)) return [data.data]
  if (isRecord(data)) return [data]
  return []
}

function extractSlug(row) {
  return clean(row?.slug ?? row?.channel_slug ?? row?.channel?.slug)
}

function unionKeys(rows) {
  return unique(rows.flatMap((row) => isRecord(row) ? Object.keys(row) : [])).sort()
}

function selectedFieldTypes(rows, keys) {
  const result = {}
  for (const key of keys) result[key] = countShapes(rows.map((row) => row?.[key]))
  return result
}

function countShapes(values) {
  const shapes = values.map(shapeOf)
  return countValues(shapes)
}

function countValues(values) {
  const result = {}
  for (const value of values) result[value] = (result[value] ?? 0) + 1
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
}

function shapeOf(value) {
  if (value == null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function hasNonEmpty(value) {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  return isRecord(value) && Object.keys(value).length > 0
}

function hasIdentifier(value) {
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'string' && value.trim().length > 0
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function unique(values) {
  return [...new Set(values)]
}

function classifyError(message) {
  if (message === 'missing_kick_credentials') return 'credentials_missing'
  if (message === 'missing_kick_access_token' || message.startsWith('kick_token_http_')) return 'oauth_failure'
  if (message.startsWith('kick_livestreams_v2_http_')) return 'livestreams_v2_failure'
  return 'unexpected_failure'
}

function safeError(message) {
  return String(message).replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 160)
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
