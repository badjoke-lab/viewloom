import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
  <div class="page-shell page-shell--site theme-kick">
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link" href="/">Portal</a>
        <a class="nav-link" href="/twitch/">Twitch data</a>
        <a class="nav-link is-current" href="/kick/">Kick data</a>
      </nav>
      <div class="header-note">Unofficial Kick data</div>
    </header>
    <main class="page-main">
      <section class="hero hero--site hero--feature">
        <div>
          <div class="eyebrow">KICK DATA · STATUS</div>
          <h1>Kick Status</h1>
          <p class="hero-copy">A separate status surface for Kick readiness, coverage, and current limitations.</p>
          <div class="hero-actions">
            <a class="button button--secondary" href="/kick/">Kick overview</a>
            <a class="button button--secondary" href="/kick/heatmap/">Heatmap</a>
            <a class="button button--secondary" href="/kick/day-flow/">Day Flow</a>
            <a class="button button--secondary" href="/kick/battle-lines/">Battle Lines</a>
          </div>
        </div>
        <aside class="status-panel">
          <div class="status-panel__label">Kick data state</div>
          <div class="status-panel__title">Shell-level</div>
          <p>Kick routes exist. Provider-specific data recovery and feature-state checks still need dedicated work.</p>
        </aside>
      </section>
      <section class="summary-grid">
        <article class="summary-card"><div class="summary-card__label">Overall</div><div class="summary-card__value">Shell-level</div><p>Kick is present as a provider shell, not yet equal to the recovered Twitch feature pages.</p></article>
        <article class="summary-card"><div class="summary-card__label">Status source</div><div class="summary-card__value">Separate</div><p>This page does not reuse Twitch freshness or Twitch recovery status.</p></article>
        <article class="summary-card"><div class="summary-card__label">Debug parity</div><div class="summary-card__value">Pending</div><p>Kick Day Flow and Battle Lines do not yet have the Twitch-side debug helpers.</p></article>
        <article class="summary-card"><div class="summary-card__label">Next</div><div class="summary-card__value">State strips</div><p>Add visible provider-specific states to Kick feature pages before parity QA.</p></article>
      </section>
      <section class="chart-stage">
        <div class="chart-stage__label">Next implementation order</div>
        <h2>Kick recovery checklist</h2>
        <ol class="kick-status-list">
          <li>Keep Kick status provider-specific.</li>
          <li>Expose this status page from Kick shell surfaces.</li>
          <li>Add visible state strips to Kick Heatmap, Day Flow, and Battle Lines.</li>
          <li>Confirm Kick API contracts before adding debug helpers.</li>
          <li>Then move Kick into browser QA parity.</li>
        </ol>
      </section>
    </main>
  </div>
`

const style = document.createElement('style')
style.textContent = `.kick-status-list{margin:16px 0 0;padding-left:1.35rem;color:var(--muted);line-height:1.8}.kick-status-list li::marker{color:rgb(var(--accent-rgb));font-weight:700}`
document.head.appendChild(style)
