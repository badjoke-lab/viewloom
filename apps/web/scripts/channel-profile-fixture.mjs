const dates = ['2026-06-12', '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18']

const alpha = {
  streamerId: 'alpha',
  displayName: 'Alpha Channel',
  viewerMinutes: 4200000,
  peakViewers: 42000,
  avgViewers: 5000,
  observedMinutes: 840,
  rankByViewerMinutes: 1,
  rankByPeak: 1,
  changePct: 0.2,
  changeAbs: 700000,
  comparisonState: 'comparable',
}

const beta = {
  streamerId: 'beta',
  displayName: 'Beta Channel',
  viewerMinutes: 3900000,
  peakViewers: 40000,
  avgViewers: 4700,
  observedMinutes: 830,
  rankByViewerMinutes: 2,
  rankByPeak: 2,
  changePct: 0.1,
  changeAbs: 350000,
  comparisonState: 'comparable',
}

function daily(index) {
  const includesAlpha = ![1, 4, 6].includes(index)
  const alphaDay = {
    ...alpha,
    viewerMinutes: 500000 + index * 25000,
    peakViewers: 30000 + index * 500,
    avgViewers: 4200 + index * 50,
    observedMinutes: 120 + index * 5,
    rankByViewerMinutes: index % 2 === 0 ? 1 : 2,
  }
  return {
    day: dates[index],
    totalViewerMinutes: 3000000 + index * 100000,
    peakViewers: 80000 + index * 1000,
    peakStreamerName: includesAlpha ? 'Alpha Channel' : 'Beta Channel',
    observedStreamCount: 100,
    observedMinutes: 1440,
    coverageState: index === 3 ? 'partial' : 'good',
    topStreamers: includesAlpha ? [alphaDay, beta] : [beta],
    biggestRise: null,
  }
}

export function channelHistoryPayload(provider) {
  const days = dates.map((_, index) => daily(index))
  return {
    source: 'real',
    state: 'fresh',
    platform: provider,
    period: { from: dates[0], to: dates.at(-1), label: 'Fixture range', days: dates.length },
    metric: 'viewer_minutes',
    summary: {
      totalViewerMinutes: 23100000,
      peakViewers: 86000,
      peakDay: dates.at(-1),
      peakDayViewerMinutes: 3600000,
      topStreamer: alpha,
      biggestRise: null,
      coverageState: 'partial',
    },
    daily: days,
    topStreamers: [alpha, beta],
    rankings: {
      viewerMinutes: [alpha, beta],
      peakViewers: [alpha, beta],
      averageViewers: [alpha, beta],
      observedMinutes: [alpha, beta],
      rising: [alpha, beta],
    },
    battleArchive: [
      {
        rank: 1,
        day: '2026-06-17',
        streamerAId: 'alpha',
        streamerAName: 'Alpha Channel',
        streamerBId: 'beta',
        streamerBName: 'Beta Channel',
        score: 96,
        viewerMinutesGap: 25000,
        coverageState: 'good',
      },
      {
        rank: 2,
        day: '2026-06-15',
        streamerAId: 'gamma',
        streamerAName: 'Gamma Channel',
        streamerBId: 'alpha',
        streamerBName: 'Alpha Channel',
        score: 91,
        viewerMinutesGap: 42000,
        coverageState: 'partial',
      },
    ],
    coverage: {
      state: 'partial',
      observedDays: days.length,
      missingDays: 0,
      partialDays: 1,
      inProgressDays: 0,
      observedMinutes: 10080,
      expectedMinutes: 10080,
      affectedDays: ['2026-06-15'],
      notes: ['Seven fixture days are retained; one day has partial coverage.'],
    },
  }
}
