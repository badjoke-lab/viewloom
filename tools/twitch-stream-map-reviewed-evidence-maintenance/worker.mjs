const SAMPLE_PATH = '/audit/reviewed-evidence-maintenance-sample'
const HEALTH_PATH = '/health'
const SAMPLE_SIZE = 20

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === HEALTH_PATH) {
      if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405)
      return json({
        ok: true,
        mode: 'manual_dispatch_reviewed_evidence_maintenance_preview',
        productionDeployment: false,
        d1Writes: 0,
      })
    }

    if (url.pathname !== SAMPLE_PATH) return json({ ok: false, error: 'not_found' }, 404)
    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

    try {
      const result = await captureFixedTop20(env)
      return json({ ok: true, result })
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      }, 502)
    }
  },
}

async function captureFixedTop20(env) {
  const clientId = String(env.TWITCH_CLIENT_ID ?? '').trim()
  const clientSecret = String(env.TWITCH_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('missing_twitch_credentials')

  let tokenRequests = 0
  let streamsRequests = 0

  const tokenUrl = new URL('https://id.twitch.tv/oauth2/token')
  tokenUrl.searchParams.set('client_id', clientId)
  tokenUrl.searchParams.set('client_secret', clientSecret)
  tokenUrl.searchParams.set('grant_type', 'client_credentials')

  tokenRequests += 1
  const tokenResponse = await fetch(tokenUrl, { method: 'POST' })
  if (!tokenResponse.ok) throw new Error(`twitch_token_http_${tokenResponse.status}`)
  const tokenPayload = await tokenResponse.json()
  const accessToken = String(tokenPayload?.access_token ?? '').trim()
  if (!accessToken) throw new Error('missing_twitch_access_token')

  streamsRequests += 1
  const streamsResponse = await fetch('https://api.twitch.tv/helix/streams?first=20', {
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!streamsResponse.ok) throw new Error(`twitch_streams_http_${streamsResponse.status}`)

  const streamsPayload = await streamsResponse.json()
  if (!Array.isArray(streamsPayload?.data)) throw new Error('invalid_twitch_streams_payload')
  if (streamsPayload.data.length !== SAMPLE_SIZE) throw new Error(`expected_${SAMPLE_SIZE}_streams_got_${streamsPayload.data.length}`)

  const identities = streamsPayload.data.map((row, index) => {
    const twitchUserId = String(row?.user_id ?? '').trim()
    const login = String(row?.user_login ?? '').trim().toLowerCase()
    const displayName = String(row?.user_name ?? '').trim()
    const viewers = Number(row?.viewer_count)

    if (!twitchUserId) throw new Error(`missing_twitch_user_id_rank_${index + 1}`)
    if (!login) throw new Error(`missing_login_rank_${index + 1}`)
    if (!displayName) throw new Error(`missing_display_name_rank_${index + 1}`)
    if (!Number.isFinite(viewers) || viewers < 0) throw new Error(`invalid_viewers_rank_${index + 1}`)

    return {
      rank: index + 1,
      twitchUserId,
      login,
      displayName,
      viewers,
    }
  })

  if (new Set(identities.map((row) => row.twitchUserId)).size !== SAMPLE_SIZE) throw new Error('duplicate_twitch_user_id')
  if (new Set(identities.map((row) => row.login)).size !== SAMPLE_SIZE) throw new Error('duplicate_login')

  return {
    provider: 'twitch',
    mode: 'manual_dispatch_fixed_top20_reviewed_evidence_maintenance_sample',
    observedAt: new Date().toISOString(),
    requestedSize: SAMPLE_SIZE,
    sampleSize: identities.length,
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
      rawProfileDescriptionStored: false,
      rawCategoryStored: false,
      geographyStored: false,
      coordinatesStored: false,
      addressStored: false,
      identitySampleArtifactOnly: true,
    },
    fieldsIncluded: ['rank', 'twitchUserId', 'login', 'displayName', 'viewers'],
    identities,
  }
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
