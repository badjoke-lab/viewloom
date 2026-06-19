export function isoDay(date) {
  return date.toISOString().slice(0, 10)
}

function dayOffset(offset) {
  const day = new Date()
  day.setUTCHours(0, 0, 0, 0)
  day.setUTCDate(day.getUTCDate() + offset)
  return isoDay(day)
}

function streamer(platform, index) {
  return {
    streamerId: `${platform}-streamer-${index}`,
    displayName: `${platform === 'twitch' ? 'Twitch' : 'Kick'} Streamer ${index}`,
    viewerMinutes: 2_000_000 - index * 30_000,
    peakViewers: 60_000 - index * 700,
    avgViewers: 8_000 - index * 80,
    observedMinutes: 1_200,
    rankByViewerMinutes: index,
    rankByPeak: index,
    changePct: index % 2 ? 0.12 : 0.04,
    changeAbs: 80_000 - index * 1_000,
    comparisonState: 'comparable',
  }
}

function dailyRows(platform) {
  const streams = Array.from({ length: 20 }, (_, index) => streamer(platform, index + 1))
  return Array.from({ length: 13 }, (_, index) => {
    const day = dayOffset(index - 13)
    return {
      day,
      totalViewerMinutes: 20_000_000 + index * 500_000,
      peakViewers: index === 3 ? 99_000 : 50_000 + index * 1_500,
      peakStreamerName: streams[index % 5].displayName,
      observedStreamCount: 180 + index,
      observedMinutes: 1_380,
      coverageState: index === 2 ? 'partial' : 'good',
      topStreamers: streams.slice(0, 5),
      biggestRise: {
        streamerId: streams[1].streamerId,
        displayName: streams[1].displayName,
        changePct: 0.12,
        changeAbs: 80_000,
      },
    }
  })
}

function peakArchive(days, platform) {
  return [...days]
    .sort((a, b) => b.peakViewers - a.peakViewers)
    .slice(0, 12)
    .map((day, index) => ({
      rank: index + 1,
      day: day.day,
      timestamp: index === 0 ? `${day.day}T21:35:00.000Z` : null,
      timestampPrecision: index === 0 ? 'minute' : 'day',
      peakViewers: day.peakViewers,
      streamerId: `${platform}-peak-${index + 1}`,
      streamer: day.peakStreamerName,
      category: index === 0 ? 'Just Chatting' : null,
      coverageState: day.coverageState,
    }))
}

export function historyPayload(platform, includeArchive) {
  const daily = dailyRows(platform)
  const topStreamers = Array.from({ length: 20 }, (_, index) => streamer(platform, index + 1))
  const peak = [...daily].sort((a, b) => b.peakViewers - a.peakViewers)[0]
  return {
    source: 'real',
    state: 'partial',
    platform,
    metric: 'viewer_minutes',
    period: { from: daily[0].day, to: daily.at(-1).day, label: 'Last 30 days', days: 13 },
    summary: {
      totalViewerMinutes: daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0),
      peakViewers: peak.peakViewers,
      peakDay: peak.day,
      peakDayViewerMinutes: peak.totalViewerMinutes,
      topStreamer: topStreamers[0],
      biggestRise: daily[0].biggestRise,
      coverageState: 'partial',
      summaryScope: 'completed_days',
    },
    daily,
    topStreamers,
    rankings: {
      viewerMinutes: topStreamers,
      peakViewers: [...topStreamers].reverse(),
      averageViewers: topStreamers,
      observedMinutes: topStreamers,
      rising: topStreamers.slice(0, 8),
    },
    coverage: {
      state: 'partial', observedDays: 13, missingDays: 0, partialDays: 1, inProgressDays: 0,
      observedMinutes: daily.reduce((sum, day) => sum + day.observedMinutes, 0),
      expectedMinutes: 13 * 1_440,
      affectedDays: [daily[2].day],
      notes: ['13 of 13 requested days have observed history data.'],
    },
    ...(includeArchive ? {
      peakArchive: peakArchive(daily, platform),
      peakArchiveMeta: {
        sourcePopulation: 'daily', limit: 30, bounded: true, providerSeparated: true,
        inProgressDayExcluded: true, exactTimestampCount: 1, categoryCount: 1,
      },
    } : {}),
  }
}
