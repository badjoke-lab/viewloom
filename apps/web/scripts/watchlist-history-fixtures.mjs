export function entry(channelId) {
  return {
    channelId,
    displayName: channelId,
    addedAt: '2026-06-24T00:00:00.000Z',
  }
}

export function ranked(
  streamerId,
  displayName,
  viewerMinutes,
  rankByViewerMinutes,
  peakViewers = 100,
  avgViewers = 50,
  observedMinutes = 20,
  rankByPeak = rankByViewerMinutes,
) {
  return {
    streamerId,
    displayName,
    viewerMinutes,
    peakViewers,
    avgViewers,
    observedMinutes,
    rankByViewerMinutes,
    rankByPeak,
  }
}

export function twitchHistoryPayload(period = '7d') {
  const days = period === '7d' ? 7 : 30
  return {
    source: 'real',
    state: 'fresh',
    platform: 'twitch',
    metric: 'viewer_minutes',
    period: {
      from: period === '7d' ? '2026-06-18' : '2026-05-26',
      to: '2026-06-24',
      label: period === '7d' ? 'Last 7 days' : 'Last 30 days',
      days,
    },
    topStreamers: [
      ranked('alpha', 'Alpha', 100000, 1, 1500, 714, 140, 1),
      ranked('top_only', 'Top Only', 50000, 2, 900, 500, 100, 2),
    ],
    daily: [
      {
        day: '2026-06-23',
        coverageState: 'good',
        topStreamers: [
          ranked('alpha', 'Alpha', 16000, 1, 1200, 667, 24, 1),
          ranked('daily_only', 'Daily Only', 4500, 5, 300, 188, 24, 5),
        ],
      },
      {
        day: '2026-06-24',
        coverageState: 'good',
        topStreamers: [
          ranked('alpha', 'Alpha', 18000, 1, 1500, 750, 24, 1),
        ],
      },
    ],
    coverage: {
      state: 'good',
      observedDays: days,
      missingDays: 0,
      partialDays: 0,
      inProgressDays: 0,
      notes: ['Seven observed days.'],
    },
    notes: ['Twitch History read_path=daily_rollups.'],
  }
}

export function kickHistoryPayload(period = '7d') {
  const payload = twitchHistoryPayload(period)
  return {
    ...payload,
    platform: 'kick',
    topStreamers: [
      ranked('gamma', 'Gamma', 80000, 1, 1100, 615, 130, 1),
    ],
    daily: [
      {
        day: '2026-06-24',
        coverageState: 'good',
        topStreamers: [
          ranked('gamma', 'Gamma', 12000, 1, 900, 500, 24, 1),
        ],
      },
    ],
    notes: ['Kick History read_path=daily_rollups.'],
  }
}

export function twitchLatestPayload() {
  return {
    ok: true,
    source: 'api',
    provider: 'twitch',
    platform: 'twitch',
    state: 'live',
    status: 'live',
    updatedAt: '2026-06-24T08:00:00.000Z',
    targetSource: 'twitch-helix-streams',
    coverageMode: 'observed-top-pages',
    coverageNote: 'Two observed Twitch streams.',
    items: [
      {
        id: 'alpha',
        name: 'Alpha',
        viewers: 1200,
        title: 'Alpha title',
        momentum: 0.25,
        url: 'https://www.twitch.tv/alpha',
      },
      {
        id: 'latest_only',
        name: 'Latest Only',
        viewers: 600,
      },
    ],
  }
}
