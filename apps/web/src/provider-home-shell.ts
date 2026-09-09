import { localizeHref } from './i18n/route'
import type { Locale } from './i18n/locale'
import { providerHomeCoverage, providerHomeLede, providerHomeText } from './i18n/provider-home'
import type { Platform } from './provider-home/types'

export function mountProviderHome(platform: Platform, locale: Locale = 'en'): void {
  const root = document.getElementById('provider-home-root')
  if (!root) throw new Error('Provider Home root is missing.')

  const name = platform === 'twitch' ? 'Twitch' : 'Kick'
  const base = localizeHref(`/${platform}/`, locale)
  const route = (href: string) => localizeHref(href, locale)
  const t = (key: Parameters<typeof providerHomeText>[1], params: Record<string, string | number> = {}) => providerHomeText(locale, key, params)
  const topLimit = providerHomeCoverage(locale, platform)
  const lede = providerHomeLede(locale, platform)

  const featureCards = [
    ['01 · NOW', 'Heatmap', t('feature.heatmap.copy'), 'heatmap', 'home-feature-heatmap', t('feature.heatmap.fallback')],
    ['02 · TODAY', 'Day Flow', t('feature.dayFlow.copy'), 'day-flow', 'home-feature-dayflow', t('feature.dayFlow.fallback')],
    ['03 · RIVALRY', 'Battle Lines', t('feature.battleLines.copy'), 'battle-lines', 'home-feature-battle', t('feature.battleLines.fallback')],
    ['04 · TRENDS', 'History', t('feature.history.copy'), 'history', 'home-feature-history', t('feature.history.fallback')],
    ...(platform === 'kick' ? [[
      '05 · WHERE',
      'Stream Map',
      t('feature.streamMap.copy'),
      'map',
      'home-feature-map',
      t('feature.streamMap.fallback'),
    ]] : []),
  ]

  const liveRows = Array.from({ length: 5 }, (_, index) => `
    <tr id="home-live-row-${index}">
      <td id="home-live-rank-${index}">${index + 1}</td>
      <td><a class="home-channel-link" id="home-live-name-${index}" href="#" target="_blank" rel="noreferrer">${t('loading.ellipsis')}</a></td>
      <td class="home-live-context" id="home-live-context-${index}">${t('loading.ellipsis')}</td>
      <td class="num" id="home-live-viewers-${index}">—</td>
      <td class="num home-momentum" id="home-live-momentum-${index}">—</td>
    </tr>`).join('')

  const signalRows = Array.from({ length: 4 }, (_, index) => `
    <div class="home-signal" id="home-signal-${index}">
      <span class="home-signal__mark" aria-hidden="true"></span>
      <span><strong id="home-signal-label-${index}">${t('loading.ellipsis')}</strong><small id="home-signal-summary-${index}">${t('loading.signal')}</small></span>
      <time id="home-signal-time-${index}"></time>
    </div>`).join('')

  const trendBars = Array.from({ length: 7 }, (_, index) => `
    <div class="home-trend-item" id="home-trend-${index}" role="img">
      <div class="home-trend-bar" id="home-trend-bar-${index}"></div>
      <span id="home-trend-label-${index}"></span>
    </div>`).join('')

  root.innerHTML = `<div class="site-frame">
    <header class="masthead"><div class="masthead__inner">
      <a class="brand" href="${route('/')}"><span class="brand-mark">VL</span><span>ViewLoom<small>${t('brand.tagline')}</small></span></a>
      <nav class="global-nav" id="provider-home-nav" aria-label="${t('nav.label')}"><a href="${route('/')}">${t('nav.portal')}</a><a href="${route('/twitch/')}" ${platform === 'twitch' ? 'aria-current="page"' : ''}>${t('nav.twitch')}</a><a href="${route('/kick/')}" ${platform === 'kick' ? 'aria-current="page"' : ''}>${t('nav.kick')}</a><a href="${route('/changelog/')}">${t('nav.changelog')}</a><a href="${route('/about/')}">${t('nav.about')}</a><a href="${route('/support/')}">${t('nav.support')}</a></nav>
      <div class="status-inline" role="status" aria-live="polite"><span class="dot" aria-hidden="true"></span>${t('loading.home', { name })}</div>
      <button class="mobile-menu mobile-only" data-mobile-menu aria-label="${t('nav.open')}" aria-controls="provider-home-nav" aria-expanded="false">${t('nav.menu')}</button>
    </div></header>

    <main class="page provider-home">
      <div class="breadcrumb">${t('breadcrumb', { name })}</div>

      <section class="page-head">
        <div><div class="kicker">${name.toUpperCase()} DATA</div><h1>${t('hero.title', { name })}</h1><p class="lede">${lede}</p></div>
        <div class="head-facts" aria-live="polite">
          <div class="fact"><small>${t('fact.liveObserved')}</small><strong id="home-live-observed">${t('loading.ellipsis')}</strong></div>
          <div class="fact"><small>${t('fact.observedViewers')}</small><strong id="home-observed-viewers">${t('loading.ellipsis')}</strong></div>
          <div class="fact"><small>${t('fact.largestObserved')}</small><strong id="home-largest-observed">${t('loading.ellipsis')}</strong></div>
          <div class="fact"><small>${t('fact.updated')}</small><strong id="home-updated">${t('loading.ellipsis')}</strong></div>
        </div>
      </section>

      <section class="provider-home-status data-strip" aria-label="${t('status.label', { name })}">
        <div class="provider-home-status__title">${t('status.title', { name })}<strong id="home-state">${t('state.loading')}</strong></div>
        <div class="data-strip__cell"><small>${t('fact.updated')}</small><span id="home-strip-updated">${t('loading.ellipsis')}</span></div>
        <div class="data-strip__cell"><small>${t('status.observed')}</small><span id="home-strip-observed">${t('loading.ellipsis')}</span></div>
        <div class="data-strip__cell"><small>${t('status.coverage')}</small><span id="home-strip-coverage">${topLimit}</span></div>
        <div class="data-strip__cell"><small>${t('status.source')}</small><span id="home-strip-source">${t('loading.ellipsis')}</span></div>
        <a class="provider-home-status__link" href="${base}status/">${t('status.open')}</a>
        <div class="provider-home-status__note" id="home-status-note">${t('status.loadingNote', { name })}</div>
      </section>

      <section class="feature-directory" aria-label="${t('analysis.label', { name })}">
        ${featureCards.map(([num, title, copy, slug, id, fallback]) => `<a class="feature-item" href="${base}${slug}/"><span class="num">${num}</span><h3>${title}</h3><p>${copy}</p><div class="feature-item__fact" id="${id}">${fallback}</div></a>`).join('')}
      </section>

      <section class="provider-utility" aria-label="${t('utility.label', { name })}">
        <a class="provider-utility__item" href="${base}watchlist/">
          <span class="provider-utility__mark">${t('utility.mark')}</span>
          <div><h2>${t('utility.title')}</h2><p>${t('utility.copy', { name })}</p></div>
          <strong>${t('utility.open')}</strong>
        </a>
      </section>

      <div class="provider-overview">
        <section class="home-section">
          <div class="rule-title"><h2>${t('live.title')}</h2><span>${t('live.subtitle')}</span></div>
          <div class="surface surface--dark home-surface">
            <table class="home-table" id="home-live-table">
              <caption>${t('live.caption', { name })}</caption>
              <thead><tr><th scope="col">${t('table.rank')}</th><th scope="col">${t('table.channel')}</th><th scope="col" class="home-live-context">${t('table.context')}</th><th scope="col" class="num">${t('table.viewers')}</th><th scope="col" class="num">${t('table.movement')}</th></tr></thead>
              <tbody>${liveRows}</tbody>
            </table>
            <div class="home-table-foot"><span id="home-live-caption">${t('live.loadingRanking')}</span><a href="${base}heatmap/">${t('live.openHeatmap')}</a></div>
          </div>
        </section>

        <aside class="home-section">
          <div class="rule-title"><h2>${t('signals.title')}</h2><span>${t('signals.subtitle')}</span></div>
          <div class="surface surface--dark home-surface"><div class="home-signals signal-list">${signalRows}<p class="home-empty" id="home-signals-empty" hidden>${t('signals.empty')}</p></div></div>
        </aside>
      </div>

      <section>
        <div class="rule-title"><h2>${t('today.title')}</h2><span>${t('today.subtitle')}</span></div>
        <div class="home-today-grid">
          <div class="surface surface--dark">
            <div class="surface__head"><strong>${t('today.overview')}</strong><a class="text-link" href="${base}day-flow/">${t('today.openDayFlow')}</a></div>
            <div class="home-stat-grid">
              <div class="home-stat"><small>${t('today.observedPeak')}</small><strong id="home-today-peak">${t('loading.ellipsis')}</strong></div>
              <div class="home-stat"><small>${t('today.peakTime')}</small><strong id="home-today-time">${t('loading.ellipsis')}</strong></div>
              <div class="home-stat"><small>${t('today.currentObserved')}</small><strong id="home-today-current">${t('loading.ellipsis')}</strong></div>
              <div class="home-stat"><small>${t('today.topViewerMinutes')}</small><strong id="home-today-top">${t('loading.ellipsis')}</strong><span id="home-today-top-value"></span></div>
            </div>
            <div class="home-meter-group">
              <div class="home-meter-row"><span>${t('today.observedPeak')}</span><div class="home-meter" role="progressbar" aria-label="${t('today.peakAria')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="home-meter-peak"></i></div></div>
              <div class="home-meter-row"><span>${t('today.currentObserved')}</span><div class="home-meter" role="progressbar" aria-label="${t('today.currentAria')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="home-meter-current"></i></div></div>
            </div>
          </div>

          <aside class="surface surface--dark">
            <div class="surface__head"><strong>${t('today.motion')}</strong><a class="text-link" href="${base}battle-lines/">${t('today.openBattleLines')}</a></div>
            <div class="home-motion">
              <div class="home-motion__item"><small>${t('today.reversalReview')}</small><strong id="home-today-reversal">${t('loading.ellipsis')}</strong></div>
              <div class="home-motion__item"><small>${t('today.closestPair')}</small><strong id="home-today-battle">${t('loading.ellipsis')}</strong></div>
            </div>
          </aside>
        </div>
      </section>

      <section>
        <div class="rule-title"><h2>${t('recent.title')}</h2><span>${t('recent.subtitle')}</span></div>
        <div class="surface surface--dark">
          <div class="surface__head"><strong>${t('recent.briefing')}</strong><a class="text-link" href="${base}history/">${t('recent.openHistory')}</a></div>
          <div class="surface__body home-recent-grid">
            <div class="home-recent-stats">
              <div class="home-recent-stat"><small>${t('recent.latestDay')}</small><strong id="home-recent-day">${t('loading.ellipsis')}</strong></div>
              <div class="home-recent-stat"><small>${t('recent.topStreamer')}</small><strong id="home-recent-top">${t('loading.ellipsis')}</strong><span id="home-recent-top-value"></span></div>
              <div class="home-recent-stat"><small>${t('recent.biggestRise')}</small><strong id="home-recent-rise">${t('loading.ellipsis')}</strong><span id="home-recent-rise-value"></span></div>
              <div class="home-recent-stat"><small>${t('recent.coverageQuality')}</small><strong id="home-recent-coverage">${t('loading.ellipsis')}</strong></div>
            </div>
            <div class="home-trend" aria-label="${t('recent.chartAria')}"><p class="home-trend-empty" id="home-trend-empty">${t('recent.loadingTrend')}</p>${trendBars}</div>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer"><div>${t('footer.disclaimer')}</div><nav><a href="${route('/changelog/')}">${t('nav.changelog')}</a><a href="${route('/about/')}">${t('footer.method')}</a><a href="${route('/support/')}">${t('nav.support')}</a><a href="https://docs.google.com/forms/d/e/1FAIpQLSdhreuxEz7w0eSjslTyVLL-axV6IJdTp5RU5VXCM3ApIz35-Q/viewform?usp=dialog" target="_blank" rel="noreferrer">${t('footer.contact')}</a><a href="https://github.com/badjoke-lab/viewloom">GitHub</a></nav></footer>
  </div>`
}