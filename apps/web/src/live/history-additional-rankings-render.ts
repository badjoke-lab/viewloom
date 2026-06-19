import { channelProfileHref, type ChannelProfileProvider } from '../navigation/channel-profile-link'
import type { RankingSort, RankingStreamer } from './history-additional-rankings-state'

const provider: ChannelProfileProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'

export function renderAdditionalRanking(rows: RankingStreamer[], sort: RankingSort, limit: number): void {
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  const cards = document.querySelector<HTMLElement>('[data-history-streamer-cards]')
  if (!body || !cards) return
  const visible = rows.slice(0, limit)
  if (!visible.length) {
    const message = sort === 'rising'
      ? 'No comparable positive risers are available for this period.'
      : sort === 'avg_viewers'
        ? 'No streamers meet the minimum observed-time baseline for average viewers.'
        : 'No retained streamer ranking is available yet.'
    body.innerHTML = `<tr><td colspan="7">${escapeHtml(message)}</td></tr>`
    cards.innerHTML = `<div class="notice">${escapeHtml(message)}</div>`
    return
  }
  body.innerHTML = visible.map((streamer, index) => rowHtml(streamer, index)).join('')
  cards.innerHTML = visible.map((streamer, index) => cardHtml(streamer, index)).join('')
}

function rowHtml(streamer: RankingStreamer, index: number): string {
  return `<tr>
    <td class="rank">${index + 1}</td>
    <td>${streamerName(streamer)}</td>
    <td class="num">${formatNumber(streamer.viewerMinutes)}</td>
    <td class="num">${formatNumber(streamer.peakViewers)}</td>
    <td class="num">${formatNumber(streamer.avgViewers)}</td>
    <td class="num">${formatDuration(streamer.observedMinutes)}</td>
    <td class="num ${changeClass(streamer)}">${escapeHtml(formatChange(streamer))}</td>
  </tr>`
}

function cardHtml(streamer: RankingStreamer, index: number): string {
  return `<article class="history-streamer-card">
    <div class="history-streamer-card__head"><span class="rank">#${index + 1}</span>${streamerName(streamer)}</div>
    <dl>
      <div><dt>Viewer-minutes</dt><dd>${formatNumber(streamer.viewerMinutes)}</dd></div>
      <div><dt>Peak viewers</dt><dd>${formatNumber(streamer.peakViewers)}</dd></div>
      <div><dt>Average viewers</dt><dd>${formatNumber(streamer.avgViewers)}</dd></div>
      <div><dt>Observed time</dt><dd>${formatDuration(streamer.observedMinutes)}</dd></div>
      <div><dt>Change</dt><dd class="${changeClass(streamer)}">${escapeHtml(formatChange(streamer))}</dd></div>
    </dl>
  </article>`
}

function streamerName(streamer: RankingStreamer): string {
  const name = streamer.displayName ?? streamer.streamerId ?? '—'
  const period = new URL(location.href).searchParams.get('period') === '7d' ? '7d' : '30d'
  const href = channelProfileHref(provider, streamer.streamerId, name, period)
  return href
    ? `<a class="history-streamer-profile-link" href="${escapeHtml(href)}"><strong>${escapeHtml(name)}</strong></a>`
    : `<strong>${escapeHtml(name)}</strong>`
}

function formatNumber(value: unknown): string { return Math.round(number(value)).toLocaleString('en-US') }
function formatDuration(value: unknown): string {
  const minutes = Math.round(number(value))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}
function formatChange(streamer: RankingStreamer): string {
  if (streamer.comparisonState === 'new') return 'New'
  if (streamer.comparisonState !== 'comparable' || typeof streamer.changePct !== 'number') return 'Low baseline'
  const percent = Math.round(streamer.changePct * 100)
  return `${percent >= 0 ? '+' : ''}${percent}%`
}
function changeClass(streamer: RankingStreamer): string {
  if (streamer.comparisonState !== 'comparable' || typeof streamer.changePct !== 'number' || streamer.changePct === 0) return 'flat'
  return streamer.changePct > 0 ? 'up' : 'down'
}
function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}
function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
