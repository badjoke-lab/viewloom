export {}
const page = document.body.dataset.page ?? ''

if (page.startsWith('twitch') && page !== 'twitch-status') {
  installTwitchStatusLink()
}

function featureLabel(): string {
  if (page === 'twitch-heatmap') return 'TWITCH DATA · NOW'
  if (page === 'twitch-day-flow') return 'TWITCH DATA · TODAY'
  if (page === 'twitch-battle-lines') return 'TWITCH DATA · RIVALRY'
  if (page === 'twitch-history') return 'TWITCH DATA · TRENDS'
  return 'TWITCH DATA · STATUS'
}

function featureMessage(): string {
  if (page === 'twitch-heatmap') return 'Twitch Heatmap reads the latest provider-specific Twitch snapshot when available.'
  if (page === 'twitch-day-flow') return 'Twitch Day Flow reads provider-specific Twitch rows and keeps coverage state visible.'
  if (page === 'twitch-battle-lines') return 'Twitch Battle Lines reads provider-specific Twitch rows and keeps derived rivalry states honest.'
  if (page === 'twitch-history') return 'Twitch History reads provider-specific Twitch rows without mixing platforms.'
  return 'Check Data Status for Twitch collector freshness, coverage, and known limitations.'
}

function installTwitchStatusLink(): void {
  const tryInstall = () => {
    const subnav = document.querySelector<HTMLElement>('.site-subnav')
    if (subnav && !subnav.querySelector('[data-twitch-status-subnav-link]') && !subnav.querySelector('[href="/twitch/status/"]')) {
      const link = document.createElement('a')
      link.className = 'subnav-link'
      link.href = '/twitch/status/'
      link.dataset.twitchStatusSubnavLink = 'true'
      link.textContent = 'Data Status'
      subnav.appendChild(link)
    }

    const main = document.querySelector<HTMLElement>('.page-main')
    if (main && !main.querySelector('[data-twitch-status-strip]')) {
      const anchor = main.querySelector('.site-subnav') ?? main.querySelector('.hero')
      const strip = document.createElement('aside')
      strip.className = `twitch-status-strip ${page === 'twitch' ? 'twitch-status-strip--overview' : 'twitch-status-strip--feature'}`
      strip.dataset.twitchStatusStrip = 'true'
      strip.innerHTML = `<strong>${featureLabel()}</strong><span data-twitch-api-state="true">${featureMessage()}</span><a href="/twitch/status/">Data Status</a>`
      if (anchor?.nextSibling) anchor.parentNode?.insertBefore(strip, anchor.nextSibling)
      else main.prepend(strip)
    }
  }

  tryInstall()
  window.setTimeout(tryInstall, 250)
  window.setTimeout(tryInstall, 1000)

  const observer = new MutationObserver(() => tryInstall())
  observer.observe(document.body, { childList: true, subtree: true })

  installStyles()
}

function installStyles(): void {
  if (document.getElementById('twitch-status-link-style')) return
  const style = document.createElement('style')
  style.id = 'twitch-status-link-style'
  style.textContent = `
    .twitch-status-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 14px 0 18px;
      padding: 12px 14px;
      border: 1px solid rgba(168, 85, 247, 0.26);
      border-radius: 16px;
      background: rgba(46, 16, 101, 0.34);
      color: var(--text);
    }
    .twitch-status-strip--feature {
      border-color: rgba(216, 180, 254, 0.30);
      background: linear-gradient(135deg, rgba(46, 16, 101, 0.34), rgba(30, 41, 59, 0.24));
    }
    .twitch-status-strip strong {
      color: rgb(var(--accent-rgb));
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .twitch-status-strip span {
      color: var(--muted);
      flex: 1;
      line-height: 1.45;
    }
    .twitch-status-strip a {
      color: var(--text);
      text-decoration: none;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(15, 23, 42, 0.42);
      white-space: nowrap;
    }
    @media (max-width: 680px) {
      .twitch-status-strip {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `
  document.head.appendChild(style)
}
