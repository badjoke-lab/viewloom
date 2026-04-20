type TwitchHeatmapApiResponse = {
  ok: boolean
  provider: string
  latest: {
    provider: string
    bucket_minute: string
    collected_at: string
    covered_pages: number
    has_more: number
    stream_count: number
    total_viewers: number
    payload_json: string
    source_mode: string
  } | null
  status: {
    provider: string
    status: string
    last_attempt_at: string | null
    last_success_at: string | null
    last_failure_at: string | null
    last_error: string | null
    latest_bucket_minute: string | null
    latest_collected_at: string | null
    latest_stream_count: number
    latest_total_viewers: number
    covered_pages: number
    has_more: number
    updated_at: string
  } | null
}

type TwitchHeatmapPayload = {
  provider: string
  bucketMinute: string
  items: Array<{
    channelLogin: string
    displayName: string
    viewers: number
    momentum: number
    activity: number
  }>
}

export async function hydrateTwitchHeatmap(): Promise<void> {
  const stage = document.querySelector<HTMLElement>('.chart-placeholder--heatmap')
  if (!stage) return

  stage.style.minHeight = '360px'
  stage.style.display = 'grid'
  stage.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'
  stage.style.gap = '14px'
  stage.style.padding = '18px'
  stage.innerHTML = '<div style="grid-column:1 / -1; color: var(--muted);">Loading Twitch heatmap snapshot…</div>'

  try {
    const response = await fetch('/api/twitch-heatmap')
    if (!response.ok) throw new Error(`API ${response.status}`)

    const data = (await response.json()) as TwitchHeatmapApiResponse
    if (!data.latest) {
      stage.innerHTML = '<div style="grid-column:1 / -1; color: var(--muted);">No Twitch snapshots yet.</div>'
      return
    }

    const payload = JSON.parse(data.latest.payload_json) as TwitchHeatmapPayload
    const items = payload.items ?? []
    if (!items.length) {
      stage.innerHTML = '<div style="grid-column:1 / -1; color: var(--muted);">Snapshot exists, but payload items are empty.</div>'
      return
    }

    const total = data.latest.total_viewers || 0

    stage.innerHTML = items
      .map((item) => {
        const share = total > 0 ? ((item.viewers / total) * 100).toFixed(1) : '0.0'
        const momentum = `${item.momentum > 0 ? '+' : ''}${(item.momentum * 100).toFixed(1)}%`
        const activity = `${(item.activity * 100).toFixed(1)}% activity`
        const border =
          item.momentum > 0.02
            ? 'rgba(120,255,180,0.35)'
            : item.momentum < -0.02
              ? 'rgba(255,120,160,0.35)'
              : 'rgba(255,255,255,0.10)'

        return `
          <article style="
            min-height: 180px;
            border-radius: 20px;
            padding: 18px;
            border: 1px solid ${border};
            background: linear-gradient(180deg, rgba(18,28,48,0.95), rgba(11,19,34,0.92));
            box-shadow: 0 18px 48px rgba(0,0,0,0.25);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          ">
            <div>
              <div style="font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);">
                ${escapeHtml(item.channelLogin)}
              </div>
              <div style="margin-top: 10px; font-size: 1.2rem; font-weight: 700; line-height: 1.2;">
                ${escapeHtml(item.displayName)}
              </div>
            </div>
            <div>
              <div style="font-size: 2rem; font-weight: 800; line-height: 1;">${item.viewers.toLocaleString()}</div>
              <div style="margin-top: 8px; display: flex; gap: 10px; flex-wrap: wrap; color: var(--muted); font-size: 0.9rem;">
                <span>${share}% share</span>
                <span>${momentum}</span>
              </div>
              <div style="margin-top: 8px; color: var(--muted); font-size: 0.9rem;">${activity}</div>
            </div>
          </article>
        `
      })
      .join('')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    stage.innerHTML = `<div style="grid-column:1 / -1; color: var(--muted);">Failed to load Twitch heatmap API: ${escapeHtml(message)}</div>`
  }
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
