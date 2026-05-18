import './styles.css'

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

const contactFormUrl = 'https://forms.gle/REPLACE_VIEWLOOM_CONTACT_FORM'

const pages: Record<Page, OuterPage> = {
  about: {
    page: 'about',
    eyebrow: 'VIEWLOOM · ABOUT',
    title: 'About ViewLoom',
    lead: 'ViewLoom is an unofficial observation interface for live-stream activity. It separates now, today, rivalry, and trends so Twitch and Kick can be read without mixing provider data.',
    primaryLabel: 'Open Twitch data',
    primaryHref: '/twitch/',
    secondaryLabel: 'Open Kick data',
    secondaryHref: '/kick/',
    cards: [
      { label: 'Now', title: 'Heatmap', body: 'A current-field view for who is large, rising, or active right now.' },
      { label: 'Today', title: 'Day Flow', body: 'A day-level view for how attention moves across observed streams.' },
      { label: 'Rivalry', title: 'Battle Lines', body: 'A comparison view for overlapping stream activity and reversals.' },
      { label: 'Trends', title: 'History & Trends', body: 'A longer-range archive for daily peaks, viewer-minutes, and coverage quality.' },
    ],
    notes: [
      'ViewLoom is not affiliated with Twitch or Kick.',
      'Data can be delayed, partial, unavailable, or affected by collector status.',
      'Provider status is separated because Twitch and Kick have different data paths and limitations.',
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
      { label: 'Project', title: 'Independent tool', body: 'ViewLoom is built as a small provider-aware analytics surface, not an official platform dashboard.' },
      { label: 'Support', title: 'Keep the public version usable', body: 'Future support links can cover hosting, data collection, and maintenance costs.' },
      { label: 'Roadmap', title: 'Data Status first', body: 'Status and coverage honesty take priority over pretending every signal is complete.' },
    ],
    notes: [
      'Donation or support links can be added here later.',
      'GitHub is the current technical reference point.',
      'Contact is a direct Google Form link, not a separate ViewLoom page.',
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
    <div class="page-shell page-shell--site outer-page">
      <header class="site-header">
        <a class="brand" href="/">ViewLoom</a>
        <nav class="site-nav" aria-label="Primary">
          <a class="nav-link" href="/twitch/">Twitch data</a>
          <a class="nav-link" href="/kick/">Kick data</a>
          <a class="nav-link ${pageData.page === 'about' ? 'is-current' : ''}" href="/about/">About</a>
          <a class="nav-link ${pageData.page === 'support' ? 'is-current' : ''}" href="/support/">Support</a>
          <a class="nav-link" href="${escapeAttr(contactFormUrl)}">Contact</a>
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
              <a class="button button--primary" href="${escapeAttr(pageData.primaryHref)}">${escapeText(pageData.primaryLabel)}</a>
              <a class="button button--secondary" href="${escapeAttr(pageData.secondaryHref)}">${escapeText(pageData.secondaryLabel)}</a>
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
            <a class="button button--secondary" href="${escapeAttr(contactFormUrl)}">Contact form</a>
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

function escapeText(value: string): string {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;')
}
