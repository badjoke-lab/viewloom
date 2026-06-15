import './provider-home.css'
import { mountProviderHome } from './provider-home-shell'
import type { Platform } from './provider-home/types'

const platform = document.body.dataset.provider as Platform | undefined
if (platform === 'twitch' || platform === 'kick') {
  mountProviderHome(platform)
  const menu = document.querySelector('[data-mobile-menu]')
  menu?.addEventListener('click', () => {
    const nav = document.querySelector<HTMLElement>('.global-nav')
    if (!nav) return
    nav.classList.toggle('is-open')
  })
  void import('./provider-home-data')
}
