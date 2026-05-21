import './styles.css'

const CONTACT_FORM_URL = 'https://forms.gle/REPLACE_VIEWLOOM_CONTACT_FORM'
type OuterPage = 'about' | 'support'

const page = document.body.dataset.page === 'support' ? 'support' : 'about'
const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = renderOuterPage(page)

function renderOuterPage(kind: OuterPage): string {
  return `
    <div class="page-shell page-shell--site outer-page">
      ${renderHeader(kind)}
      <main class="page-main outer-main">
        ${kind === 'about' ? renderAbout() : renderSupport()}
      </main>
      ${renderFooter()}
    </div>
  `
}

function renderHeader(current: OuterPage): string {
  return `
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link" href="/">Portal</a>
        <a class="nav-link" href="/twitch/">Twitch data</a>
        <a class="nav-link" href="/kick/">Kick data</a>
        <a class="nav-link ${current === 'about' ? 'is-current' : ''}" href="/about/">About</a>
        <a class="nav-link ${current === 'support' ? 'is-current' : ''}" href="/support/">Support</a>
        <a class="nav-link" href="${CONTACT_FORM_URL}" target="_blank" rel="noreferrer">Contact</a>
      </nav>
      <div class="header-note">Unofficial live data</div>
    </header>
  `
}

function renderAbout(): string {
  return `
    <section class="hero hero--site hero--feature outer-hero">
      <div>
        <div class="eyebrow">About ViewLoom</div>
        <h1>Live activity, separated by platform and view.</h1>
        <p class="hero-copy">
          ViewLoom is an unofficial observation surface for live-stream activity. It keeps Twitch and Kick separated, then reads each platform through fixed views: Heatmap, Day Flow, Battle Lines, History, and Data Status.
        </p>
      </div>
      <aside class="status-panel">
        <div class="status-panel__label">Important</div>
        <div class="status-panel__title">Unofficial and partial</div>
        <p>Data can be delayed, incomplete, stale, unavailable, or sampled depending on each provider's collector and coverage state.</p>
      </aside>
    </section>

    <section class="support-grid support-grid--feature outer-grid">
      <article class="support-card">
        <div class="support-card__label">Structure</div>
        <h2>Provider-first</h2>
        <p>Twitch and Kick are not mixed into one dashboard. Each provider has its own top page, feature pages, and Data Status page.</p>
      </article>
      <article class="support-card">
        <div class="support-card__label">Views</div>
        <h2>Fixed reading roles</h2>
        <p>Heatmap is for now, Day Flow is for today, Battle Lines is for rivalry, History is for longer trends, and Data Status is for freshness and limitations.</p>
      </article>
      <article class="support-card">
        <div class="support-card__label">Status</div>
        <h2>Coverage belongs in Data Status</h2>
        <p>Provider-specific collection state is kept on /twitch/status/ and /kick/status/ instead of duplicating provider-specific About pages.</p>
      </article>
    </section>

    <section class="feature-layout outer-layout">
      <article class="chart-stage">
        <div class="chart-stage__label">Provider pages</div>
        <h2>Open a platform</h2>
        <p class="hero-copy hero-copy--secondary">Start from a provider, then choose the view that matches the question.</p>
        <div class="hero-actions">
          <a class="button button--primary" href="/twitch/">Open Twitch data</a>
          <a class="button button--secondary" href="/kick/">Open Kick data</a>
        </div>
      </article>
      <aside class="rail-stack">
        <section class="rail-card">
          <div class="rail-card__label">Twitch</div>
          <h2>Twitch Data Status</h2>
          <p>Check Twitch freshness, coverage, and limitations.</p>
          <a class="button button--secondary" href="/twitch/status/">Open Data Status</a>
        </section>
        <section class="rail-card">
          <div class="rail-card__label">Kick</div>
          <h2>Kick Data Status</h2>
          <p>Check Kick source mode, seed-list coverage, and observed channels.</p>
          <a class="button button--secondary" href="/kick/status/">Open Data Status</a>
        </section>
      </aside>
    </section>
  `
}

function renderSupport(): string {
  return `
    <section class="hero hero--site hero--feature outer-hero">
      <div>
        <div class="eyebrow">Support ViewLoom</div>
        <h1>Support collection, uptime, and independent tooling.</h1>
        <p class="hero-copy">
          ViewLoom depends on ongoing data collection, storage, maintenance, and UI work. This page is the shared support surface for the whole project, not a Twitch-only or Kick-only page.
        </p>
      </div>
      <aside class="status-panel">
        <div class="status-panel__label">Shared support</div>
        <div class="status-panel__title">One support page</div>
        <p>Support is shared across ViewLoom. Provider-specific data quality remains in each provider's Data Status page.</p>
      </aside>
    </section>

    <section class="support-grid support-grid--feature outer-grid">
      <article class="support-card">
        <div class="support-card__label">Operations</div>
        <h2>Data collection and storage</h2>
        <p>Support helps keep scheduled collection, D1 storage, deployment checks, and future coverage improvements moving.</p>
      </article>
      <article class="support-card">
        <div class="support-card__label">Development</div>
        <h2>UI and feature maintenance</h2>
        <p>Heatmap, Day Flow, Battle Lines, History, and Data Status need ongoing polish as provider data quality changes.</p>
      </article>
      <article class="support-card">
        <div class="support-card__label">Transparency</div>
        <h2>Unofficial and honest</h2>
        <p>ViewLoom does not hide source modes, partial coverage, stale states, or platform-specific limitations.</p>
      </article>
    </section>

    <section class="feature-layout outer-layout">
      <article class="chart-stage">
        <div class="chart-stage__label">Links</div>
        <h2>Project links</h2>
        <div class="outer-link-list">
          <a class="button button--primary" href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">Open GitHub</a>
          <a class="button button--secondary" href="${CONTACT_FORM_URL}" target="_blank" rel="noreferrer">Contact</a>
        </div>
      </article>
      <aside class="rail-stack">
        <section class="rail-card">
          <div class="rail-card__label">Status</div>
          <h2>Before judging data</h2>
          <p>Always check provider status before treating the charts as complete or fresh.</p>
          <div class="outer-link-list outer-link-list--stacked">
            <a class="button button--secondary" href="/twitch/status/">Twitch Data Status</a>
            <a class="button button--secondary" href="/kick/status/">Kick Data Status</a>
          </div>
        </section>
      </aside>
    </section>
  `
}

function renderFooter(): string {
  return `
    <footer class="outer-footer">
      <a href="/about/">About</a>
      <a href="/support/">Support</a>
      <a href="${CONTACT_FORM_URL}" target="_blank" rel="noreferrer">Contact</a>
      <a href="https://github.com/badjoke-lab/viewloom" target="_blank" rel="noreferrer">GitHub</a>
    </footer>
  `
}
