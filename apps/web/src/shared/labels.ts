export type Platform = 'twitch' | 'kick'

export type PageRole = 'now' | 'today' | 'rivalry' | 'trends' | 'status'

export type FeaturePage = 'heatmap' | 'day-flow' | 'battle-lines' | 'history' | 'status'

const PLATFORM_NAMES: Record<Platform, string> = {
  twitch: 'Twitch',
  kick: 'Kick',
}

const ROLE_LABELS: Record<PageRole, string> = {
  now: 'NOW',
  today: 'TODAY',
  rivalry: 'RIVALRY',
  trends: 'TRENDS',
  status: 'STATUS',
}

const FEATURE_TITLES: Record<FeaturePage, string> = {
  heatmap: 'Heatmap',
  'day-flow': 'Day Flow',
  'battle-lines': 'Battle Lines',
  history: 'History & Trends',
  status: 'Data Status',
}

const FEATURE_ROLES: Record<FeaturePage, PageRole> = {
  heatmap: 'now',
  'day-flow': 'today',
  'battle-lines': 'rivalry',
  history: 'trends',
  status: 'status',
}

export function getPlatformName(platform: Platform): string {
  return PLATFORM_NAMES[platform]
}

export function getPlatformDataLabel(platform: Platform): string {
  return `${getPlatformName(platform)} data`
}

export function getUnofficialBadge(platform: Platform): string {
  return `Unofficial ${getPlatformName(platform)} data`
}

export function getHeroEyebrow(platform: Platform, role: PageRole): string {
  return `${getPlatformName(platform).toUpperCase()} DATA · ${ROLE_LABELS[role]}`
}

export function getFeatureTitle(page: FeaturePage): string {
  return FEATURE_TITLES[page]
}

export function getFeatureRole(page: FeaturePage): PageRole {
  return FEATURE_ROLES[page]
}

export function getSeoTitle(page: FeaturePage, platform: Platform): string {
  return `${getFeatureTitle(page)} for ${getPlatformName(platform)} live streams | ViewLoom`
}

export function getMetaDescription(page: FeaturePage, platform: Platform): string {
  const platformName = getPlatformName(platform)
  const title = getFeatureTitle(page)
  return `${title} is an independent, unofficial ViewLoom view for ${platformName} live-stream data.`
}

export const INDEPENDENT_DISCLAIMER =
  'ViewLoom is an independent, unofficial observation tool and is not affiliated with, endorsed by, or sponsored by Twitch or Kick. Twitch and Kick are trademarks of their respective owners.'
