import {
  createHeatmapViewport,
  type HeatmapViewportHandle,
} from './heatmap-viewport-v2'
import {
  renderCanvasScene,
  shouldUseCanvasRenderer,
} from '../features/twitch-heatmap/canvas-scene'
import {
  escapeHtml,
  formatIso,
  formatPercent,
  formatSignedPercent,
} from '../features/twitch-heatmap/format'
import { buildTreemap, getDensity } from '../features/twitch-heatmap/layout'
import {
  AUTO_REFRESH_MS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type HeatmapItem,
  type TileLayout,
  type TwitchHeatmapApiResponse,
  type TwitchHeatmapPayload,
} from '../features/twitch-heatmap/model'

let viewportHandle: HeatmapViewportHandle | null = null
let selectedStreamLogin: string | null = null
let refreshTimer: number | null = null
let visibilityListenerBound = false

const HEATMAP_CSS = `
.chart-placeholder--heatmap.heatmap-live-stage {
  min-height: 560px;
  padding: 0;
  background: linear-gradient(180deg, rgba(7, 16, 30, 0.98), rgba(9, 18, 33, 0.92));
}
.heatmap-live-shell {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 560px;
  height: 100%;
}
.heatmap-live-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
}
.heatmap-live-toolbar__hint {
  color: var(--muted);
  font-size: 0.9rem;
}
.heatmap-live-toolbar__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.84rem;
}
.heatmap-live-toolbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.heatmap-live-toolbar__zoom {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 64px;
  height: 38px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  font-weight: 700;
}
.heatmap-live-toolbar__button {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  cursor: pointer;
}
.heatmap-live-toolbar__button:hover {
  background: rgba(255, 255, 255, 0.1);
}
.heatmap-live-viewport {
  position: relative;
  overflow: hidden;
  min-height: 500px;
  touch-action: none;
  cursor: grab;
  user-select: none;
}
.heatmap-live-viewport.is-panning {
  cursor: grabbing;
}
.heatmap-live-canvas {
  position: absolute;
  inset: 0 auto auto 0;
  transform-origin: 0 0;
  will-change: transform;
}
.heatmap-live-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  padding: 24px;
  color: var(--muted);
  text-align: center;
}
.heatmap-live-tile {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  border-radius: 22px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.02) inset;
  cursor: pointer;
  transition: box-shadow 160ms ease, border-color 160ms ease;
}
.heatmap-live-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.12), transparent 32%);
  pointer-events: none;
}
.heatmap-live-tile > * {
  position: relative;
}
.heatmap-live-tile:focus-visible,
.heatmap-live-tile.is-selected {
  outline: none;
  border-color: rgba(255, 255, 255, 0.42);
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.28), 0 0 0 1px rgba(255, 255, 255, 0.06) inset, 0 0 0 2px rgba(255, 255, 255, 0.16);
}
.heatmap-live-tile.is-up {
  background: linear-gradient(180deg, rgba(10, 38, 31, 0.98), rgba(8, 22, 20, 0.9));
  border-color: rgba(94, 234, 154, 0.28);
}
.heatmap-live-tile.is-down {
  background: linear-gradient(180deg, rgba(45, 19, 29, 0.98), rgba(25, 12, 18, 0.92));
  border-color: rgba(251, 113, 133, 0.28);
}
.heatmap-live-tile.is-flat {
  background: linear-gradient(180deg, rgba(19, 30, 49, 0.98), rgba(12, 20, 35, 0.92));
  border-color: rgba(148, 163, 184, 0.18);
}
.heatmap-live-tile[data-density='small'] {
  padding: 12px;
  gap: 8px;
}
.heatmap-live-tile__eyebrow {
  color: var(--muted);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.heatmap-live-tile__title {
  margin: 0;
  font-size: 1.16rem;
  line-height: 1.15;
}
.heatmap-live-tile__viewers {
  font-size: 2.15rem;
  line-height: 1;
  font-weight: 800;
}
.heatmap-live-tile__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.9rem;
}
.heatmap-live-tile__activity {
  color: var(--muted);
  font-size: 0.9rem;
}
.heatmap-live-tile[data-density='medium'] .heatmap-live-tile__viewers {
  font-size: 1.65rem;
}
.heatmap-live-tile[data-density='medium'] .heatmap-live-tile__title {
  font-size: 1rem;
}
.heatmap-live-tile[data-density='small'] .heatmap-live-tile__title {
  font-size: 0.92rem;
}
.heatmap-live-tile[data-density='small'] .heatmap-live-tile__viewers,
.heatmap-live-tile[data-density='small'] .heatmap-live-tile__activity {
  display: none;
}
.heatmap-live-tile[data-density='small'] .heatmap-live-tile__meta {
  font-size: 0.82rem;
  gap: 8px;
}
.heatmap-live-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.heatmap-live-detail-stat {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.heatmap-live-detail-stat__label {
  display: block;
  color: var(--muted);
  font-size: 0.76rem;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.heatmap-live-detail-stat__value {
  display: block;
  font-weight: 700;
}
.heatmap-live-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  margin-top: 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
}
.heatmap-live-list {
  margin: 14px 0 0;
  padding-left: 18px;
  color: var(--muted);
}
.heatmap-live-list li + li {
  margin-top: 10px;
}
@media (max-width: 760px) {
  .chart-placeholder--heatmap.heatmap-live-stage,
  .heatmap-live-shell {
    min-height: 420px;
  }
  .heatmap-live-toolbar {
    grid-template-columns: 1fr;
  }
  .heatmap-live-toolbar__actions {
    justify-content: space-between;
  }
  .heatmap-live-viewport,
  .heatmap-live-empty {
    min-height: 360px;
  }
  .heatmap-live-detail-grid {
    grid-template-columns: 1fr;
  }
}
`

