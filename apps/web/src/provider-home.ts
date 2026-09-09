import './provider-home.css'
import './provider-watchlist-link.css'
import './provider-home-mobile-boundary.css'
import { localeFromPathname } from './i18n/locale'
import { providerHomeText } from './i18n/provider-home'
import { mountProviderHome } from './provider-home-shell'
import { installProviderHomeStreamMapEntry } from './provider-home-stream-map-entry'
import { installSharedShell, setSharedShellStatus, syncSharedShellStatus } from './shared-shell'
import type { Platform } from './provider-home/types'

const platform = document.body.dataset.provider as Platform | undefined
const locale = localeFromPathname(window.location.pathname)
const t = (key: Parameters<typeof providerHomeText>[1], params: Record<string, string | number> = {}) => providerHomeText(locale, key, params)

if (platform === 'twitch' || platform === 'kick') {
  mountProviderHome(platform, locale)
  installProviderHomeStreamMapEntry(platform, locale)
  installSharedShell()

  const observer = new MutationObserver(syncPresentation)
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-home-state'] })
  void import('./provider-home-data').then(() => requestAnimationFrame(syncPresentation))
}

function syncPresentation(): void {
  const status = document.querySelector<HTMLElement>('.status-inline')
  if (platform === 'twitch' && document.body.dataset.homeState === 'partial') {
    document.body.dataset.homeState = 'fresh'
    const state = document.getElementById('home-state')
    if (state) state.textContent = t('state.fresh')
    const age = document.getElementById('home-updated')?.textContent || t('fact.updated')
    setSharedShellStatus(status, `${t('state.fresh')} · ${age}`, 'fresh')
  } else {
    syncSharedShellStatus(status)
  }

  for (const id of ['home-meter-peak', 'home-meter-current']) {
    const fill = document.getElementById(id)
    const track = fill?.parentElement
    if (!fill || !track) continue
    track.setAttribute('aria-valuenow', String(Math.round(Number.parseFloat(fill.style.width) || 0)))
  }

  for (let index = 0; index < 7; index += 1) {
    const item = document.getElementById(`home-trend-${index}`)
    if (!item || item.hidden) continue
    if (item.title) item.setAttribute('aria-label', item.title)
  }
}