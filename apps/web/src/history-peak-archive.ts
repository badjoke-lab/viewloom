type HistoryDay = {
  day: string
  peakViewers: number
  peakStreamerName?: string | null
}

type HistoryPayload = {
  daily: HistoryDay[]
}

const sectionId = 'history-peak-archive'

function buildHistoryQuery(): string {
  const current = new URLSearchParams(window.location.search)
  const query = new URLSearchParams()
  if (current.get('from') && current.get('to')) {
    query.set('from', current.get('from') ?? '')
    query.set('to', current.get('to') ?? '')
  } else {
    query.set('period', current.get('period') === '7d' ? '7d' : '30d')
  }
  query.set('metric', current.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes')
  return query.toString()
}

async function renderPeakArchive(): Promise<void> {
  const selected = document.querySelector<HTMLElement>('#history-selected')
  if (!selected) return

  let section = document.querySelector<HTMLElement>(`#${sectionId}`)
  if (!section) {
    section = document.createElement('section')
    section.id = sectionId
    section.className = 'history-card history-peak-archive'
    selected.insertAdjacentElement('afterend', section)
  }

  section.innerHTML = '<div class="history-empty">Loading peak archive…</div>'

  try {
    const response = await fetch(`/api/history?${buildHistoryQuery()}`, { cache: 'no-store' })
    const payload = await response.json() as HistoryPayload
    const peaks = payload.daily.slice().sort((a, b) => b.peakViewers - a.peakViewers).slice(0, 6)

    if (peaks.length === 0) {
      section.innerHTML = '<div class="history-head"><div><div class="eyebrow">Peaks</div><h2>Peak archive</h2></div></div><div class="history-empty">No peak archive is available for this period.</div>'
      return
    }

    section.innerHTML = `<div class="history-head"><div><div class="eyebrow">Peaks</div><h2>Peak archive</h2></div><span>Top ${peaks.length} daily peaks</span></div><div class="history-peak-list">${peaks.map((day, index) => `<article class="history-peak-card"><button type="button" data-peak-day="${day.day}"><strong>#${index + 1} ${day.day}</strong><span>${format(day.peakViewers)} peak viewers</span><small>${escapeHtml(day.peakStreamerName ?? 'unknown peak streamer')}</small></button><div><a href="/twitch/day-flow/?date=${day.day}">Day Flow</a><a href="/twitch/battle-lines/?date=${day.day}">Battle Lines</a></div></article>`).join('')}</div>`

    section.querySelectorAll<HTMLButtonElement>('[data-peak-day]').forEach((button) => {
      button.addEventListener('click', () => {
        const day = button.dataset.peakDay
        const target = day ? document.querySelector<HTMLButtonElement>(`[data-day="${day}"], [data-select-day="${day}"]`) : null
        if (target) target.click()
      })
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Peak archive request failed.'
    section.innerHTML = `<div class="history-head"><div><div class="eyebrow">Peaks</div><h2>Peak archive</h2></div></div><div class="history-empty">${escapeHtml(message)}</div>`
  }
}

function schedulePeakRefresh(): void {
  window.setTimeout(() => void renderPeakArchive(), 80)
  window.setTimeout(() => void renderPeakArchive(), 500)
}

function format(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

function escapeHtml(value: string): string {
  const node = document.createElement('span')
  node.textContent = value
  return node.innerHTML
}

void renderPeakArchive()
document.addEventListener('click', (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest('[data-period], [data-metric], #history-apply') : null
  if (target) schedulePeakRefresh()
})
window.addEventListener('popstate', schedulePeakRefresh)