export async function hydrateTwitchHeatmap(): Promise<void> {
  ensureStyles()
  ensureLiveSurfaceSlots()
  ensureHeatmapAutoRefresh()

  const stage = document.querySelector<HTMLElement>('.chart-placeholder--heatmap')
  if (!stage) return

  stage.classList.add('heatmap-live-stage')
  viewportHandle?.destroy()
  viewportHandle = null
  stage.innerHTML = renderLoadingShell()
  renderPendingSurfaceState()

  try {
    const response = await fetch('/api/twitch-heatmap')
    if (!response.ok) throw new Error(`API ${response.status}`)

    const data = (await response.json()) as TwitchHeatmapApiResponse
    if (!data.latest) {
      stage.innerHTML = renderEmptyShell('No Twitch snapshots yet.')
      renderUnavailableSurfaceState('No snapshot yet', 'D1 is connected, but there is no latest snapshot to read yet.')
      return
    }

    const payload = JSON.parse(data.latest.payload_json) as TwitchHeatmapPayload
    const items = [...(payload.items ?? [])].sort((a, b) => b.viewers - a.viewers)
    if (!items.length) {
      stage.innerHTML = renderEmptyShell('Snapshot exists, but payload items are empty.')
      renderUnavailableSurfaceState('Empty payload', 'The latest snapshot exists, but it contains no live items.')
      return
    }

    if (shouldUseCanvasRenderer()) {
      renderCanvasScene({
        stage,
        items,
        latest: data.latest,
        selectedStreamLogin,
        onSelect: (item) => {
          selectedStreamLogin = item.channelLogin
          updateSelectedStreamDetail(item, data.latest, data.status)
        },
      })
      populateLiveSurface(items, data.latest, data.status)
      const initial = items.find((item) => item.channelLogin === selectedStreamLogin) ?? items[0]
      if (initial) {
        selectedStreamLogin = initial.channelLogin
        updateSelectedStreamDetail(initial, data.latest, data.status)
      }
      return
    }

    const layouts = buildTreemap(items, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    stage.innerHTML = renderHeatmapShell({
      latest: data.latest,
      status: data.status,
      layouts,
    })

    const viewport = stage.querySelector<HTMLElement>('#heatmap-live-viewport')
    const canvas = stage.querySelector<HTMLElement>('#heatmap-live-canvas')
    const zoomLabel = stage.querySelector<HTMLElement>('#heatmap-live-zoom')
    const resetButton = stage.querySelector<HTMLButtonElement>('#heatmap-live-reset')

    if (!viewport || !canvas || !zoomLabel || !resetButton) return

    viewportHandle = createHeatmapViewport({
      viewport,
      canvas,
      zoomLabel,
      resetButton,
    })

    bindSelection(canvas, items, data.latest, data.status)
    populateLiveSurface(items, data.latest, data.status)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    stage.innerHTML = renderEmptyShell(`Failed to load Twitch heatmap API: ${escapeHtml(message)}`)
    renderUnavailableSurfaceState('API error', 'The Heatmap page rendered, but the Twitch heatmap API request failed.')
  }
}

function ensureHeatmapAutoRefresh(): void {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
  }

  refreshTimer = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void hydrateTwitchHeatmap()
    }
  }, AUTO_REFRESH_MS)

  if (visibilityListenerBound) return

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void hydrateTwitchHeatmap()
    }
  })

  visibilityListenerBound = true
}

