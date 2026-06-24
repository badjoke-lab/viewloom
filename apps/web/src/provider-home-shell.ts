import type { Platform } from './provider-home/types'

export function mountProviderHome(platform: Platform): void {
  const root = document.getElementById('provider-home-root')
  if (!root) throw new Error('Provider Home root is missing.')

  const name = platform === 'twitch' ? 'Twitch' : 'Kick'
  const base = `/${platform}/`
  const topLimit = platform === 'twitch' ? 'Top 300 observed' : 'Top 100 observed candidates'
  const lede = platform === 'twitch'
    ? 'Read the latest Helix-backed observed window, today’s movement, rivalries, retained trends, and data health without mixing Twitch with another platform.'
    : 'Read the latest candidate-based Kick observation, today’s movement, rivalries, retained trends, and coverage limits without presenting it as Twitch-parity directory coverage.'

  const featureCards = [
    ['01 · NOW', 'Heatmap', 'See where observed viewers are largest and which streams are moving now.', 'heatmap', 'home-feature-heatmap', 'Loading current snapshot…'],
    ['02 · TODAY', 'Day Flow', 'Read the day as audience terrain across observed streams.', 'day-flow', 'home-feature-dayflow', 'Loading today summary…'],
    ['03 · RIVALRY', 'Battle Lines', 'Compare observed live-stream gaps, reversals, and rivalries.', 'battle-lines', 'home-feature-battle', 'Loading current pair…'],
    ['04 · TRENDS', 'History', 'Review retained rollups, top streamers, peaks, and trends.', 'history', 'home-feature-history', 'Loading completed history…'],
  ]

  const liveRows = Array.from({ length: 5 }, (_, index) => `
    <tr id="home-live-row-${index}">
      <td id="home-live-rank-${index}">${index + 1}</td>
      <td><a class="home-channel-link" id="home-live-name-${index}" href="#" target="_blank" rel="noreferrer">Loading…</a></td>
      <td class="home-live-context" id="home-live-context-${index}">Loading…</td>
      <td class="num" id="home-live-viewers-${index}">—</td>
      <td class="num home-momentum" id="home-live-momentum-${index}">—</td>
    </tr>`).join('')

  const signalRows = Array.from({ length: 4 }, (_, index) => `
    <div class="home-signal" id="home-signal-${index}">
      <span class="home-signal__mark" aria-hidden="true"></span>
      <span><strong id="home-signal-label-${index}">Loading…</strong><small id="home-signal-summary-${index}">Loading signal</small></span>
      <time id="home-signal-time-${index}"></time>
    </div>`).join('')

  const trendBars = Array.from({ length: 7 }, (_, index) => `
    <div class="home-trend-item" id="home-trend-${index}" role="img">
      <div class="home-trend-bar" id="home-trend-bar-${index}"></div>
      <span id="home-trend-label-${index}"></span>
    </div>`).join('')

  root.innerHTML = `<div class="site-frame">
    <header class="masthead"><div class="masthead__inner">
      <a class="brand" href="/"><span class="brand-mark">VL</span><span>ViewLoom<small>Live data observatory</small></span></a>
      <nav class="global-nav" id="provider-home-nav" aria-label="Global navigation"><a href="/">Portal</a><a href="/twitch/" ${platform === 'twitch' ? 'aria-current="page"' : ''}>Twitch data</a><a href="/kick/" ${platform === 'kick' ? 'aria-current="page"' : ''}>Kick data</a><a href="/changelog/">Changelog</a><a href="/about/">About</a><a href="/support/">Support</a></nav>
      <div class="status-inline" role="status" aria-live="polite"><span class="dot" aria-hidden="true"></span>Loading ${name} Home data</div>
      <button class="mobile-menu mobile-only" data-mobile-menu aria-label="Open navigation" aria-controls="provider-home-nav" aria-expanded="false">Menu</button>
    </div></header>

    <main class="page provider-home">
      <div class="breadcrumb">ViewLoom / ${name} data</div>

      <section class="page-head">
        <div><div class="kicker">${name.toUpperCase()} DATA</div><h1>${name}, observed as a moving field.</h1><p class="lede">${lede}</p></div>
        <div class="head-facts" aria-live="polite">
          <div class="fact"><small>Live observed</small><strong id="home-live-observed">Loading…</strong></div>
          <div class="fact"><small>Observed viewers</small><strong id="home-observed-viewers">Loading…</strong></div>
          <div class="fact"><small>Largest observed</small><strong id="home-largest-observed">Loading…</strong></div>
          <div class="fact"><small>Updated</small><strong id="home-updated">Loading…</strong></div>
        </div>
      </section>

      <section class="provider-home-status data-strip" aria-label="${name} data status">
        <div class="provider-home-status__title">${name} data<strong id="home-state">Loading</strong></div>
        <div class="data-strip__cell"><small>Updated</small><span id="home-strip-updated">Loading…</span></div>
        <div class="data-strip__cell"><small>Observed</small><span id="home-strip-observed">Loading…</span></div>
        <div class="data-strip__cell"><small>Coverage</small><span id="home-strip-coverage">${topLimit}</span></div>
        <div class="data-strip__cell"><small>Source</small><span id="home-strip-source">Loading…</span></div>
        <a class="provider-home-status__link" href="${base}status/">Open Status →</a>
        <div class="provider-home-status__note" id="home-status-note">Loading the ${name} observation summary.</div>
      </section>

      <section class="feature-directory" aria-label="${name} analysis pages">
        ${featureCards.map(([num, title, copy, slug, id, fallback]) => `<a class="feature-item" href="${base}${slug}/"><span class="num">${num}</span><h3>${title}</h3><p>${copy}</p><div class="feature-item__fact" id="${id}">${fallback}</div></a>`).join('')}
      </section>

      <section class="provider-utility" aria-label="${name} browser utilities">
        <a class="provider-utility__item" href="${base}watchlist/">
          <span class="provider-utility__mark">LOCAL · BROWSER</span>
          <div><h2>Local Watchlist</h2><p>Saved channels in this browser. Keep ${name} ids separate and reopen provider-safe ViewLoom pages.</p></div>
          <strong>Open Local Watchlist →</strong>
        </a>
      </section>

      <div class="provider-overview">
        <section class="home-section">
          <div class="rule-title"><h2>Live Now</h2><span>Latest observed snapshot</span></div>
          <div class="surface surface--dark home-surface">
            <table class="home-table" id="home-live-table">
              <caption>Top streams in the latest observed ${name} snapshot</caption>
              <thead><tr><th scope="col">Rank</th><th scope="col">Channel</th><th scope="col" class="home-live-context">Context</th><th scope="col" class="num">Viewers</th><th scope="col" class="num">Movement</th></tr></thead>
              <tbody>${liveRows}</tbody>
            </table>
            <div class="home-table-foot"><span id="home-live-caption">Loading observed ranking…</span><a href="${base}heatmap/">Open Heatmap →</a></div>
          </div>
        </section>

        <aside class="home-section">
          <div class="rule-title"><h2>Current signals</h2><span>Derived from observed data</span></div>
          <div class="surface surface--dark home-surface"><div class="home-signals signal-list">${signalRows}<p class="home-empty" id="home-signals-empty" hidden>No qualifying current signals.</p></div></div>
        </aside>
      </div>

      <section>
        <div class="rule-title"><h2>Today</h2><span>Observed UTC day</span></div>
        <div class="home-today-grid">
          <div class="surface surface--dark">
            <div class="surface__head"><strong>Today overview</strong><a class="text-link" href="${base}day-flow/">Open Day Flow</a></div>
            <div class="home-stat-grid">
              <div class="home-stat"><small>Observed peak</small><strong id="home-today-peak">Loading…</strong></div>
              <div class="home-stat"><small>Peak time</small><strong id="home-today-time">Loading…</strong></div>
              <div class="home-stat"><small>Current observed</small><strong id="home-today-current">Loading…</strong></div>
              <div class="home-stat"><small>Top by viewer-minutes</small><strong id="home-today-top">Loading…</strong><span id="home-today-top-value"></span></div>
            </div>
            <div class="home-meter-group">
              <div class="home-meter-row"><span>Observed peak</span><div class="home-meter" role="progressbar" aria-label="Observed peak relative to today maximum" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="home-meter-peak"></i></div></div>
              <div class="home-meter-row"><span>Current</span><div class="home-meter" role="progressbar" aria-label="Current observed viewers relative to today maximum" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="home-meter-current"></i></div></div>
            </div>
          </div>

          <aside class="surface surface--dark">
            <div class="surface__head"><strong>Today in motion</strong><a class="text-link" href="${base}battle-lines/">Open Battle Lines</a></div>
            <div class="home-motion">
              <div class="home-motion__item"><small>Reversal review</small><strong id="home-today-reversal">Loading…</strong></div>
              <div class="home-motion__item"><small>Closest current pair</small><strong id="home-today-battle">Loading…</strong></div>
            </div>
          </aside>
        </div>
      </section>

      <section>
        <div class="rule-title"><h2>Recent Trends</h2><span>Completed retained days</span></div>
        <div class="surface surface--dark">
          <div class="surface__head"><strong>History briefing</strong><a class="text-link" href="${base}history/">Open History</a></div>
          <div class="surface__body home-recent-grid">
            <div class="home-recent-stats">
              <div class="home-recent-stat"><small>Latest completed day</small><strong id="home-recent-day">Loading…</strong></div>
              <div class="home-recent-stat"><small>Top streamer</small><strong id="home-recent-top">Loading…</strong><span id="home-recent-top-value"></span></div>
              <div class="home-recent-stat"><small>Biggest rise</small><strong id="home-recent-rise">Loading…</strong><span id="home-recent-rise-value"></span></div>
              <div class="home-recent-stat"><small>Coverage quality</small><strong id="home-recent-coverage">Loading…</strong></div>
            </div>
            <div class="home-trend" aria-label="Recent completed daily peak viewers"><p class="home-trend-empty" id="home-trend-empty">Loading retained trend…</p>${trendBars}</div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer"><div>ViewLoom · Independent, unofficial observation of public live-stream data.</div><nav><a href="/changelog/">Changelog</a><a href="/about/">Method & limits</a><a href="/support/">Support</a><a href="https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog" target="_blank" rel="noreferrer">Contact</a><a href="https://github.com/badjoke-lab/viewloom">GitHub</a></nav></footer>
  </div>`
}
