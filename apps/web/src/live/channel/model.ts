export type ChannelProvider = 'twitch' | 'kick'
export type ChannelPeriod = '7d' | '30d'
export type ChannelView = 'overview' | 'days' | 'report'

export type ChannelState = {
  provider: ChannelProvider
  channelId: string
  requestedName: string
  period: ChannelPeriod
  view: ChannelView
  selectedDay?: string
}

export type ChannelStreamer = {
  streamerId?: string
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  observedMinutes?: number
  rankByViewerMinutes?: number
}

export type ChannelDay = {
  day?: string
  coverageState?: string
  topStreamers?: ChannelStreamer[]
}

export type ChannelBattleEntry = {
  day?: string
  streamerAId?: string
  streamerAName?: string
  streamerBId?: string
  streamerBName?: string
  score?: number
  viewerMinutesGap?: number
}

export type ChannelHistoryPayload = {
  source?: string
  state?: string
  period?: { label?: string; days?: number }
  topStreamers?: ChannelStreamer[]
  daily?: ChannelDay[]
  battleArchive?: ChannelBattleEntry[]
  coverage?: { notes?: string[] }
  error?: { message?: string }
}