function ensureLiveSurfaceSlots(): void {
  const summaryGrid = document.querySelector<HTMLElement>('.summary-grid')
  if (summaryGrid && !summaryGrid.querySelector('#heatmap-summary-streams')) {
    summaryGrid.innerHTML = renderLiveSummaryShell()
  }

  const railStack = document.querySelector<HTMLElement>('#heatmap-layout-root .rail-stack')
  if (railStack && !railStack.querySelector('#heatmap-detail-title')) {
    railStack.innerHTML = renderLiveRailShell()
  }

  const supportGrid = document.querySelector<HTMLElement>('#heatmap-layout-root .support-grid--feature')
  if (supportGrid && !supportGrid.querySelector('#heatmap-support-movers')) {
    supportGrid.innerHTML = renderLiveSupportShell()
  }
}

function bindSelection(
  canvas: HTMLElement,
  items: HeatmapItem[],
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>,
  status: TwitchHeatmapApiResponse['status'],
): void {
  const tiles = Array.from(canvas.querySelectorAll<HTMLElement>('[data-stream-login]'))
  const itemMap = new Map(items.map((item) => [item.channelLogin, item]))

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const login = tile.dataset.streamLogin
      if (!login) return
      const item = itemMap.get(login)
      if (!item) return
      setSelectedTile(canvas, item, latest, status)
    })

    tile.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      const login = tile.dataset.streamLogin
      if (!login) return
      const item = itemMap.get(login)
      if (!item) return
      setSelectedTile(canvas, item, latest, status)
    })
  })

  const initial = itemMap.get(selectedStreamLogin ?? '') ?? items[0]
  setSelectedTile(canvas, initial, latest, status)
}

function setSelectedTile(
  canvas: HTMLElement,
  item: HeatmapItem,
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>,
  status: TwitchHeatmapApiResponse['status'],
): void {
  selectedStreamLogin = item.channelLogin

  const tiles = Array.from(canvas.querySelectorAll<HTMLElement>('[data-stream-login]'))
  tiles.forEach((tile) => {
    const selected = tile.dataset.streamLogin === item.channelLogin
    tile.classList.toggle('is-selected', selected)
    tile.setAttribute('aria-pressed', selected ? 'true' : 'false')
  })

  updateSelectedStreamDetail(item, latest, status)
}

