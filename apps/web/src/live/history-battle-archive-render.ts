import { buildDeepLink } from '../navigation/deep-link-contract'
import type { HistoryBattleArchiveEntry, HistoryBattleArchiveMeta } from './history-battle-archive-state'

let expanded = false

export function renderBattleArchive(entries: HistoryBattleArchiveEntry[], meta?: HistoryBattleArchiveMeta): void {
  const mount = ensureMount()
  const list = mount.querySelector<HTMLElement>('[data-history-battle-list]')
  const toggle = mount.querySelector<HTMLButtonElement>('[data-history-battle-toggle]')
  const summary = mount.querySelector<HTMLElement>('[data-history-battle-summary]')
  if (!list || !toggle || !summary) return

  if (!entries.length) {
    summary.textContent = meta?.state === 'unavailable'
      ? 'Battle event history is temporarily unavailable.'
      : 'No completed observed battle events are available for this period.'
    list.innerHTML = `<div class="notice">${escapeHtml(summary.textContent)}</div>`
    toggle.hidden = true
    return
  }

  const reversalCount = entries.filter((entry) => entry.type === 'reversal').length
  const days = new Set(entries.map((entry) => entry.day).filter(Boolean)).size
  summary.textContent = `${entries.length} observed battle events · ${reversalCount} reversals · ${days} completed days`
  const visible = expanded ? entries : entries.slice(0, 10)
  list.innerHTML = visible.map(battleCard).join('')
  toggle.hidden = entries.length <= 10
  toggle.textContent = expanded ? 'Show top 10' : `Show all ${entries.length}`
  toggle.setAttribute('aria-expanded', String(expanded))
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-battle-archive]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-battle-events-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Battle archive</h2><span>Completed observed days</span></div>
    <section class="surface history-battle-events" data-history-battle-archive>
      <div class="surface__head"><strong>Reversals, close battles, and challengers</strong><small data-history-battle-summary>Loading battle events…</small></div>
      <div class="history-battle-events__grid" data-history-battle-list><div class="notice">Loading battle events…</div></div>
      <div class="history-battle-events__actions"><button class="button button--paper" type="button" data-history-battle-toggle hidden>Show all</button></div>
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

function battleCard(entry: HistoryBattleArchiveEntry): string {
  const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const day = validDay(entry.day) ? entry.day : ''
  const timestamp = validTimestamp(entry.timestamp, day) ? new Date(entry.timestamp as string).toISOString() : null
  const battle = entry.streamerAId && entry.streamerBId ? `${entry.streamerAId}:${entry.streamerBId}` : undefined
  const href = buildDeepLink(`/${provider}/battle-lines/`, 'battleLines', {
    metric: 'viewers',
    top: 5,
    bucket: '5m',
    range: 'date',
    date: day,
    battle,
    time: timestamp,
  })
  const coverage = safeClass(entry.coverageState ?? 'partial')
  return `
    <article class="history-battle-event" data-history-battle-event="${escapeHtml(entry.id ?? '')}">
      <div class="history-battle-event__head">
        <span class="rank">#${Number(entry.rank) || '—'}</span>
        <time>${escapeHtml(formatTimestamp(timestamp, day))}</time>
        <span class="history-badge history-badge--${coverage}">${escapeHtml(humanLabel(entry.coverageState ?? 'partial'))}</span>
      </div>
      <div class="history-battle-event__type">${escapeHtml(eventLabel(entry.type))}</div>
      <strong class="history-battle-event__pair">${escapeHtml(entry.streamerA ?? 'Unavailable')} <span>vs</span> ${escapeHtml(entry.streamerB ?? 'Unavailable')}</strong>
      <p class="history-battle-event__title">${escapeHtml(entry.title ?? 'Observed battle event')}</p>
      <p class="history-battle-event__summary">${escapeHtml(entry.summary ?? 'No additional event detail is available.')}</p>
      <dl>
        <div><dt>Battle score</dt><dd>${formatNumber(entry.score)}</dd></div>
        <div><dt>Reversals</dt><dd>${formatNumber(entry.reversalCount)}</dd></div>
        <div><dt>Gap before</dt><dd>${formatNumber(entry.gapBefore)}</dd></div>
        <div><dt>Gap after</dt><dd>${formatNumber(entry.gapAfter)}</dd></div>
      </dl>
      <div class="history-battle-event__actions"><a href="${escapeHtml(href)}">Open Battle Lines</a></div>
    </article>`
}

function eventLabel(value: unknown): string {
  if (value === 'reversal') return 'Major reversal'
  if (value === 'close_battle') return 'Close battle'
  if (value === 'fastest_challenger') return 'Fastest challenger'
  if (value === 'heated_battle') return 'Strongest battle'
  return 'Battle event'
}

function formatTimestamp(timestamp: string | null, day: string): string {
  if (timestamp) {
    return new Intl.DateTimeFormat('en', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
      hour12: false, timeZone: 'UTC',
    }).format(new Date(timestamp)) + ' UTC'
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

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
