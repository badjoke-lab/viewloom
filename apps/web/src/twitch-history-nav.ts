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
}

addTwitchHistoryLinks()
window.setTimeout(addTwitchHistoryLinks, 0)
window.setTimeout(addTwitchHistoryLinks, 250)
