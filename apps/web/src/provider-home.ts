import './provider-home.css'
import { mountProviderHome } from './provider-home-shell'
import type { Platform } from './provider-home/types'

const platform = document.body.dataset.provider as Platform | undefined

if (platform === 'twitch' || platform === 'kick') {
  mountProviderHome(platform)
  installMobileNavigation()

  const observer = new MutationObserver(syncAccessibility)
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-home-state'] })
  void import('./provider-home-data').then(() => requestAnimationFrame(syncAccessibility))
}

function installMobileNavigation(): void {
  const menu = document.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  const nav = document.querySelector<HTMLElement>('.global-nav')
  if (!menu || !nav) return

  const setOpen = (open: boolean) => {
    nav.classList.toggle('is-open', open)
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  }

  menu.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')))
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)))
}

function syncAccessibility(): void {
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
