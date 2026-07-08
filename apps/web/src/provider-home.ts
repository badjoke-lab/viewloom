import './provider-home.css'
import './provider-watchlist-link.css'
import './provider-home-mobile-boundary.css'
import { mountProviderHome } from './provider-home-shell'
import { installSharedShell, setSharedShellStatus, syncSharedShellStatus } from './shared-shell'
import type { Platform } from './provider-home/types'

const platform = document.body.dataset.provider as Platform | undefined

if (platform === 'twitch' || platform === 'kick') {
  mountProviderHome(platform)
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
    if (state) state.textContent = 'Fresh'
    const age = document.getElementById('home-updated')?.textContent || 'Updated'
    setSharedShellStatus(status, `Fresh · ${age}`, 'fresh')
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
