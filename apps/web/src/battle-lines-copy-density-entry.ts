import './battle-lines-chart-entry'
import './battle-lines-copy-density.css'

const pageSite = document.body.dataset.page?.startsWith('kick') ? 'kick' : 'twitch'
const siteLabel = pageSite === 'kick' ? 'Kick' : 'Twitch'

function polishBattleLinesCopy(): void {
  document.body.classList.add('bl-copy-density')
  polishHero()
  polishChartHead()
  polishStatusNote()
  polishPrimarySummary()
  polishSections()
}

function polishHero(): void {
  const eyebrow = document.querySelector<HTMLElement>('.bl-hero .eyebrow')
  const title = document.querySelector<HTMLElement>('.bl-hero h1')
  const copy = document.querySelector<HTMLElement>('.bl-hero p')
  const icon = document.querySelector<HTMLButtonElement>('.bl-icon')

  if (eyebrow) eyebrow.textContent = `${siteLabel} / Rivalry`
  if (title) title.textContent = 'Rivalry Radar'
  if (copy) copy.textContent = 'Find the closest audience battles, inspect a time, and return to live without losing context.'
  if (icon) icon.setAttribute('aria-label', 'Jump to top')
}

function polishChartHead(): void {
  const title = document.querySelector<HTMLElement>('.bl-chart-head h2')
  const chart = document.querySelector<HTMLElement>('[data-chart]')
  const refresh = document.querySelector<HTMLButtonElement>('[data-refresh]')

  if (title) title.textContent = 'Audience lines'
  if (chart) chart.setAttribute('aria-label', 'Primary battle chart with context lines')
  if (refresh) refresh.setAttribute('aria-label', 'Refresh rivalry data')
}

function polishStatusNote(): void {
  const status = document.querySelector<HTMLElement>('[data-status]')
  if (!status) return

  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')

  const state = status.dataset.state ?? ''
  const meta = status.querySelector('span')
  const message = status.querySelector('small')

  if (meta) {
    meta.textContent = compactMeta(meta.textContent ?? '')
  }

  if (message) {
    message.textContent = statusCopy(state, message.textContent ?? '')
  }
}

function polishPrimarySummary(): void {
  const summary = document.querySelector<HTMLElement>('[data-summary]')
  if (!summary) return

  summary.dataset.copy = 'primary-summary'
  const mode = summary.querySelector('span')
  if (!mode) return

  const current = mode.textContent?.toLowerCase() ?? ''
  if (current.includes('inspect')) mode.textContent = 'Inspecting selected time'
  else if (current.includes('custom')) mode.textContent = 'Custom battle'
  else mode.textContent = 'Recommended battle'
}

function polishSections(): void {
  renameSection('[data-reversals] h2', 'Reversals')
  renameSection('[data-secondary] h2', 'Other battles')
  renameSection('[data-feed] h2', 'Feed')

  document.querySelectorAll<HTMLElement>('.bl-section').forEach((section) => {
    section.dataset.density = 'compact'
  })
}

function renameSection(selector: string, text: string): void {
  const heading = document.querySelector<HTMLElement>(selector)
  if (heading) heading.textContent = text
}

function compactMeta(value: string): string {
  return value
    .replace(/^Api/i, 'API')
    .replace(/\s+·\s+Updated\s+live$/i, '')
    .replace(/\s+·\s+Updated\s+fallback$/i, '')
    .replace(/\s+·\s+/g, ' · ')
    .trim()
}

function statusCopy(state: string, fallback: string): string {
  switch (state) {
    case 'loading':
      return 'Loading the latest rivalry payload.'
    case 'live':
      return 'Real data loaded. Lines are drawn only from observed buckets.'
    case 'partial':
      return 'Partial coverage: observed channels only; missing buckets are visually marked.'
    case 'stale':
      return 'Stale payload: refresh to retry the latest available data.'
    case 'empty':
      return 'No qualifying battle lines for this filter set.'
    case 'error':
      return 'API failed; fallback or retry state is shown clearly.'
    case 'demo':
      return 'Demo fallback. Do not read this as live data.'
    default:
      return fallback
  }
}

const observer = new MutationObserver(() => polishBattleLinesCopy())
observer.observe(document.body, { childList: true, subtree: true })
polishBattleLinesCopy()
