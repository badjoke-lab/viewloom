function addTwitchHistoryLinks(): void {
  if (!document.body.dataset.page?.startsWith('twitch')) return
  const href = '/twitch/history/'

  const subnav = document.querySelector<HTMLElement>('.site-subnav')
  if (subnav && !subnav.querySelector(`[href="${href}"]`)) {
    const link = document.createElement('a')
    link.className = document.body.dataset.page === 'twitch-history' ? 'subnav-link is-current' : 'subnav-link'
    link.href = href
    link.textContent = 'History'
    subnav.append(link)
  }

  const actions = document.querySelector<HTMLElement>('.hero-actions')
  if (actions && !actions.querySelector(`[href="${href}"]`)) {
    const link = document.createElement('a')
    link.className = document.body.dataset.page === 'twitch-history' ? 'button button--primary' : 'button button--secondary'
    link.href = href
    link.textContent = 'History'
    actions.append(link)
  }

  const grid = document.querySelector<HTMLElement>('.feature-grid--top')
  if (document.body.dataset.page === 'twitch' && grid && !grid.querySelector(`[href="${href}"]`)) {
    const card = document.createElement('article')
    card.className = 'feature-card feature-card--top'
    card.innerHTML = '<div class="feature-card__label">Trends</div><h2>History</h2><p>Review observed days, top streamers, viewer-minutes, peaks, and coverage quality.</p><a class="button button--ghost feature-card__link" href="/twitch/history/">Open History</a>'
    grid.append(card)
  }
}

addTwitchHistoryLinks()
window.setTimeout(addTwitchHistoryLinks, 0)
window.setTimeout(addTwitchHistoryLinks, 250)
