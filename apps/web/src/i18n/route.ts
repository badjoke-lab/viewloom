import type { Locale } from './locale'
import { stripLocalePrefix, withLocalePathname } from './locale'

const NON_LOCALIZED_PREFIXES = ['/api/', '/src/', '/assets/', '/og/'] as const
const JAPANESE_AVAILABLE_PATHNAMES = new Set([
  '/',
  '/twitch/',
  '/twitch/heatmap/',
  '/twitch/day-flow/',
  '/twitch/battle-lines/',
  '/twitch/history/',
  '/kick/',
  '/kick/heatmap/',
  '/kick/day-flow/',
  '/kick/battle-lines/',
  '/kick/history/',
])

function splitHash(value: string): [string, string] {
  const index = value.indexOf('#')
  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)]
}

function splitSearch(value: string): [string, string] {
  const index = value.indexOf('?')
  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)]
}

function normalizePathname(value: string): string {
  const pathname = value.startsWith('/') ? value : `/${value}`
  if (pathname === '/') return '/'
  return `/${pathname.replace(/^\/+|\/+$/g, '')}/`
}

export function isLocalizableInternalHref(href: string): boolean {
  if (!href || href.startsWith('#')) return false
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(href)) return false
  if (href.startsWith('//')) return false

  const [withoutHash] = splitHash(href)
  const [pathname] = splitSearch(withoutHash)
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`

  return !NON_LOCALIZED_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

export function isLocalizedRouteAvailable(pathname: string, locale: Locale): boolean {
  if (locale === 'en') return true
  const englishPathname = normalizePathname(stripLocalePrefix(pathname || '/'))
  return JAPANESE_AVAILABLE_PATHNAMES.has(englishPathname)
}

export function localizeHref(href: string, locale: Locale): string {
  if (!isLocalizableInternalHref(href)) return href

  const [withoutHash, hash] = splitHash(href)
  const [pathname, search] = splitSearch(withoutHash)
  const localizedPathname = withLocalePathname(pathname || '/', locale)

  return `${localizedPathname}${search}${hash}`
}

export function localizeAvailableHref(href: string, locale: Locale): string {
  if (locale !== 'ja' || !isLocalizableInternalHref(href)) return localizeHref(href, locale)

  const [withoutHash] = splitHash(href)
  const [pathname] = splitSearch(withoutHash)
  if (!isLocalizedRouteAvailable(pathname || '/', locale)) return href

  return localizeHref(href, locale)
}

export function equivalentLocaleHref(href: string, locale: Locale): string {
  return localizeHref(href, locale)
}
