export type ProviderHomeConfig = {
  id: 'twitch' | 'kick'
  label: 'Twitch data' | 'Kick data'
  eyebrow: 'TWITCH DATA' | 'KICK DATA'
  badge: 'Unofficial Twitch data' | 'Unofficial Kick data'
  themeClass: 'theme-twitch' | 'theme-kick'
  basePath: '/twitch' | '/kick'
}

export const providerHomeConfigs: Record<'twitch' | 'kick', ProviderHomeConfig> = {
  twitch: {
    id: 'twitch',
    label: 'Twitch data',
    eyebrow: 'TWITCH DATA',
    badge: 'Unofficial Twitch data',
    themeClass: 'theme-twitch',
    basePath: '/twitch',
  },
  kick: {
    id: 'kick',
    label: 'Kick data',
    eyebrow: 'KICK DATA',
    badge: 'Unofficial Kick data',
    themeClass: 'theme-kick',
    basePath: '/kick',
  },
}

export const providerHomeFeatures = [
  ['NOW', 'Heatmap', 'Read who is big, rising, or active now.', 'heatmap'],
  ['TODAY', 'Day Flow', 'Read the daily audience terrain.', 'day-flow'],
  ['RIVALRY', 'Battle Lines', 'Read rivalry, reversals, and pressure.', 'battle-lines'],
  ['TRENDS', 'History & Trends', 'Review observed days and changes.', 'history'],
] as const
