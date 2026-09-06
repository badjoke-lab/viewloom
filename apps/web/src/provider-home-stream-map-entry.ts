import type { Platform } from './provider-home/types'

const TWITCH_STREAM_MAP_HREF = '/twitch/map/'

export function installProviderHomeStreamMapEntry(platform: Platform): void {
  if (platform !== 'twitch') return

  const directory = document.querySelector<HTMLElement>('.feature-directory')
  if (!directory || directory.querySelector(`a[href="${TWITCH_STREAM_MAP_HREF}"]`)) return

  const link = document.createElement('a')
  link.className = 'feature-item'
  link.href = TWITCH_STREAM_MAP_HREF
  link.dataset.providerHomeStreamMap = 'twitch'

  const number = document.createElement('span')
  number.className = 'num'
  number.textContent = '05 · WHERE'

  const title = document.createElement('h3')
  title.textContent = 'Stream Map'

  const copy = document.createElement('p')
  copy.textContent = 'Explore accepted Country and City geography for the current observed Twitch population.'

  const fact = document.createElement('div')
  fact.className = 'feature-item__fact'
  fact.textContent = 'Country + City · evidence-backed'

  link.append(number, title, copy, fact)
  directory.append(link)
}
