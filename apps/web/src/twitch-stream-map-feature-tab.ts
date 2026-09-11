import './twitch-stream-map-feature-tab.css'
import { localeFromPathname } from './i18n/locale'
import { localizeAvailableHref } from './i18n/route'

const TWITCH_STREAM_MAP_HREF = '/twitch/map/'
const TWITCH_STATUS_HREF = '/twitch/status/'

export function installTwitchStreamMapFeatureTab(): void {
  if (document.body.dataset.provider !== 'twitch') return

  const locale = localeFromPathname(window.location.pathname)
  const streamMapHref = localizeAvailableHref(TWITCH_STREAM_MAP_HREF, locale)
  const statusHref = localizeAvailableHref(TWITCH_STATUS_HREF, locale)

  document.querySelectorAll<HTMLElement>('.feature-tabs').forEach((tabs) => {
    let link = tabs.querySelector<HTMLAnchorElement>(`a[href="${streamMapHref}"]`)

    if (!link) {
      link = document.createElement('a')
      link.href = streamMapHref
      link.textContent = 'Stream Map'

      const statusLink = tabs.querySelector<HTMLAnchorElement>(`a[href="${statusHref}"]`)
        ?? tabs.querySelector<HTMLAnchorElement>(`a[href="${TWITCH_STATUS_HREF}"]`)
      if (statusLink) tabs.insertBefore(link, statusLink)
      else tabs.append(link)
    }

    link.dataset.twitchStreamMapFeatureTab = 'true'
    if (normalizePath(window.location.pathname) === normalizePath(streamMapHref)) {
      link.classList.add('active')
      link.setAttribute('aria-current', 'page')
    }
  })
}

function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '')
  return clean ? `${clean}/` : '/'
}
