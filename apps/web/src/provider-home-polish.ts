export {}

const page = document.body.dataset.page
const provider = page === 'kick' ? 'kick' : page === 'twitch' ? 'twitch' : null

if (provider) {
  applyProviderHomePolish(provider)
}

function applyProviderHomePolish(kind: 'twitch' | 'kick'): void {
  const isKick = kind === 'kick'
  const providerLabel = isKick ? 'Kick' : 'Twitch'
  const basePath = `/${kind}`
  const heroCopy = document.querySelector<HTMLElement>('.hero .hero-copy')
  const secondaryCopy = document.querySelector<HTMLElement>('.hero .hero-copy--secondary')
  const statusRail = document.querySelector<HTMLElement>('.rail-card--status')
  const featureGrid = document.querySelector<HTMLElement>('.feature-grid--top')

  if (heroCopy) {
    heroCopy.textContent = isKick
      ? 'ViewLoom is an unofficial observation view for Kick live activity. Coverage, available signals, and source modes may differ from Twitch.'
      : 'ViewLoom is an unofficial observation view for Twitch live activity. Data may be delayed, partial, or unavailable depending on collection status.'
  }

  if (secondaryCopy) {
    secondaryCopy.textContent = isKick
      ? 'Use Heatmap, Day Flow, Battle Lines, and History as separate reads. Check Kick Data Status before treating coverage as complete.'
      : 'Use Heatmap, Day Flow, Battle Lines, and History as separate reads. Check Twitch Data Status before treating coverage as fresh or complete.'
  }

  if (statusRail) {
    statusRail.innerHTML = `
      <div class="rail-card__label">Data Status</div>
      <p>Coverage, freshness, source mode, and known limitations belong in ${providerLabel} Data Status.</p>
      <a class="button button--secondary" href="${basePath}/status/">Open Data Status</a>
    `
  }

  if (featureGrid && !featureGrid.querySelector('[data-provider-home-extra="history"]')) {
    featureGrid.insertAdjacentHTML('beforeend', `
      <article class="feature-card feature-card--top" data-provider-home-extra="history">
        <div class="feature-card__label">Trends</div>
        <h2>History</h2>
        <p>Review observed days, top streamers, daily peaks, viewer-minutes, and longer-range changes.</p>
        <a class="button button--ghost feature-card__link" href="${basePath}/history/">Open History</a>
      </article>
      <article class="feature-card feature-card--top" data-provider-home-extra="status">
        <div class="feature-card__label">Coverage</div>
        <h2>Data Status</h2>
        <p>Check freshness, source mode, coverage quality, and provider-specific limitations before judging the charts.</p>
        <a class="button button--ghost feature-card__link" href="${basePath}/status/">Open Data Status</a>
      </article>
    `)
  }
}
