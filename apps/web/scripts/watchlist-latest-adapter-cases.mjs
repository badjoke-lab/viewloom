import assert from 'node:assert/strict'

export function verifyAdapter(adapter) {
  const live = adapter.normalizeTwitchHeatmapResponse(twitchPayload())
  assert.equal(live.schema, 'viewloom-watchlist-latest-v1')
  assert.equal(live.provider, 'twitch')
  assert.equal(live.endpoint, '/api/twitch-heatmap')
  assert.equal(live.state, 'live')
  assert.equal(live.freshness, 'fresh')
  assert.equal(live.usableForAbsence, true)
  assert.equal(live.source, 'api')
  assert.equal(live.targetSource, 'twitch-helix-streams')
  assert.equal(live.updatedAt, '2026-06-24T08:00:00.000Z')
  assert.equal(live.coverageMode, 'observed-top-pages')
  assert.equal(live.coverageNote, 'Two observed Twitch streams.')
  assert.deepEqual([...live.itemsById.keys()], ['alpha', 'beta'])
  assert.deepEqual(live.itemsById.get('alpha'), {
    channelId: 'alpha', displayName: 'Alpha', viewers: 1200,
    title: 'Alpha title', momentum: 0.25,
    url: 'https://www.twitch.tv/alpha',
    startedAt: '2026-06-24T07:00:00.000Z',
  })
  assert.equal(live.itemsById.get('beta').viewers, 900)
  assert.equal(live.itemsById.get('beta').title, null)
  assert.equal(live.itemsById.get('beta').momentum, null)

  const partial = adapter.normalizeTwitchHeatmapResponse({
    ...twitchPayload(), coverageMode: 'partial-top-pages',
  })
  assert.equal(partial.state, 'partial')
  assert.equal(partial.freshness, 'fresh')

  const stale = adapter.normalizeKickHeatmapResponse(kickPayload('stale'))
  assert.equal(stale.provider, 'kick')
  assert.equal(stale.endpoint, '/api/kick-heatmap')
  assert.equal(stale.state, 'stale')
  assert.equal(stale.freshness, 'stale')
  assert.equal(stale.itemsById.get('gamma').momentum, -0.1)

  const nested = adapter.normalizeTwitchHeatmapResponse({
    ok: true,
    provider: 'twitch',
    latest: {
      collected_at: '2026-06-24T08:05:00.000Z',
      bucket_minute: '2026-06-24T08:05:00.000Z',
      source_mode: 'real',
      coverage_mode: 'observed-top-pages',
      has_more: 0,
      payload_json: JSON.stringify({
        items: [{ channelLogin: 'nested_id', displayName: 'Nested', viewers: '321' }],
      }),
    },
    notes: ['target_source=twitch-helix-streams'],
  })
  assert.equal(nested.state, 'live')
  assert.equal(nested.source, 'real')
  assert.equal(nested.targetSource, 'twitch-helix-streams')
  assert.equal(nested.itemsById.get('nested_id').viewers, 321)

  const duplicate = adapter.normalizeTwitchHeatmapResponse({
    ...twitchPayload(),
    items: [
      { id: 'same_id', name: 'First', viewers: 10 },
      { id: 'same_id', name: 'Second', viewers: 999 },
      { id: 'invalid id!', name: 'Invalid', viewers: 1 },
      { id: 'no_numbers', name: 'No numbers' },
    ],
  })
  assert.equal(duplicate.itemCount, 2)
  assert.equal(duplicate.itemsById.get('same_id').displayName, 'First')
  assert.equal(duplicate.itemsById.get('same_id').viewers, 10)
  assert.equal(duplicate.itemsById.get('no_numbers').viewers, null)

  const empty = adapter.normalizeKickHeatmapResponse({
    source: 'api', platform: 'kick', state: 'empty',
    updatedAt: '2026-06-24T08:00:00.000Z', items: [],
  })
  assert.equal(empty.state, 'empty')
  assert.equal(empty.freshness, 'unavailable')
  assert.equal(empty.usableForAbsence, false)

  const allInvalid = adapter.normalizeTwitchHeatmapResponse({
    source: 'api', provider: 'twitch', state: 'live', items: [{ id: 'bad id!' }],
  })
  assert.equal(allInvalid.state, 'error')

  const mismatch = adapter.normalizeTwitchHeatmapResponse({
    source: 'api', platform: 'kick', state: 'live', items: [{ id: 'alpha' }],
  })
  assert.equal(mismatch.errorCode, 'provider-mismatch')
  assert.equal(adapter.normalizeKickHeatmapResponse(null).errorCode, 'unreadable-payload')
  assert.equal(adapter.normalizeTwitchHeatmapResponse({
    provider: 'twitch', latest: { payload_json: '{bad' },
  }).errorCode, 'unreadable-payload')
}

