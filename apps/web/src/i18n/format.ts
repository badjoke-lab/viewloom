import type { Locale } from './locale'

const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  ja: 'ja-JP',
}

export const OBSERVATION_TIMEZONE = 'UTC'

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale]
}

export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPercent(value: number, locale: Locale, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(localeTag(locale), {
    style: 'percent',
    maximumFractionDigits,
  }).format(value)
}

export function formatUtcDateTime(
  value: string | number | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat(localeTag(locale), {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
    timeZone: OBSERVATION_TIMEZONE,
  }).format(date)
}
