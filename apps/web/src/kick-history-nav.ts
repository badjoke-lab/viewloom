function addKickHistoryLinks(): void {
  const page = document.body.dataset.page || ''
  if (!page.startsWith('kick')) return
  const href = '/kick/history/'

  const subnav = document.querySelector<HTMLElement>('.site-subnav')
  if (subnav && !subnav.querySelector(`[href="${href}"]`)) {
    const link = document.createElement('a')
    link.className = page === 'kick-history' ? 'subnav-link is-current' : 'subnav-link'
    link.href = href
    link.textContent = 'History'
    const statusLink = subnav.querySelector<HTMLAnchorElement>('[href="/kick/status/"]')
    if (statusLink) subnav.insertBefore(link, statusLink)
    else subnav.append(link)
  }

  const actions = document.querySelector<HTMLElement>('.hero-actions')
  if (actions && !actions.querySelector(`[href="${href}"]`)) {
    const link = document.createElement('a')
    link.className = page === 'kick-history' ? 'button button--primary' : 'button button--secondary'
    link.href = href
    link.textContent = 'History'
    actions.append(link)
  }

  const featureGrid = document.querySelector<HTMLElement>('.feature-grid--top')
  if (featureGrid && !featureGrid.querySelector(`[href="${href}"]`)) {
    const card = document.createElement('article')
    card.className = 'feature-card feature-card--top'
    card.innerHTML = '<div class="feature-card__label">Trends</div><h2>History & Trends</h2><p>Review observed days, top streamers, daily peaks, and coverage quality across Kick history.</p><a class="button button--ghost feature-card__link" href="/kick/history/">Open History & Trends</a>'
    featureGrid.append(card)
  }
}

addKickHistoryLinks()
window.setTimeout(addKickHistoryLinks, 0)
window.setTimeout(addKickHistoryLinks, 250)
window.setTimeout(addKickHistoryLinks, 1000)
