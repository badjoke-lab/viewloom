export const SUPPORTED_LOCALES = ['en', 'ja'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'
export const JAPANESE_PATH_PREFIX = '/ja'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

export function localeFromPathname(pathname: string): Locale {
  return pathname === JAPANESE_PATH_PREFIX || pathname.startsWith(`${JAPANESE_PATH_PREFIX}/`)
    ? 'ja'
    : 'en'
}

export function stripLocalePrefix(pathname: string): string {
  if (pathname === JAPANESE_PATH_PREFIX) return '/'
  if (pathname.startsWith(`${JAPANESE_PATH_PREFIX}/`)) {
    const stripped = pathname.slice(JAPANESE_PATH_PREFIX.length)
    return stripped || '/'
  }
  return pathname || '/'
}

export function withLocalePathname(pathname: string, locale: Locale): string {
  const basePath = stripLocalePrefix(pathname.startsWith('/') ? pathname : `/${pathname}`)

  if (locale === 'en') return basePath
  if (basePath === '/') return `${JAPANESE_PATH_PREFIX}/`
  return `${JAPANESE_PATH_PREFIX}${basePath}`
}
