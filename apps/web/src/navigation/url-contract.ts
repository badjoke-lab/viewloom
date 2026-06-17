export const VIEWLOOM_ORIGIN = 'https://vl.badjoke-lab.com' as const

export type ViewLoomProvider = 'portal' | 'twitch' | 'kick'

export type PublicPageContract = {
  file: string
  pathname: string
  provider: ViewLoomProvider
}

export const PUBLIC_PAGE_CONTRACTS: readonly PublicPageContract[] = [
  { file: 'index.html', pathname: '/', provider: 'portal' },
  { file: 'about/index.html', pathname: '/about/', provider: 'portal' },
  { file: 'support/index.html', pathname: '/support/', provider: 'portal' },
  { file: 'changelog/index.html', pathname: '/changelog/', provider: 'portal' },
  { file: 'twitch/index.html', pathname: '/twitch/', provider: 'twitch' },
  { file: 'twitch/heatmap/index.html', pathname: '/twitch/heatmap/', provider: 'twitch' },
  { file: 'twitch/day-flow/index.html', pathname: '/twitch/day-flow/', provider: 'twitch' },
  { file: 'twitch/battle-lines/index.html', pathname: '/twitch/battle-lines/', provider: 'twitch' },
  { file: 'twitch/history/index.html', pathname: '/twitch/history/', provider: 'twitch' },
  { file: 'twitch/status/index.html', pathname: '/twitch/status/', provider: 'twitch' },
  { file: 'kick/index.html', pathname: '/kick/', provider: 'kick' },
  { file: 'kick/heatmap/index.html', pathname: '/kick/heatmap/', provider: 'kick' },
  { file: 'kick/day-flow/index.html', pathname: '/kick/day-flow/', provider: 'kick' },
  { file: 'kick/battle-lines/index.html', pathname: '/kick/battle-lines/', provider: 'kick' },
  { file: 'kick/history/index.html', pathname: '/kick/history/', provider: 'kick' },
  { file: 'kick/status/index.html', pathname: '/kick/status/', provider: 'kick' },
] as const

export function canonicalUrl(pathname: string): string {
  const normalized = normalizeCanonicalPathname(pathname)
  return `${VIEWLOOM_ORIGIN}${normalized}`
}

export function normalizeCanonicalPathname(pathname: string): string {
  const raw = String(pathname || '/').trim()
  const withoutQuery = raw.split(/[?#]/, 1)[0] || '/'
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, '/')
  if (collapsed === '/') return '/'
  return collapsed.endsWith('/') ? collapsed : `${collapsed}/`
}

export function providerForPathname(pathname: string): ViewLoomProvider {
  const normalized = normalizeCanonicalPathname(pathname)
  if (normalized === '/twitch/' || normalized.startsWith('/twitch/')) return 'twitch'
  if (normalized === '/kick/' || normalized.startsWith('/kick/')) return 'kick'
  return 'portal'
}
