const HEALTH_PATH = '/health'
const SAMPLE_PATH = '/audit/coverage-expansion-sample'
const PAGE_SIZE = 100
const MAX_PAGES = 3
const REQUESTED_SIZE = PAGE_SIZE * MAX_PAGES

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === HEALTH_PATH) {
      if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405)
      return json({
        ok: true,
        mode: 'coverage_expansion_top300_preview',
        productionDeployment: false,
        d1Writes: 0,
        maxStreamsRequests: MAX_PAGES,
        usersRequests: 0,
        credentialPresence: {
          twitchClientId: Boolean(String(env.TWITCH_CLIENT_ID ?? '').trim()),
          twitchClientSecret: Boolean(String(env.TWITCH_CLIENT_SECRET ?? '').trim()),
        },
      })
    }

    if (url.pathname !== SAMPLE_PATH) return json({ ok: false, error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

    try {
      return json({ ok: true, result: await captureTop300StableIdentities(env) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      return json({
        ok: false,
        error: message,
        errorClass: classifyError(message),
      }, 502)
    }
  },
}

async function captureTop300StableIdentities(env) {
  const clientId = String(env.TWITCH_CLIENT_ID ?? '').trim()
  const clientSecret = String(env.TWITCH_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('missing_twitch_credentials')

  let tokenRequests = 0
  let streamsRequests = 0

  tokenRequests += 1
  const accessToken = await fetchAppToken({ clientId, clientSecret })

  const identities = []
  let cursor = ''
  let coveredPages = 0
  let hasMore = false

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('https://api.twitch.tv/helix/streams')
    url.searchParams.set('first', String(PAGE_SIZE))
    if (cursor) url.searchParams.set('after', cursor)

    streamsRequests += 1
    if (streamsRequests > MAX_PAGES) throw new Error('streams_request_budget_exceeded')

    const response = await fetch(url, {
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

    const payload = await response.json()
    if (!Array.isArray(payload?.data)) throw new Error(`invalid_twitch_streams_payload_page_${page + 1}`)

    for (const row of payload.data) {
      if (identities.length >= REQUESTED_SIZE) break
      identities.push(normalizeIdentity(row, identities.length + 1))
    }

    coveredPages += 1
    cursor = String(payload?.pagination?.cursor ?? '').trim()
    hasMore = Boolean(cursor)
    if (!cursor || identities.length >= REQUESTED_SIZE) break
  }

  validateUniqueStableIdentities(identities)
  if (!identities.length) throw new Error('empty_top300_identity_sample')

  return {
    provider: 'twitch',
    mode: 'coverage_expansion_stable_identity_top300_preview',
    capturedAt: new Date().toISOString(),
    requestedSize: REQUESTED_SIZE,
    sampleSize: identities.length,
    coveredPages,
    hasMore,
    apiRequests: {
      token: tokenRequests,
      streams: streamsRequests,
      users: 0,
    },
    persistence: {
      d1Writes: 0,
      productionDeployment: false,
      identityArtifactOnly: true,
      rawTitleStored: false,
      rawTagsStored: false,
      rawLanguageStored: false,
      rawProfileDescriptionStored: false,
      rawCategoryStored: false,
      geographyStored: false,
      coordinatesStored: false,
      addressStored: false,
    },
    fieldsIncluded: ['rank', 'twitchUserId', 'login', 'displayName', 'viewers'],
    identities,
  }
}

async function fetchAppToken({ clientId, clientSecret }) {
  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')

  const response = await fetch(url, { method: 'POST' })
  if (!response.ok) throw new Error(`twitch_token_http_${response.status}`)
  const payload = await response.json()
  const accessToken = String(payload?.access_token ?? '').trim()
  if (!accessToken) throw new Error('missing_twitch_access_token')
  return accessToken
}

function normalizeIdentity(row, rank) {
  const twitchUserId = String(row?.user_id ?? '').trim()
  const login = String(row?.user_login ?? '').trim().toLowerCase()
  const displayName = String(row?.user_name ?? '').trim()
  const viewers = Number(row?.viewer_count)

  if (!twitchUserId) throw new Error(`missing_twitch_user_id_rank_${rank}`)
  if (!login) throw new Error(`missing_login_rank_${rank}`)
  if (!displayName) throw new Error(`missing_display_name_rank_${rank}`)
  if (!Number.isFinite(viewers) || viewers < 0) throw new Error(`invalid_viewers_rank_${rank}`)

  return {
    rank,
    twitchUserId,
    login,
    displayName,
    viewers: Math.round(viewers),
  }
}

function validateUniqueStableIdentities(identities) {
  const ids = new Set()
  const loginToId = new Map()

  for (const row of identities) {
    if (ids.has(row.twitchUserId)) throw new Error(`duplicate_twitch_user_id:${row.twitchUserId}`)
    ids.add(row.twitchUserId)

    const prior = loginToId.get(row.login)
    if (prior && prior !== row.twitchUserId) throw new Error(`login_identity_collision:${row.login}`)
    loginToId.set(row.login, row.twitchUserId)
  }
}

function classifyError(message) {
  if (message === 'missing_twitch_credentials') return 'credentials'
  if (message.startsWith('twitch_token_http_') || message === 'missing_twitch_access_token') return 'token'
  if (message.startsWith('twitch_streams_http_') || message.startsWith('invalid_twitch_streams_payload_')) return 'streams'
  if (message.startsWith('missing_twitch_user_id_') || message.startsWith('missing_login_') || message.startsWith('missing_display_name_') || message.startsWith('invalid_viewers_')) return 'identity_normalization'
  if (message.startsWith('duplicate_twitch_user_id:') || message.startsWith('login_identity_collision:')) return 'identity_uniqueness'
  if (message === 'empty_top300_identity_sample') return 'empty_sample'
  if (message === 'streams_request_budget_exceeded') return 'budget'
  return 'unknown'
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
