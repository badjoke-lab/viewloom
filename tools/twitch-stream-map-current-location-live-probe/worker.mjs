import { measureCurrentLocationCandidateCoverage } from '../twitch-stream-map-current-location/candidate-coverage.mjs'

const HEALTH_PATH = '/health'
const PROBE_PATH = '/audit/current-candidate-coverage'
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
        mode: 'current_location_candidate_coverage_top300_preview',
        productionDeployment: false,
        d1Writes: 0,
        maxTokenRequests: 1,
        maxStreamsRequests: MAX_PAGES,
        usersRequests: 0,
        publicCurrentPlacementAuthorized: false,
        baseMutationAuthorized: false,
        rawTextArtifactAllowed: false,
        credentialPresence: {
          twitchClientId: Boolean(String(env.TWITCH_CLIENT_ID ?? '').trim()),
          twitchClientSecret: Boolean(String(env.TWITCH_CLIENT_SECRET ?? '').trim()),
        },
      })
    }

    if (url.pathname !== PROBE_PATH) return json({ ok: false, error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

    try {
      return json({ ok: true, result: await runCurrentLocationLiveProbe({ env }) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error'
      return json({ ok: false, error: message, errorClass: classifyError(message) }, 502)
    }
  },
}

export async function runCurrentLocationLiveProbe({ env, fetchImpl = fetch, now = () => new Date() }) {
  const clientId = String(env?.TWITCH_CLIENT_ID ?? '').trim()
  const clientSecret = String(env?.TWITCH_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('missing_twitch_credentials')

  let tokenRequests = 0
  let streamsRequests = 0

  tokenRequests += 1
  const accessToken = await fetchAppToken({ clientId, clientSecret, fetchImpl })

  const inMemoryRows = []
  const stableIds = new Set()
  let cursor = ''
  let coveredPages = 0
  let hasMore = false

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('https://api.twitch.tv/helix/streams')
    url.searchParams.set('first', String(PAGE_SIZE))
    if (cursor) url.searchParams.set('after', cursor)

    streamsRequests += 1
    if (streamsRequests > MAX_PAGES) throw new Error('streams_request_budget_exceeded')

    const response = await fetchImpl(url, {
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

    const payload = await response.json()
    if (!Array.isArray(payload?.data)) throw new Error(`invalid_twitch_streams_payload_page_${page + 1}`)

    for (const row of payload.data) {
      if (inMemoryRows.length >= REQUESTED_SIZE) break
      const twitchUserId = String(row?.user_id ?? '').trim()
      if (!twitchUserId) throw new Error(`missing_twitch_user_id_page_${page + 1}`)
      if (stableIds.has(twitchUserId)) throw new Error(`duplicate_twitch_user_id:${twitchUserId}`)
      stableIds.add(twitchUserId)

      inMemoryRows.push({
        twitchUserId,
        title: String(row?.title ?? ''),
        tags: Array.isArray(row?.tags) ? row.tags.map((value) => String(value)) : [],
        language: String(row?.language ?? ''),
      })
    }

    coveredPages += 1
    cursor = String(payload?.pagination?.cursor ?? '').trim()
    hasMore = Boolean(cursor)
    if (!cursor || inMemoryRows.length >= REQUESTED_SIZE) break
  }

  if (!inMemoryRows.length) throw new Error('empty_current_candidate_sample')
  const measurement = measureCurrentLocationCandidateCoverage(inMemoryRows)

  return {
    schemaVersion: 'viewloom-twitch-stream-map-current-live-probe-v0.1',
    provider: 'twitch',
    mode: 'current_location_candidate_coverage_top300_preview',
    observedAt: now().toISOString(),
    requestedSize: REQUESTED_SIZE,
    sampleSize: inMemoryRows.length,
    coveredPages,
    hasMore,
    stableIdentity: 'twitchUserId',
    stableIdentityUnique: stableIds.size === inMemoryRows.length,
    apiRequests: {
      token: tokenRequests,
      streams: streamsRequests,
      users: 0,
    },
    persistence: {
      d1Writes: 0,
      productionDeployment: false,
      rawTitleStored: false,
      rawTagsStored: false,
      rawLanguageStored: false,
      rawTextArtifactAllowed: false,
      canonicalMutationApplied: false,
    },
    decision: {
      status: 'candidate_only',
      acceptanceAuthorized: false,
      publicCurrentPlacementAuthorized: false,
      baseMutationAuthorized: false,
      languageUsedForPlacement: false,
    },
    fieldsInspectedInMemory: ['user_id', 'title', 'tags', 'language'],
    fieldsReturned: ['aggregate_candidate_counts', 'source_yield', 'candidate_countries'],
    measurement,
  }
}

async function fetchAppToken({ clientId, clientSecret, fetchImpl }) {
  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')

  const response = await fetchImpl(url, { method: 'POST' })
  if (!response.ok) throw new Error(`twitch_token_http_${response.status}`)
  const payload = await response.json()
  const accessToken = String(payload?.access_token ?? '').trim()
  if (!accessToken) throw new Error('missing_twitch_access_token')
  return accessToken
}

function classifyError(message) {
  if (message === 'missing_twitch_credentials') return 'credentials'
  if (message.startsWith('twitch_token_http_') || message === 'missing_twitch_access_token') return 'token'
  if (message.startsWith('twitch_streams_http_') || message.startsWith('invalid_twitch_streams_payload_')) return 'streams'
  if (message.startsWith('missing_twitch_user_id_') || message.startsWith('duplicate_twitch_user_id:')) return 'identity'
  if (message === 'empty_current_candidate_sample') return 'empty_sample'
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