function populateLiveSurface(
  items: HeatmapItem[],
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>,
  status: TwitchHeatmapApiResponse['status'],
): void {
  const strongestMomentum = [...items].sort((a, b) => b.momentum - a.momentum)[0] ?? items[0]
  const highestActivity = [...items].sort((a, b) => b.activity - a.activity)[0] ?? items[0]
  const movers = [...items].sort((a, b) => b.momentum - a.momentum).slice(0, 3)
  const activityLeaders = [...items].sort((a, b) => b.activity - a.activity).slice(0, 3)

  setText('#heatmap-summary-streams .summary-card__value', String(items.length))
  setText(
    '#heatmap-summary-streams p',
    `${latest.stream_count.toLocaleString()} observed live streams in the latest Twitch snapshot.`,
  )
  setText('#heatmap-summary-viewers .summary-card__value', latest.total_viewers.toLocaleString())
  setText(
    '#heatmap-summary-viewers p',
    `${latest.covered_pages} page${latest.covered_pages === 1 ? '' : 's'} covered${latest.has_more ? ' with more available' : ''}.`,
  )
  setText('#heatmap-summary-momentum .summary-card__value', strongestMomentum.displayName)
  setText(
    '#heatmap-summary-momentum p',
    `${formatSignedPercent(strongestMomentum.momentum)} momentum · ${strongestMomentum.viewers.toLocaleString()} viewers right now.`,
  )
  setText('#heatmap-summary-activity .summary-card__value', highestActivity.displayName)
  setText(
    '#heatmap-summary-activity p',
    `${formatPercent(highestActivity.activity)} activity signal · source ${latest.source_mode}.`,
  )

  setText('#heatmap-status-title', `${status?.status ?? 'unknown'} · ${latest.source_mode}`)
  setText(
    '#heatmap-status-body',
    `${formatIso(latest.collected_at)} · ${latest.total_viewers.toLocaleString()} viewers · ${items.length} visible streams.`,
  )
  setText('#heatmap-hero-status-title', `${status?.status ?? 'unknown'} · ${latest.source_mode}`)
  setText(
    '#heatmap-hero-status-body',
    `${formatIso(latest.collected_at)} · ${latest.total_viewers.toLocaleString()} viewers · ${items.length} streams · ${latest.covered_pages} page${latest.covered_pages === 1 ? '' : 's'} covered${latest.has_more ? ' · more available' : ''}.`,
  )

  setHtml(
    '#heatmap-legend-body',
    'Area tracks viewers. Tile color tracks momentum. Glow strength reflects activity signal when available.',
  )

  setHtml('#heatmap-support-movers', renderList(movers, (item) => `${escapeHtml(item.displayName)} · ${formatSignedPercent(item.momentum)} momentum`))
  setHtml('#heatmap-support-activity', renderList(activityLeaders, (item) => `${escapeHtml(item.displayName)} · ${formatPercent(item.activity)} activity`))
  setHtml(
    '#heatmap-support-coverage',
    renderList(
      [
        `${latest.covered_pages} page${latest.covered_pages === 1 ? '' : 's'} covered`,
        latest.has_more ? 'More pages remain outside current hot snapshot' : 'Current hot snapshot exhausted visible pages',
        `Latest bucket ${escapeHtml(latest.bucket_minute)}`,
      ],
      (text) => text,
    ),
  )
}

function updateSelectedStreamDetail(
  item: HeatmapItem,
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>,
  status: TwitchHeatmapApiResponse['status'],
): void {
  const share = latest.total_viewers > 0 ? item.viewers / latest.total_viewers : 0

  setText('#heatmap-detail-title', item.displayName)
  setText(
    '#heatmap-detail-body',
    `${item.channelLogin} is selected. Read its current audience, momentum, and activity without leaving the heat field.`,
  )
  setText('#heatmap-detail-viewers', item.viewers.toLocaleString())
  setText('#heatmap-detail-share', `${(share * 100).toFixed(1)}%`)
  setText('#heatmap-detail-momentum', formatSignedPercent(item.momentum))
  setText('#heatmap-detail-activity', formatPercent(item.activity))

  const link = document.querySelector<HTMLAnchorElement>('#heatmap-detail-link')
  if (link) {
    link.href = `https://www.twitch.tv/${encodeURIComponent(item.channelLogin)}`
    link.textContent = `Open ${item.displayName}`
  }

  // keep live status tied to the snapshot, not the currently selected tile
}

