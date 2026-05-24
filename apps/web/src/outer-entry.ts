import './styles.css'
import './landing-theme.css'

type Page = 'about' | 'support'

type OuterPage = {
  page: Page
  eyebrow: string
  title: string
  lead: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  cards: Array<{ label: string; title: string; body: string }>
  notes: string[]
}

const contactFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog'

const pages: Record<Page, OuterPage> = {
  about: {
    page: 'about',
    eyebrow: 'VIEWLOOM · ABOUT',
    title: 'About ViewLoom',
    lead: 'ViewLoom is an unofficial observation surface for live-stream activity. It keeps Twitch and Kick separated, then reads each provider through Heatmap, Day Flow, Battle Lines, History, and Data Status.',
    primaryLabel: 'Open Twitch data',
    primaryHref: '/twitch/',
    secondaryLabel: 'Open Kick data',
    secondaryHref: '/kick/',
    cards: [
      { label: 'Structure', title: 'Provider-first', body: 'Twitch and Kick are not mixed into one dashboard. Each provider keeps its own feature pages and Data Status.' },
      { label: 'Views', title: 'Fixed page roles', body: 'Heatmap is now, Day Flow is today, Battle Lines is rivalry, History is trend, and Data Status is freshness and limitations.' },
      { label: 'Status', title: 'Honest coverage', body: 'Data can be delayed, partial, stale, unavailable, sampled, or limited by each provider collector.' },
      { label: 'Scope', title: 'Unofficial project', body: 'ViewLoom is independent and is not affiliated with Twitch or Kick.' },
    ],
    notes: [
      'About is shared across ViewLoom. Provider-specific About pages are intentionally not used.',
      'Provider collection details belong in Twitch Data Status and Kick Data Status.',
      'Contact is a direct Google Form link, not an internal ViewLoom contact page.',
    ],
  },
  support: {
    page: 'support',
    eyebrow: 'VIEWLOOM · SUPPORT',
    title: 'Support ViewLoom',
    lead: 'Support helps keep ViewLoom running as a lightweight independent observation project. This page is shared across providers instead of duplicating support pages under Twitch and Kick.',
    primaryLabel: 'Open GitHub',
    primaryHref: 'https://github.com/badjoke-lab/viewloom',
    secondaryLabel: 'Contact form',
    secondaryHref: contactFormUrl,
    cards: [
      { label: 'Operations', title: 'Collection and storage', body: 'Support can help cover scheduled collection, D1 storage, deployment checks, and future coverage improvements.' },
      { label: 'Maintenance', title: 'UI and data quality', body: 'Feature pages need ongoing maintenance as provider data quality, source modes, and coverage change.' },
      { label: 'Transparency', title: 'Status first', body: 'ViewLoom should surface partial coverage, stale data, fallback mode, and unavailable signals instead of hiding them.' },
    ],
    notes: [
      'Donation or support links can be added here later.',
      'GitHub is the current technical reference point.',
      'Support is shared across ViewLoom. Provider-specific data quality remains in each provider Data Status page.',
    ],
  },
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const pageName = document.body.dataset.page as Page | undefined
const page = pageName && pages[pageName] ? pages[pageName] : pages.about

document.title = `${page.title} | ViewLoom`
app.innerHTML = renderPage(page)

function renderPage(pageData: OuterPage): string {
  return `
    <div class="page-shell page-shell--site outer-page outer-page--portal-tone">
      <header class="site-header">
        <a class="brand" href="/">ViewLoom</a>
        <nav class="site-nav" aria-label="Primary">
          <a class="nav-link" href="/">Portal</a>
          <a class="nav-link" href="/twitch/">Twitch data</a>
          <a class="nav-link" href="/kick/">Kick data</a>
          <a class="nav-link ${pageData.page === 'about' ? 'is-current' : ''}" href="/about/">About</a>
          <a class="nav-link ${pageData.page === 'support' ? 'is-current' : ''}" href="/support/">Support</a>
          <a class="nav-link" href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact</a>
        </nav>
        <div class="header-note">Unofficial live observation UI</div>
      </header>
      <main class="page-main">
        <section class="hero hero--site outer-hero">
          <div>
            <div class="eyebrow">${escapeText(pageData.eyebrow)}</div>
            <h1>${escapeText(pageData.title)}</h1>
            <p class="hero-copy">${escapeText(pageData.lead)}</p>
            <div class="hero-actions">
              <a class="button button--primary" href="${escapeAttr(pageData.primaryHref)}" ${externalAttrs(pageData.primaryHref)}>${escapeText(pageData.primaryLabel)}</a>
              <a class="button button--secondary" href="${escapeAttr(pageData.secondaryHref)}" ${externalAttrs(pageData.secondaryHref)}>${escapeText(pageData.secondaryLabel)}</a>
            </div>
          </div>
          <aside class="status-panel">
            <div class="status-panel__label">Route rule</div>
            <div class="status-panel__title">Shared outer pages</div>
            <p>About and Support are common ViewLoom pages. Contact is a direct Google Form link. Only Data Status is provider-specific.</p>
          </aside>
        </section>
        <section class="summary-grid outer-grid">
          ${pageData.cards.map((card) => `<article class="summary-card"><div class="summary-card__label">${escapeText(card.label)}</div><div class="summary-card__value">${escapeText(card.title)}</div><p>${escapeText(card.body)}</p></article>`).join('')}
        </section>
        <section class="chart-stage outer-stage">
          <div class="chart-stage__label">Shared routes</div>
          <h2>No duplicated provider outer pages</h2>
          <p>Use <code>/about/</code> and <code>/support/</code> once. Contact is a direct Google Form link. Provider-specific implementation status belongs to <code>/twitch/status/</code> and <code>/kick/status/</code>.</p>
          <div class="hero-actions hero-actions--wrap">
            <a class="button button--secondary" href="/about/">About</a>
            <a class="button button--secondary" href="/support/">Support</a>
            <a class="button button--secondary" href="${escapeAttr(contactFormUrl)}" target="_blank" rel="noreferrer">Contact form</a>
            <a class="button button--secondary" href="/twitch/status/">Twitch Data Status</a>
            <a class="button button--secondary" href="/kick/status/">Kick Data Status</a>
          </div>
        </section>
        <section class="rail-grid outer-notes">
          ${pageData.notes.map((note) => `<article class="rail-card"><div class="rail-card__label">Note</div><p>${escapeText(note)}</p></article>`).join('')}
        </section>
      </main>
    </div>
  `
}

function externalAttrs(href: string): string {
  return href.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''
}

function escapeText(value: string): string {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}
