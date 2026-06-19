const dates = ['2026-06-12', '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18']

const stream = (id, index) => ({
  streamerId: `${id}-${index}`,
  displayName: `${id} ${index}`,
  viewerMinutes: 900000 - index * 10000,
  peakViewers: 45000 - index * 500,
  avgViewers: 1000 - index * 10,
  observedMinutes: 900,
  rankByViewerMinutes: index + 1,
  rankByPeak: index + 1,
  changePct: 0.1,
  changeAbs: 80000,
  comparisonState: 'comparable',
})

function daily(index) {
  const topStreamers = [stream('Alpha', index), stream('Beta', index + 1), stream('Gamma', index + 2)]
  return {
    day: dates[index],
    totalViewerMinutes: 1800000 + index * 100000,
    peakViewers: 90000 + index * 2000,
    peakStreamerName: topStreamers[0].displayName,
    observedStreamCount: 100,
    observedMinutes: 1440,
    coverageState: 'good',
    topStreamers,
    biggestRise: null,
  }
}

function comparison(provider, state) {
  const comparable = state === 'comparable'
  return {
    state,
    scope: 'completed_observed_days',
    provider,
    providerSeparated: true,
    inProgressDayExcluded: true,
    alignedDayCount: comparable,
    reason: comparable
      ? 'Equal completed-day scopes with complete coverage.'
      : 'Current and previous scopes contain 7 and 4 selected days.',
    current: {
      requestedFrom: '2026-06-12',
      requestedTo: '2026-06-18',
      from: '2026-06-12',
      to: '2026-06-18',
      selectedDays: 7,
      totalViewerMinutes: 14000000,
      peakViewers: 120000,
      averageViewers: 1389,
      observedMinutes: 10080,
      coverageState: 'good',
    },
    previous: {
      requestedFrom: '2026-06-05',
      requestedTo: '2026-06-11',
      from: comparable ? '2026-06-05' : '2026-06-08',
      to: '2026-06-11',
      selectedDays: comparable ? 7 : 4,
      totalViewerMinutes: comparable ? 10000000 : 6000000,
      peakViewers: comparable ? 100000 : 88000,
      averageViewers: comparable ? 992 : 1042,
      observedMinutes: comparable ? 10080 : 5760,
      coverageState: comparable ? 'good' : 'partial',
    },
    changes: comparable ? {
      totalViewerMinutes: { absolute: 4000000, pct: 0.4 },
      peakViewers: { absolute: 20000, pct: 0.2 },
      averageViewers: { absolute: 397, pct: 0.4002 },
    } : null,
  }
}

export function historyPayload(provider, state = 'comparable') {
  const days = dates.map((_, index) => daily(index))
  const periodComparison = comparison(provider, state)
  return {
    source: 'real',
    state: 'fresh',
    platform: provider,
    period: { from: dates[0], to: dates.at(-1), label: 'Fixture range', days: dates.length },
    metric: 'viewer_minutes',
    comparison: { previousPeriodAvailable: true, period: periodComparison },
    periodComparison,
    summary: {
      totalViewerMinutes: 14700000,
      peakViewers: 102000,
      peakDay: dates.at(-1),
      peakDayViewerMinutes: 2400000,
      topStreamer: days[0].topStreamers[0],
      biggestRise: null,
      coverageState: 'good',
    },
    daily: days,
    topStreamers: days[0].topStreamers,
    coverage: {
      state: 'good',
      observedDays: days.length,
      missingDays: 0,
      partialDays: 0,
      inProgressDays: 0,
      observedMinutes: 10080,
      expectedMinutes: 10080,
      affectedDays: [],
      notes: ['All fixture days have complete observations.'],
    },
  }
}
