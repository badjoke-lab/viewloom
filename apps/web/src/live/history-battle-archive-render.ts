import type { BattleArchiveEntry } from './history-battle-archive-state'

let expanded = false

export function renderBattleArchive(entries: BattleArchiveEntry[]): void {
  const mount = ensureMount()
  const list = mount.querySelector<HTMLElement>('[data-history-battle-list]')
  const toggle = mount.querySelector<HTMLButtonElement>('[data-history-battle-toggle]')
  const summary = mount.querySelector<HTMLElement>('[data-history-battle-summary]')
  if (!list || !toggle || !summary) return

  if (!entries.length) {
    summary.textContent = 'No completed-day matchup has enough retained aggregate data.'
    list.innerHTML = '<div class="notice">No completed-day matchup has enough retained aggregate data.</div>'
    toggle.hidden = true
    return
  }

  summary.textContent = `${entries.length} completed-day matchups · exact event times unavailable`
  const visible = expanded ? entries : entries.slice(0, 10)
  list.innerHTML = visible.map((entry, index) => battleCard(entry, index)).join('')
  toggle.hidden = entries.length <= 10
  toggle.textContent = expanded ? 'Show top 10' : `Show all ${entries.length}`
  toggle.setAttribute('aria-expanded', String(expanded))

  list.querySelectorAll<HTMLElement>('[data-history-battle-day]').forEach((card) => {
    const choose = (event: Event) => {
      if ((event.target as HTMLElement | null)?.closest('a')) return
      const day = card.dataset.historyBattleDay
      if (!day) return
      const chartDay = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${cssEscape(day)}"]`)
      if (chartDay) {
        chartDay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
        return
      }
      document.querySelector<HTMLElement>(`[data-history-day-card="${cssEscape(day)}"]`)?.click()
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
  const existing = document.querySelector<HTMLElement>('[data-history-battle-archive]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-battle-archive-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Battle archive</h2><span>Closest completed-day matchups</span></div>
    <section class="surface history-battle-archive" data-history-battle-archive>
      <div class="surface__head"><strong>Daily aggregate rivalry candidates</strong><small data-history-battle-summary>Loading matchups…</small></div>
      <p class="history-battle-archive__truth">Built from daily Top Streamers aggregates. ViewLoom does not infer reversals or exact battle times from day-level data.</p>
      <div class="history-battle-archive__grid" data-history-battle-list><div class="notice">Loading matchups…</div></div>
      <div class="history-battle-archive__actions"><button class="button button--paper" type="button" data-history-battle-toggle hidden>Show all</button></div>
    </section>`

  const peakBlock = document.querySelector<HTMLElement>('[data-history-peak-archive]')?.closest<HTMLElement>('.history-peak-events-block')
  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (peakBlock) peakBlock.insertAdjacentElement('afterend', block)
  else if (columns) columns.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)

  const mount = block.querySelector<HTMLElement>('[data-history-battle-archive]')!
  mount.querySelector<HTMLButtonElement>('[data-history-battle-toggle]')?.addEventListener('click', () => {
    expanded = !expanded
    window.dispatchEvent(new CustomEvent('viewloom:battle-archive-toggle'))
  })
  return mount
}

function battleCard(entry: BattleArchiveEntry, index: number): string {
  const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const day = validDay(entry.day) ? entry.day : ''
  const pair = validPair(entry)
  const params = new URLSearchParams()
  if (day) {
    params.set('range', 'date')
    params.set('date', day)
  }
  if (pair) params.set('battle', `${pair[0]}:${pair[1]}`)
  params.sort()
  const query = params.toString()
  const href = `/${provider}/battle-lines/${query ? `?${query}` : ''}`
  const coverage = safeClass(entry.coverageState ?? 'partial')
  const featured = index === 0
  const type = featured ? 'Closest daily matchup' : matchupType(entry.closeness)
  return `
    <article class="history-battle-card${featured ? ' is-featured' : ''}" data-history-battle-day="${escapeHtml(day)}" data-history-battle-type="${escapeHtml(safeClass(type))}"${featured ? ' data-history-battle-featured="true"' : ''} tabindex="0">
      <span class="history-archive-event-type">${escapeHtml(type)}</span>
      <div class="history-battle-card__head">
        <span class="rank">#${Number(entry.rank) || '—'}</span>
        <time>${escapeHtml(formatDate(day))}</time>
        <span class="history-badge history-badge--${coverage}">${escapeHtml(humanLabel(entry.coverageState ?? 'partial'))}</span>
      </div>
      <div class="history-battle-card__pair"><strong>${escapeHtml(entry.streamerAName ?? 'Unavailable')}</strong><span>vs</span><strong>${escapeHtml(entry.streamerBName ?? 'Unavailable')}</strong></div>
      <div class="history-battle-card__score"><strong>${formatScore(entry.score)}</strong><span>daily rivalry score</span></div>
      <dl>
        <div><dt>Closeness</dt><dd>${formatPercent(entry.closeness)}</dd></div>
        <div><dt>Viewer-minute gap</dt><dd>${formatNumber(entry.viewerMinutesGap)}</dd></div>
        <div><dt>Basis</dt><dd>Daily aggregates</dd></div>
        <div><dt>Precision</dt><dd>Day only</dd></div>
      </dl>
      <p class="history-battle-card__note">No reversal or exact event time inferred.</p>
      <div class="history-battle-card__actions"><a href="${escapeHtml(href)}">Open Battle Lines</a></div>
    </article>`
}

function matchupType(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Daily matchup'
  if (value >= 0.9) return 'Very close day'
  if (value >= 0.75) return 'Close day'
  return 'Competitive day'
}

function validPair(entry: BattleArchiveEntry): [string, string] | null {
  const left = entry.streamerAId?.trim() ?? ''
  const right = entry.streamerBId?.trim() ?? ''
  return left && right ? [left, right] : null
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatDate(day: string): string {
  if (!validDay(day)) return 'Unknown day'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T00:00:00.000Z`))
}

function formatScore(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value)}/100` : '—'
}

function formatPercent(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—'
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
