import type { PeakArchiveEntry } from './history-peak-archive-state'

let expanded = false

export function renderPeakArchive(entries: PeakArchiveEntry[]): void {
  const mount = ensureMount()
  const list = mount.querySelector<HTMLElement>('[data-history-peak-list]')
  const toggle = mount.querySelector<HTMLButtonElement>('[data-history-peak-toggle]')
  const summary = mount.querySelector<HTMLElement>('[data-history-peak-summary]')
  if (!list || !toggle || !summary) return

  if (!entries.length) {
    summary.textContent = 'No completed observed peaks are available for this period.'
    list.innerHTML = '<div class="notice">No completed observed peaks are available for this period.</div>'
    toggle.hidden = true
    return
  }

  const exactCount = entries.filter((entry) => validTimestamp(entry.timestamp, entry.day ?? '')).length
  summary.textContent = `${entries.length} completed daily peaks · ${exactCount} exact timestamp${exactCount === 1 ? '' : 's'}`
  const visible = expanded ? entries : entries.slice(0, 10)
  list.innerHTML = visible.map((entry) => peakCard(entry)).join('')
  toggle.hidden = entries.length <= 10
  toggle.textContent = expanded ? 'Show top 10' : `Show all ${entries.length}`
  toggle.setAttribute('aria-expanded', String(expanded))

  list.querySelectorAll<HTMLElement>('[data-history-peak-day]').forEach((card) => {
    const choose = (event: Event) => {
      if ((event.target as HTMLElement | null)?.closest('a')) return
      const day = card.dataset.historyPeakDay
      if (!day) return
      const dayCard = document.querySelector<HTMLElement>(`[data-history-day-card="${cssEscape(day)}"]`)
      if (dayCard) {
        dayCard.click()
        return
      }
      const chartDay = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${cssEscape(day)}"]`)
      chartDay?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
    }
    card.addEventListener('click', choose)
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        choose(event)
      }
    })
  })
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-peak-archive]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-peak-events-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Peak archive</h2><span>Completed observed days</span></div>
    <section class="surface history-peak-events" data-history-peak-archive>
      <div class="surface__head"><strong>Highest observed daily peaks</strong><small data-history-peak-summary>Loading peaks…</small></div>
      <div class="history-peak-events__grid" data-history-peak-list><div class="notice">Loading peaks…</div></div>
      <div class="history-peak-events__actions"><button class="button button--paper" type="button" data-history-peak-toggle hidden>Show all</button></div>
    </section>`

  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (columns) columns.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)

  const mount = block.querySelector<HTMLElement>('[data-history-peak-archive]')!
  mount.querySelector<HTMLButtonElement>('[data-history-peak-toggle]')?.addEventListener('click', () => {
    expanded = !expanded
    window.dispatchEvent(new CustomEvent('viewloom:peak-archive-toggle'))
  })
  return mount
}

function peakCard(entry: PeakArchiveEntry): string {
  const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const day = validDay(entry.day) ? entry.day : ''
  const exact = validTimestamp(entry.timestamp, day)
  const params = new URLSearchParams()
  if (day) params.set('date', day)
  if (exact) params.set('time', new Date(entry.timestamp!).toISOString())
  const query = params.toString()
  const suffix = query ? `?${query}` : ''
  const coverage = safeClass(entry.coverageState ?? 'partial')
  return `
    <article class="history-peak-event" data-history-peak-day="${escapeHtml(day)}" tabindex="0">
      <div class="history-peak-event__head">
        <span class="rank">#${Number(entry.rank) || '—'}</span>
        <time>${escapeHtml(formatTimestamp(entry.timestamp, day))}</time>
        <span class="history-badge history-badge--${coverage}">${escapeHtml(humanLabel(entry.coverageState ?? 'partial'))}</span>
      </div>
      <strong class="history-peak-event__value">${formatNumber(entry.peakViewers)}</strong>
      <span class="history-peak-event__metric">peak viewers</span>
      <dl>
        <div><dt>Streamer</dt><dd>${escapeHtml(entry.streamer ?? 'Unavailable')}</dd></div>
        <div><dt>Category</dt><dd>${escapeHtml(entry.category ?? 'Unavailable')}</dd></div>
        <div><dt>Precision</dt><dd>${exact ? 'Observed minute' : 'Day only'}</dd></div>
      </dl>
      <div class="history-peak-event__actions">
        <a href="/${provider}/day-flow/${suffix}">Day Flow</a>
        <a href="/${provider}/battle-lines/${suffix}">Battle Lines</a>
      </div>
    </article>`
}

function formatTimestamp(timestamp: unknown, day: string): string {
  if (validTimestamp(timestamp, day)) {
    return new Intl.DateTimeFormat('en', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      hour12: false, timeZone: 'UTC',
    }).format(new Date(timestamp as string)) + ' UTC'
  }
  if (!validDay(day)) return 'Unknown day'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T00:00:00.000Z`))
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function validTimestamp(value: unknown, day: string): value is string {
  if (typeof value !== 'string' || !validDay(day)) return false
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}

function formatNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—'
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function safeClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
