import './styles.css'

type PageKind = 'portal' | 'twitch' | 'kick'

type SiteCard = {
  slug: 'twitch' | 'kick'
  title: string
  eyebrow: string
  description: string
  cta: string
  accentClass: string
}

const cards: SiteCard[] = [
  {
    slug: 'twitch',
    title: 'Twitch ViewLoom',
    eyebrow: 'Now / Today / Rivalries',
    description:
      'Read Twitch live activity through Heatmap, Day Flow, and Battle Lines.',
    cta: 'Open Twitch site',
    accentClass: 'theme-twitch',
  },
  {
    slug: 'kick',
    title: 'Kick ViewLoom',
    eyebrow: 'Now / Today / Rivalries',
    description:
      'Read Kick live activity through Heatmap, Day Flow, and Battle Lines.',
    cta: 'Open Kick site',
    accentClass: 'theme-kick',
  },
]

const page = ((document.body.dataset.page as PageKind | undefined) ?? 'portal')
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('#app not found')
}

app.innerHTML = renderPage(page)

function renderPage(kind: PageKind): string {
  if (kind === 'portal') return renderPortal()
  return renderSite(kind)
}

function renderPortal(): string {
  return `
    <div class="page-shell page-shell--portal">
      ${renderHeader('portal')}
      <main class="page-main">
        <section class="hero hero--portal">
          <div class="eyebrow">ViewLoom</div>
          <h1>Observe live ecosystems across platforms.</h1>
          <p class="hero-copy">
            Enter dedicated Twitch and Kick observatories built around Now, Today,
            and Rivalries.
          </p>
          <div class="hero-actions">
            <a class="button button--primary" href="/twitch/">Open Twitch</a>
            <a class="button button--secondary" href="/kick/">Open Kick</a>
          </div>
        </section>

        <section class="card-grid card-grid--portal">
          ${cards.map(renderPortalCard).join('')}
        </section>

        <section class="info-strip">
          <div class="info-card">
            <h2>Two separate observatories</h2>
            <p>
              Twitch and Kick keep separate shells, data paths, and status surfaces.
            </p>
          </div>
          <div class="info-card">
            <h2>Three fixed roles</h2>
            <p>Heatmap = Now. Day Flow = Today. Battle Lines = Compare.</p>
          </div>
          <div class="info-card">
            <h2>Foundation first</h2>
            <p>
              This shell is the first ViewLoom rebuild milestone before feature pages land.
            </p>
          </div>
        </section>
      </main>
    </div>
  `
}

function renderPortalCard(card: SiteCard): string {
  return `
    <article class="surface-card ${card.accentClass}">
      <div class="surface-card__eyebrow">${card.eyebrow}</div>
      <h2>${card.title}</h2>
      <p>${card.description}</p>
      <a class="button button--ghost" href="/${card.slug}/">${card.cta}</a>
    </article>
  `
}

function renderSite(kind: Exclude<PageKind, 'portal'>): string {
  const isTwitch = kind === 'twitch'
  const title = isTwitch ? 'Twitch ViewLoom' : 'Kick ViewLoom'
  const accentClass = isTwitch ? 'theme-twitch' : 'theme-kick'
  const status = isTwitch ? 'Twitch shell ready' : 'Kick shell ready'

  return `
    <div class="page-shell page-shell--site ${accentClass}">
      ${renderHeader(kind)}
      <main class="page-main">
        <section class="hero hero--site">
          <div>
            <div class="eyebrow">${isTwitch ? 'Twitch' : 'Kick'}</div>
            <h1>${title}</h1>
            <p class="hero-copy">
              Dedicated shell for the ${isTwitch ? 'Twitch' : 'Kick'} side of ViewLoom.
              Heatmap, Day Flow, and Battle Lines will mount on this frame next.
            </p>
            <div class="hero-actions">
              <a class="button button--primary" href="#">Heatmap</a>
              <a class="button button--secondary" href="#">Day Flow</a>
              <a class="button button--secondary" href="#">Battle Lines</a>
            </div>
          </div>
          <aside class="status-panel">
            <div class="status-panel__label">Current state</div>
            <div class="status-panel__title">${status}</div>
            <p>
              Shared shell is in place. Feature-specific pages and live data wiring come next.
            </p>
          </aside>
        </section>

        <section class="feature-grid">
          <article class="feature-card">
            <div class="feature-card__label">Now</div>
            <h2>Heatmap</h2>
            <p>Treemap-first live field for who is big, rising, or active now.</p>
          </article>
          <article class="feature-card">
            <div class="feature-card__label">Today</div>
            <h2>Day Flow</h2>
            <p>Daily ownership landscape for volume, share, and key movement windows.</p>
          </article>
          <article class="feature-card">
            <div class="feature-card__label">Compare</div>
            <h2>Battle Lines</h2>
            <p>Rivalry-focused comparison page for reversals, surges, and pressure.</p>
          </article>
        </section>
      </main>
    </div>
  `
}

function renderHeader(current: PageKind): string {
  return `
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link ${current === 'portal' ? 'is-current' : ''}" href="/">Portal</a>
        <a class="nav-link ${current === 'twitch' ? 'is-current' : ''}" href="/twitch/">Twitch</a>
        <a class="nav-link ${current === 'kick' ? 'is-current' : ''}" href="/kick/">Kick</a>
      </nav>
    </header>
  `
}
