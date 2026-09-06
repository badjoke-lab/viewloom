const TWITCH_STREAM_MAP_HREF = '/twitch/map/'

export function installTwitchStreamMapFeatureTab(): void {
  if (document.body.dataset.provider !== 'twitch') return

  document.querySelectorAll<HTMLElement>('.feature-tabs').forEach((tabs) => {
    let link = tabs.querySelector<HTMLAnchorElement>(`a[href="${TWITCH_STREAM_MAP_HREF}"]`)

    if (!link) {
      link = document.createElement('a')
      link.href = TWITCH_STREAM_MAP_HREF
      link.textContent = 'Stream Map'

      const statusLink = tabs.querySelector<HTMLAnchorElement>('a[href="/twitch/status/"]')
      if (statusLink) tabs.insertBefore(link, statusLink)
      else tabs.append(link)
    }

    link.dataset.twitchStreamMapFeatureTab = 'true'
    if (normalizePath(window.location.pathname) === TWITCH_STREAM_MAP_HREF) {
      link.classList.add('active')
      link.setAttribute('aria-current', 'page')
    }
  })
}

function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '')
  return clean ? `${clean}/` : '/'
}
