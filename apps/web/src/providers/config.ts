import type { SiteConfig } from './types'

export const twitchConfig: SiteConfig = {
  platform: 'twitch',
  label: 'Twitch data',
  dataLabel: 'Unofficial Twitch data',
  basePath: '/twitch',
  statusPath: '/twitch/status/',
  streamUrl: (slug: string) => `https://www.twitch.tv/${slug}`,
}

export const kickConfig: SiteConfig = {
  platform: 'kick',
  label: 'Kick data',
  dataLabel: 'Unofficial Kick data',
  basePath: '/kick',
  statusPath: '/kick/status/',
  streamUrl: (slug: string) => `https://kick.com/${slug}`,
}

export const siteConfigs = {
  twitch: twitchConfig,
  kick: kickConfig,
} as const
