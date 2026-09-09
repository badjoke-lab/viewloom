import type { Locale } from './locale'
import { withLocalePathname } from './locale'

const NON_LOCALIZED_PREFIXES = ['/api/', '/src/', '/assets/', '/og/'] as const

function splitHash(value: string): [string, string] {
  const index = value.indexOf('#')
  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)]
}

function splitSearch(value: string): [string, string] {
  const index = value.indexOf('?')
  return index === -1 ? [value, ''] : [value.slice(0, index), value.slice(index)]
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

export function localizeHref(href: string, locale: Locale): string {
  if (!isLocalizableInternalHref(href)) return href

  const [withoutHash, hash] = splitHash(href)
  const [pathname, search] = splitSearch(withoutHash)
  const localizedPathname = withLocalePathname(pathname || '/', locale)

  return `${localizedPathname}${search}${hash}`
}

export function equivalentLocaleHref(href: string, locale: Locale): string {
  return localizeHref(href, locale)
}
