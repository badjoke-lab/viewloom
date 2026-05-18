const page = document.body.dataset.page ?? ''

if (page.startsWith('kick') && page !== 'kick-status') {
  installKickStatusLink()
}

function featureLabel(): string {
  if (page === 'kick-heatmap') return 'KICK DATA · NOW'
  if (page === 'kick-day-flow') return 'KICK DATA · TODAY'
  if (page === 'kick-battle-lines') return 'KICK DATA · RIVALRY'
  if (page === 'kick-history') return 'KICK DATA · TRENDS'
  return 'KICK DATA · STATUS'
}

function featureMessage(): string {
  if (page === 'kick-heatmap') return 'Kick Heatmap reads the latest provider-specific Kick snapshot when available.'
  if (page === 'kick-day-flow') return 'Kick Day Flow reads provider-specific Kick rows and keeps activity availability honest.'
  if (page === 'kick-battle-lines') return 'Kick Battle Lines reads provider-specific Kick rows while preserving observed, missing, not_observed, and offline states.'
  if (page === 'kick-history') return 'Kick History reads provider-specific Kick rows and mirrors the Twitch History sections without mixing platforms.'
  return 'Kick is in provider-specific recovery. Check Data Status before parity QA.'
}

function installKickStatusLink(): void {
  const tryInstall = () => {
    const nav = document.querySelector<HTMLElement>('.site-nav')
    if (nav && !nav.querySelector('[data-kick-status-link]')) {
      const link = document.createElement('a')
      link.className = 'nav-link'
      link.href = '/kick/status/'
      link.dataset.kickStatusLink = 'true'
      link.textContent = 'Data Status'
      nav.appendChild(link)
    }

    const subnav = document.querySelector<HTMLElement>('.site-subnav')
    if (subnav && !subnav.querySelector('[data-kick-status-subnav-link]')) {
      const link = document.createElement('a')
      link.className = 'subnav-link'
      link.href = '/kick/status/'
      link.dataset.kickStatusSubnavLink = 'true'
      link.textContent = 'Data Status'
      subnav.appendChild(link)
    }

    const main = document.querySelector<HTMLElement>('.page-main')
    if (main && !main.querySelector('[data-kick-status-strip]')) {
      const anchor = main.querySelector('.site-subnav') ?? main.querySelector('.hero')
      const strip = document.createElement('aside')
      strip.className = `kick-status-strip ${page === 'kick' ? 'kick-status-strip--overview' : 'kick-status-strip--feature'}`
      strip.dataset.kickStatusStrip = 'true'
      strip.innerHTML = `<strong>${featureLabel()}</strong><span data-kick-api-state="true">${featureMessage()}</span><a href="/kick/status/">Open Data Status</a>`
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
  if (document.getElementById('kick-status-link-style')) return
  const style = document.createElement('style')
  style.id = 'kick-status-link-style'
  style.textContent = `
    .kick-status-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 14px 0 18px;
      padding: 12px 14px;
      border: 1px solid rgba(74, 222, 128, 0.22);
      border-radius: 16px;
      background: rgba(5, 46, 22, 0.34);
      color: var(--text);
    }
    .kick-status-strip--feature {
      border-color: rgba(251, 191, 36, 0.30);
      background: linear-gradient(135deg, rgba(5, 46, 22, 0.34), rgba(113, 63, 18, 0.22));
    }
    .kick-status-strip strong {
      color: rgb(var(--accent-rgb));
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .kick-status-strip--feature strong {
      color: #facc15;
    }
    .kick-status-strip span {
      color: var(--muted);
      flex: 1;
      line-height: 1.45;
    }
    .kick-status-strip a {
      color: var(--text);
      text-decoration: none;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 999px;
      padding: 7px 10px;
      background: rgba(15, 23, 42, 0.42);
      white-space: nowrap;
    }
    @media (max-width: 680px) {
      .kick-status-strip {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `
  document.head.appendChild(style)
}
