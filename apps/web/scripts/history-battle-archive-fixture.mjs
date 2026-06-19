const day = (dayValue, index) => ({
  day: dayValue,
  totalViewerMinutes: 5000000 - index * 100000,
  peakViewers: 100000 - index * 1000,
  peakStreamerName: `Leader ${index}`,
  observedStreamCount: 100,
  observedMinutes: 1440,
  coverageState: index === 1 ? 'partial' : 'good',
  topStreamers: [
    { streamerId: `alpha-${index}`, displayName: `Alpha ${index}`, viewerMinutes: 1000000 - index * 10000, peakViewers: 50000, observedMinutes: 900 },
    { streamerId: `beta-${index}`, displayName: `Beta ${index}`, viewerMinutes: 980000 - index * 9000, peakViewers: 49000, observedMinutes: 880 },
    { streamerId: `gamma-${index}`, displayName: `Gamma ${index}`, viewerMinutes: 500000, peakViewers: 30000, observedMinutes: 700 },
  ],
})

export function historyPayload(provider) {
  const days = Array.from({ length: 12 }, (_, index) => day(`2026-06-${String(6 + index).padStart(2, '0')}`, index))
  const battleArchive = days.map((item, index) => ({
    rank: index + 1,
    day: item.day,
    timestamp: null,
    timestampPrecision: 'day',
    battleId: `alpha-${index}__beta-${index}`,
    pair: [`alpha-${index}`, `beta-${index}`],
    streamerAId: `alpha-${index}`,
    streamerAName: `Alpha ${index}`,
    streamerBId: `beta-${index}`,
    streamerBName: `Beta ${index}`,
    viewerMinutesA: 1000000 - index * 10000,
    viewerMinutesB: 980000 - index * 9000,
    peakViewersA: 50000,
    peakViewersB: 49000,
    leaderId: `alpha-${index}`,
    leaderName: `Alpha ${index}`,
    challengerId: `beta-${index}`,
    challengerName: `Beta ${index}`,
    viewerMinutesGap: 20000 - index * 1000,
    closeness: 0.98 - index * 0.002,
    score: 98 - index * 0.5,
    coverageState: item.coverageState,
    archiveBasis: 'daily_aggregate_pair',
    exactEventTimeAvailable: false,
    reversalCount: null,
  }))
  return {
    source: 'real',
    state: 'fresh',
    platform: provider,
    period: { from: days[0].day, to: days.at(-1).day, label: 'Fixture range', days: days.length },
    metric: 'viewer_minutes',
    summary: { totalViewerMinutes: 10000000, peakViewers: 100000, peakDay: days[0].day, peakDayViewerMinutes: 5000000, topStreamer: days[0].topStreamers[0], biggestRise: null, coverageState: 'partial' },
    daily: days,
    topStreamers: days[0].topStreamers,
    coverage: { state: 'partial', observedDays: days.length, missingDays: 0, partialDays: 1, observedMinutes: 17280, expectedMinutes: 17280, affectedDays: [days[1].day], notes: ['Fixture coverage.'] },
    battleArchive,
    battleArchiveMeta: { sourcePopulation: 'daily.topStreamers', archiveBasis: 'daily_aggregate_pair', limit: 30, bounded: true, providerSeparated: true, inProgressDayExcluded: true, exactEventTimesAvailable: false, inferredReversals: false },
  }
}
