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
            <a class="button button--secondary" href="/kick/history/">History</a>
          </div>
        </div>
        <aside class="status-panel">
          <div class="status-panel__label">Kick data state</div>
          <div class="status-panel__title">Provider rows connected</div>
          <p>Kick Heatmap, Day Flow, Battle Lines, and History now have provider-specific API paths. Browser parity QA is still pending.</p>
        </aside>
      </section>
      <section class="summary-grid">
        <article class="summary-card"><div class="summary-card__label">Heatmap</div><div class="summary-card__value">Connected</div><p>Reads the latest provider='kick' minute snapshot.</p></article>
        <article class="summary-card"><div class="summary-card__label">Day Flow</div><div class="summary-card__value">Connected</div><p>Builds bucketed daily bands from Kick provider rows.</p></article>
        <article class="summary-card"><div class="summary-card__label">Battle Lines</div><div class="summary-card__value">Connected</div><p>Builds Kick line series and battle candidates from observed rows.</p></article>
        <article class="summary-card"><div class="summary-card__label">History</div><div class="summary-card__value">Connected</div><p>Builds Kick History sections from provider='kick' snapshots.</p></article>
      </section>
      <section class="chart-stage">
        <div class="chart-stage__label">Next implementation order</div>
        <h2>Kick parity checklist</h2>
        <ol class="kick-status-list">
          <li>Keep Kick and Twitch data paths separated.</li>
          <li>Confirm each Kick API contract returns honest empty / partial / stale / live / error states.</li>
          <li>Confirm Kick pages consume the provider-specific API payloads without falling back to Twitch data.</li>
          <li>Run browser QA for Heatmap, Day Flow, Battle Lines, and History.</li>
          <li>Then move to UI polish and deploy verification.</li>
        </ol>
      </section>
    </main>
  </div>
`

const style = document.createElement('style')
style.textContent = `.kick-status-list{margin:16px 0 0;padding-left:1.35rem;color:var(--muted);line-height:1.8}.kick-status-list li::marker{color:rgb(var(--accent-rgb));font-weight:700}`
document.head.appendChild(style)
