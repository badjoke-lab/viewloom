import type { Locale } from '../locale'
import { enMessages, type MessageKey } from './en'
import { jaMessages } from './ja'

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en: enMessages,
  ja: jaMessages,
}

export type TranslationParams = Record<string, string | number>

export function translate(locale: Locale, key: MessageKey, params: TranslationParams = {}): string {
  const template = catalogs[locale][key] ?? enMessages[key]

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export { enMessages, jaMessages }
export type { MessageKey }
