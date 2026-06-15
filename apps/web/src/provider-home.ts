import './provider-home.css'
import { mountProviderHome } from './provider-home-shell'
import type { Platform } from './provider-home/types'

const platform = document.body.dataset.provider as Platform | undefined

if (platform === 'twitch' || platform === 'kick') {
  mountProviderHome(platform)
  finalizeProviderHome(platform)

  const menu = document.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  menu?.addEventListener('click', () => {
    const nav = document.querySelector<HTMLElement>('.global-nav')
    if (!nav) return
    const open = nav.classList.toggle('is-open')
    menu.setAttribute('aria-expanded', String(open))
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation')
  })

  const observer = new MutationObserver(syncAccessibility)
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-home-state'] })
  void import('./provider-home-data').then(() => requestAnimationFrame(syncAccessibility))
}

function finalizeProviderHome(active: Platform): void {
  const name = active === 'twitch' ? 'Twitch' : 'Kick'
  const main = document.querySelector<HTMLElement>('main.provider-home')
  if (!main) return

  const nav = document.querySelector<HTMLElement>('.global-nav')
  const menu = document.querySelector<HTMLButtonElement>('[data-mobile-menu]')
  if (nav) {
    nav.id = 'provider-home-nav'
    nav.setAttribute('aria-label', 'Global navigation')
  }
  if (menu) {
    menu.setAttribute('aria-controls', 'provider-home-nav')
    menu.setAttribute('aria-expanded', 'false')
  }

  const status = document.querySelector<HTMLElement>('.status-inline')
  status?.setAttribute('role', 'status')
  status?.setAttribute('aria-live', 'polite')
  document.querySelector<HTMLElement>('.head-facts')?.setAttribute('aria-live', 'polite')

  const masthead = document.querySelector<HTMLElement>('.masthead__inner')
  if (masthead && !masthead.querySelector('.provider-home-badge')) {
    const badge = node('span', 'provider-home-badge', `Unofficial ${name} data`)
    masthead.insertBefore(badge, menu ?? null)
  }

  const lede = document.querySelector<HTMLElement>('.provider-home .lede')
  if (lede) {
    lede.textContent = active === 'twitch'
      ? 'Read the latest Helix-backed observed window, today’s movement, rivalries, retained trends, and data health without mixing Twitch with another platform.'
      : 'Read the latest candidate-based Kick observation, today’s movement, rivalries, retained trends, and coverage limits without presenting it as Twitch-parity directory coverage.'
  }

  const table = document.querySelector<HTMLTableElement>('.home-table')
  if (table && !table.caption) table.createCaption().textContent = `Top streams in the latest observed ${name} snapshot`

  for (const [id, label] of [
    ['home-meter-peak', 'Observed peak relative to today maximum'],
    ['home-meter-current', 'Current observed viewers relative to today maximum'],
  ] as const) {
    const track = document.getElementById(id)?.parentElement
    if (!track) continue
    track.setAttribute('role', 'progressbar')
    track.setAttribute('aria-label', label)
    track.setAttribute('aria-valuemin', '0')
    track.setAttribute('aria-valuemax', '100')
    track.setAttribute('aria-valuenow', '0')
  }

  const lastSection = [...main.querySelectorAll<HTMLElement>(':scope > section')].at(-1)
  if (!lastSection) return

  const lowerGrid = node('div', 'home-lower-grid')
  lowerGrid.append(providerSignalsSection(active), updatesSection())
  lastSection.insertAdjacentElement('afterend', lowerGrid)

  const coverage = node('aside', 'coverage-note provider-home-note')
  coverage.append(
    node('strong', '', `${name} coverage note`),
    node('span', '', active === 'twitch'
      ? 'Twitch totals describe the configured observed window. More live streams may exist beyond the collection limit, and activity is shown only where sampled observations support it.'
      : 'Kick totals describe observed candidates from the configured registry or seed list. They are not a provider-wide total or a Twitch-parity directory census.'),
  )
  lowerGrid.insertAdjacentElement('afterend', coverage)
}

function providerSignalsSection(active: Platform): HTMLElement {
  const section = node('section')
  const title = node('div', 'rule-title')
  title.append(node('h2', '', 'Latest provider signals'), node('span', '', 'Platform-specific availability and coverage'))

  const surface = node('div', 'surface surface--dark')
  const list = node('ul', 'home-provider-signals')
  const signals = active === 'twitch'
    ? [
        ['Coverage model', 'Observed Top 300 window; additional live streams may exist beyond the configured limit.'],
        ['Source boundary', 'Twitch values are read only from the Twitch Home payload and are never combined with Kick.'],
        ['Activity availability', 'Unavailable activity sampling is not displayed as zero.'],
        ['Reversal availability', 'Latest reversal remains unavailable until a battle-event summary is connected.'],
      ]
    : [
        ['Coverage model', 'Observed Top 100 candidates from the configured registry or seed list.'],
        ['Coverage limitation', 'Kick candidate coverage is not presented as a provider-wide or Twitch-parity directory census.'],
        ['Activity availability', 'Kick activity is unavailable in the Home payload and is not displayed as zero.'],
        ['Source boundary', 'Kick values are read only from the Kick Home payload and are never combined with Twitch.'],
      ]

  for (const [heading, copy] of signals) {
    const item = node('li')
    item.append(node('strong', '', heading), node('span', '', copy))
    list.append(item)
  }
  surface.append(list)
  section.append(title, surface)
  return section
}

function updatesSection(): HTMLElement {
  const section = node('section')
  const title = node('div', 'rule-title')
  title.append(node('h2', '', 'ViewLoom updates'), node('span', '', 'Product changes, separate from provider data'))

  const surface = node('div', 'surface surface--dark')
  const updates = node('div', 'home-updates')
  const records = [
    ['2026-06-15', 'Jun 15', 'Provider Home uses real summary payloads', 'Current, today, and retained trend summaries now come from separate Twitch and Kick Home endpoints.'],
    ['2026-06-15', 'Jun 15', 'Shared briefing layout connected', 'Both provider homes use one UI structure while keeping sources, routes, coverage, and limitations separate.'],
    ['2026-06-15', 'Jun 15', 'Home final QA', 'Mobile hierarchy, metadata, state handling, and accessibility are being closed before Changelog work starts.'],
  ]

  for (const [date, label, heading, copy] of records) {
    const article = node('article')
    const time = node('time', '', label) as HTMLTimeElement
    time.dateTime = date
    article.append(time, node('strong', '', heading), node('p', '', copy))
    updates.append(article)
  }
  surface.append(updates)
  section.append(title, surface)
  return section
}

function syncAccessibility(): void {
  for (const id of ['home-meter-peak', 'home-meter-current']) {
    const fill = document.getElementById(id)
    const track = fill?.parentElement
    if (fill && track) track.setAttribute('aria-valuenow', String(Math.round(Number.parseFloat(fill.style.width) || 0)))
  }
  for (let index = 0; index < 7; index += 1) {
    const item = document.getElementById(`home-trend-${index}`)
    if (!item || item.hidden) continue
    item.setAttribute('role', 'img')
    if (item.title) item.setAttribute('aria-label', item.title)
  }
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text) element.textContent = text
  return element
}
