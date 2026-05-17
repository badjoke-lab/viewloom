const pageName = document.body.dataset.page || ''

const apiUrl = pageName === 'kick-heatmap'
  ? '/api/kick-heatmap'
  : pageName === 'kick-day-flow'
    ? '/api/kick-day-flow'
    : pageName === 'kick-battle-lines'
      ? '/api/kick-battle-lines'
      : ''

if (apiUrl) {
  window.setTimeout(() => {
    void readState()
  }, 700)
}

async function readState(): Promise<void> {
  const textNode = document.querySelector<HTMLElement>('[data-kick-api-state]')
  const stripNode = document.querySelector<HTMLElement>('[data-kick-status-strip]')
  if (!textNode || !stripNode) return

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' })
    const data = await response.json() as { state?: string; status?: string; coverageNote?: string; note?: string }
    const state = data.state || data.status || 'unknown'
    const note = data.coverageNote || data.note || 'Kick API state loaded.'
    stripNode.dataset.apiState = state
    textNode.textContent = `API ${state}. ${note}`
  } catch {
    stripNode.dataset.apiState = 'unavailable'
    textNode.textContent = 'Kick API state unavailable.'
  }
}