export function verifyEvidence(model, latestModel, adapter) {
  const entries = [entry('alpha'), entry('missing')]
  const fresh = latestModel.latestEvidenceForEntries(
    adapter.normalizeTwitchHeatmapResponse(twitchPayload()), entries,
  )
  assert.equal(fresh[0].state, 'present_fresh')
  assert.equal(fresh[0].item.viewers, 1200)
  assert.equal(fresh[1].state, 'absent_usable')
  assert.equal(fresh[1].item, null)

  const stale = latestModel.latestEvidenceForEntries(
    adapter.normalizeKickHeatmapResponse(kickPayload('stale')),
    [entry('gamma'), entry('missing')],
  )
  assert.equal(stale[0].state, 'present_stale')
  assert.equal(stale[1].state, 'absent_usable')

  const unavailable = latestModel.latestEvidenceForEntries(
    adapter.normalizeKickHeatmapResponse({ platform: 'kick', state: 'empty', items: [] }), entries,
  )
  assert.deepEqual(unavailable.map((item) => item.state), ['latest_unavailable', 'latest_unavailable'])
  assert.equal(unavailable.every((item) => item.item === null), true)

  assert.deepEqual(latestModel.validEntryIds([
    entry('Alpha'), entry('alpha'), entry('bad id!'), entry('beta'),
  ]), ['alpha', 'beta'])
  assert.deepEqual(latestModel.unavailableLatestEvidence([entry('alpha')]), [
    { channelId: 'alpha', state: 'latest_unavailable', item: null },
  ])
  assert.equal(latestModel.createUnavailableLatestSnapshot('twitch', 'request-failed').endpoint, '/api/twitch-heatmap')
  assert.equal(model.normalizeStoredChannelId('ALPHA'), 'alpha')
}

export function twitchPayload() {
  return {
    ok: true,
    source: 'api', provider: 'twitch', platform: 'twitch',
    state: 'live', status: 'live',
    updatedAt: '2026-06-24T08:00:00.000Z',
    targetSource: 'twitch-helix-streams',
    coverageMode: 'observed-top-pages',
    coverageNote: 'Two observed Twitch streams.',
    items: [
      {
        id: 'Alpha', name: 'Alpha', viewers: 1200,
        title: 'Alpha title', momentum: 0.25,
        url: 'https://www.twitch.tv/alpha',
        startedAt: '2026-06-24T07:00:00.000Z',
      },
      { channelLogin: 'beta', displayName: 'Beta', viewer_count: '900' },
    ],
  }
}

export function kickPayload(state = 'live') {
  return {
    source: 'api', platform: 'kick', state, status: state,
    updatedAt: '2026-06-24T08:00:00.000Z',
    targetSource: 'kick-public-api',
    coverageMode: 'observed-top-pages',
    coverageNote: 'One observed Kick stream.',
    items: [{
      id: 'gamma', name: 'Gamma', viewers: 500,
      title: 'Gamma title', momentum: -0.1,
      url: 'https://kick.com/gamma',
    }],
  }
}

export function entry(channelId) {
  return { channelId, displayName: channelId, addedAt: '2026-06-24T00:00:00.000Z' }
}