function renderLoadingShell(): string {
  return `
    <div class="heatmap-live-shell">
      <div class="heatmap-live-toolbar">
        <div>
          <div class="heatmap-live-toolbar__hint">Preparing Twitch heat field…</div>
        </div>
        <div class="heatmap-live-toolbar__actions">
          <span class="heatmap-live-toolbar__zoom">100%</span>
          <button class="heatmap-live-toolbar__button" type="button" disabled>Reset zoom</button>
        </div>
      </div>
      <div class="heatmap-live-empty">Loading Twitch heatmap snapshot…</div>
    </div>
  `
}

function renderEmptyShell(message: string): string {
  return `
    <div class="heatmap-live-shell">
      <div class="heatmap-live-toolbar">
        <div>
          <div class="heatmap-live-toolbar__hint">Scroll to zoom · drag to pan · reset to fit</div>
        </div>
        <div class="heatmap-live-toolbar__actions">
          <span class="heatmap-live-toolbar__zoom">100%</span>
          <button class="heatmap-live-toolbar__button" type="button" disabled>Reset zoom</button>
        </div>
      </div>
      <div class="heatmap-live-empty">${message}</div>
    </div>
  `
}

function renderHeatmapShell(input: {
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>
  status: TwitchHeatmapApiResponse['status']
  layouts: TileLayout[]
}): string {
  const { latest, status, layouts } = input

  return `
    <div class="heatmap-live-shell">
      <div class="heatmap-live-toolbar">
        <div>
          <div class="heatmap-live-toolbar__hint">Scroll to zoom · double-click to drill in · Shift + double-click to step out</div>
          <div class="heatmap-live-toolbar__stats">
            <span>${latest.total_viewers.toLocaleString()} viewers</span>
            <span>${layouts.length} streams</span>
            <span>${status?.status ?? 'unknown'} · ${escapeHtml(latest.source_mode)}</span>
            <span>${escapeHtml(formatIso(latest.collected_at))}</span>
          </div>
        </div>
        <div class="heatmap-live-toolbar__actions">
          <span id="heatmap-live-zoom" class="heatmap-live-toolbar__zoom">100%</span>
          <button id="heatmap-live-reset" class="heatmap-live-toolbar__button" type="button">Reset zoom</button>
        </div>
      </div>
      <div id="heatmap-live-viewport" class="heatmap-live-viewport">
        <div
          id="heatmap-live-canvas"
          class="heatmap-live-canvas"
          data-canvas-width="${CANVAS_WIDTH}"
          data-canvas-height="${CANVAS_HEIGHT}"
          style="width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px"
        >
          ${layouts.map((layout) => renderTile(layout, latest.total_viewers)).join('')}
        </div>
      </div>
    </div>
  `
}

