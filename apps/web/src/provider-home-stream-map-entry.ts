import type { Locale } from './i18n/locale'
import { localizeAvailableHref } from './i18n/route'
import { translate } from './i18n/messages'
import type { Platform } from './provider-home/types'

export function installProviderHomeStreamMapEntry(platform: Platform, locale: Locale = 'en'): void {
  if (platform !== 'twitch') return

  const href = localizeAvailableHref('/twitch/map/', locale)
  const directory = document.querySelector<HTMLElement>('.feature-directory')
  if (!directory || directory.querySelector(`a[href="${href}"]`)) return

  const link = document.createElement('a')
  link.className = 'feature-item'
  link.href = href
  link.dataset.providerHomeStreamMap = 'twitch'

  const number = document.createElement('span')
  number.className = 'num'
  number.textContent = '05 · WHERE'

  const title = document.createElement('h3')
  title.textContent = translate(locale, 'feature.streamMap')

  const copy = document.createElement('p')
  copy.textContent = translate(locale, 'map.twitchHomeCopy')

  const fact = document.createElement('div')
  fact.className = 'feature-item__fact'
  fact.textContent = translate(locale, 'map.countryCityEvidence')

  link.append(number, title, copy, fact)
  directory.append(link)
}