function renderTile(layout: TileLayout, totalViewers: number): string {
  const share = totalViewers > 0 ? (layout.viewers / totalViewers) * 100 : 0
  const momentumClass = layout.momentum > 0.02 ? 'is-up' : layout.momentum < -0.02 ? 'is-down' : 'is-flat'
  const momentumValue = `${layout.momentum > 0 ? '+' : ''}${(layout.momentum * 100).toFixed(1)}%`
  const activityValue = `${(layout.activity * 100).toFixed(1)}% activity`
  const density = getDensity(layout.width, layout.height)
  const haloAlpha = Math.min(0.32, 0.06 + layout.activity * 1.9)
  const haloColor = layout.momentum > 0.02 ? `rgba(74, 222, 128, ${haloAlpha})` : layout.momentum < -0.02 ? `rgba(251, 113, 133, ${haloAlpha})` : `rgba(148, 163, 184, ${haloAlpha * 0.8})`

  return `
    <article
      class="heatmap-live-tile ${momentumClass}"
      data-density="${density}"
      data-stream-login="${escapeHtml(layout.channelLogin)}"
      tabindex="0"
      role="button"
      aria-pressed="false"
      aria-label="${escapeHtml(layout.displayName)} ${layout.viewers.toLocaleString()} viewers"
      style="left:${layout.x}px;top:${layout.y}px;width:${layout.width}px;height:${layout.height}px;box-shadow:0 18px 48px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 ${16 + layout.activity * 46}px ${haloColor};"
    >
      <div>
        <div class="heatmap-live-tile__eyebrow">${escapeHtml(layout.channelLogin)}</div>
        <h3 class="heatmap-live-tile__title">${escapeHtml(layout.displayName)}</h3>
      </div>
      <div>
        <div class="heatmap-live-tile__viewers">${layout.viewers.toLocaleString()}</div>
        <div class="heatmap-live-tile__meta">
          <span>${share.toFixed(1)}% share</span>
          <span>${momentumValue}</span>
        </div>
        <div class="heatmap-live-tile__activity">${activityValue}</div>
      </div>
    </article>
  `
}

function renderPendingSurfaceState(): void {
  setText('#heatmap-status-title', 'Waiting for heatmap API')
  setText('#heatmap-status-body', 'The rail and support blocks will switch to live Twitch values once the latest snapshot loads.')
  setText('#heatmap-hero-status-title', 'Waiting for live heatmap API')
  setText('#heatmap-hero-status-body', 'The hero panel will switch to the latest Twitch snapshot once the heatmap API responds.')
  setText('#heatmap-detail-title', 'No stream selected')
  setText('#heatmap-detail-body', 'Select a tile to inspect its current viewers, momentum, activity, and stream link.')
  setText('#heatmap-detail-viewers', '—')
  setText('#heatmap-detail-share', '—')
  setText('#heatmap-detail-momentum', '—')
  setText('#heatmap-detail-activity', '—')
  setText('#heatmap-summary-streams .summary-card__value', '—')
  setText('#heatmap-summary-viewers .summary-card__value', '—')
  setText('#heatmap-summary-momentum .summary-card__value', '—')
  setText('#heatmap-summary-activity .summary-card__value', '—')
  setText('#heatmap-summary-streams p', 'Waiting for live Twitch snapshot.')
  setText('#heatmap-summary-viewers p', 'Waiting for live Twitch snapshot.')
  setText('#heatmap-summary-momentum p', 'Waiting for live Twitch snapshot.')
  setText('#heatmap-summary-activity p', 'Waiting for live Twitch snapshot.')
  setHtml('#heatmap-legend-body', 'Area tracks viewers. Tile color tracks momentum. Glow strength reflects activity signal when available.')
  setHtml('#heatmap-support-movers', '<p>Waiting for momentum ranking.</p>')
  setHtml('#heatmap-support-activity', '<p>Waiting for activity ranking.</p>')
  setHtml('#heatmap-support-coverage', '<p>Waiting for coverage note.</p>')

  const link = document.querySelector<HTMLAnchorElement>('#heatmap-detail-link')
  if (link) {
    link.removeAttribute('href')
    link.textContent = 'Open stream'
  }
}

function renderUnavailableSurfaceState(title: string, body: string): void {
  setText('#heatmap-status-title', title)
  setText('#heatmap-status-body', body)
  setText('#heatmap-hero-status-title', title)
  setText('#heatmap-hero-status-body', body)
  setText('#heatmap-detail-title', title)
  setText('#heatmap-detail-body', body)
  setText('#heatmap-detail-viewers', '—')
  setText('#heatmap-detail-share', '—')
  setText('#heatmap-detail-momentum', '—')
  setText('#heatmap-detail-activity', '—')
}

function renderLiveSummaryShell(): string {
  return `
    <article id="heatmap-summary-streams" class="summary-card">
      <div class="summary-card__label">Active streams</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-viewers" class="summary-card">
      <div class="summary-card__label">Total viewers observed</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-momentum" class="summary-card">
      <div class="summary-card__label">Strongest momentum stream</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
    <article id="heatmap-summary-activity" class="summary-card">
      <div class="summary-card__label">Highest activity stream</div>
      <div class="summary-card__value">—</div>
      <p>Waiting for live Twitch snapshot.</p>
    </article>
  `
}

function renderLiveRailShell(): string {
  return `
    <section class="rail-card rail-card--detail">
      <div class="rail-card__label">Selected stream</div>
      <h2 id="heatmap-detail-title">No stream selected</h2>
      <p id="heatmap-detail-body">Select a tile to inspect its current viewers, momentum, activity, and stream link.</p>
      <div class="heatmap-live-detail-grid">
        <div class="heatmap-live-detail-stat">
          <span class="heatmap-live-detail-stat__label">Viewers</span>
          <span id="heatmap-detail-viewers" class="heatmap-live-detail-stat__value">—</span>
        </div>
        <div class="heatmap-live-detail-stat">
          <span class="heatmap-live-detail-stat__label">Share</span>
          <span id="heatmap-detail-share" class="heatmap-live-detail-stat__value">—</span>
        </div>
        <div class="heatmap-live-detail-stat">
          <span class="heatmap-live-detail-stat__label">Momentum</span>
          <span id="heatmap-detail-momentum" class="heatmap-live-detail-stat__value">—</span>
        </div>
        <div class="heatmap-live-detail-stat">
          <span class="heatmap-live-detail-stat__label">Activity</span>
          <span id="heatmap-detail-activity" class="heatmap-live-detail-stat__value">—</span>
        </div>
      </div>
      <a id="heatmap-detail-link" class="heatmap-live-link" target="_blank" rel="noreferrer">Open stream</a>
    </section>

    <section class="rail-card rail-card--detail">
      <div class="rail-card__label">Live status</div>
      <h2 id="heatmap-status-title">Waiting for heatmap API</h2>
      <p id="heatmap-status-body">The rail will switch to live Twitch status once the latest snapshot loads.</p>
    </section>

    <section class="rail-card rail-card--detail">
      <div class="rail-card__label">Legend</div>
      <h2>How to read this field</h2>
      <p id="heatmap-legend-body">Area tracks viewers. Tile color tracks momentum. Glow strength reflects activity signal when available.</p>
    </section>
  `
}

function renderLiveSupportShell(): string {
  return `
    <article class="support-card support-card--live">
      <div class="support-card__label">Momentum ranking</div>
      <h2>Top movers right now</h2>
      <div id="heatmap-support-movers"><p>Waiting for momentum ranking.</p></div>
    </article>
    <article class="support-card support-card--live">
      <div class="support-card__label">Activity ranking</div>
      <h2>Strongest chat signal</h2>
      <div id="heatmap-support-activity"><p>Waiting for activity ranking.</p></div>
    </article>
    <article class="support-card support-card--live">
      <div class="support-card__label">Coverage note</div>
      <h2>Current snapshot scope</h2>
      <div id="heatmap-support-coverage"><p>Waiting for coverage note.</p></div>
    </article>
  `
}

function renderList<T>(items: T[], render: (item: T) => string): string {
  return `<ul class="heatmap-live-list">${items.map((item) => `<li>${render(item)}</li>`).join('')}</ul>`
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) element.textContent = value
}

function setHtml(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) element.innerHTML = value
}

function ensureStyles(): void {
  if (document.getElementById('twitch-heatmap-live-style')) return

  const style = document.createElement('style')
  style.id = 'twitch-heatmap-live-style'
  style.textContent = HEATMAP_CSS
  document.head.appendChild(style)
}
