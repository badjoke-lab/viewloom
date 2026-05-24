if (document.body.dataset.page === 'kick') {
  document.querySelectorAll('.feature-grid--top .feature-card').forEach((card) => card.remove())
  const grid = document.querySelector('.feature-grid--top')
  grid?.insertAdjacentHTML(
    'beforeend',
    '<article class="feature-card feature-card--top"><div class="feature-card__label">NOW</div><h2>Heatmap</h2><p>Read who is big, rising, or active now.</p><a class="button button--ghost feature-card__link" href="/kick/heatmap/">Open Heatmap</a></article><article class="feature-card feature-card--top"><div class="feature-card__label">TODAY</div><h2>Day Flow</h2><p>Read the daily audience terrain.</p><a class="button button--ghost feature-card__link" href="/kick/day-flow/">Open Day Flow</a></article><article class="feature-card feature-card--top"><div class="feature-card__label">RIVALRY</div><h2>Battle Lines</h2><p>Read rivalry, reversals, and pressure.</p><a class="button button--ghost feature-card__link" href="/kick/battle-lines/">Open Battle Lines</a></article><article class="feature-card feature-card--top"><div class="feature-card__label">TRENDS</div><h2>History & Trends</h2><p>Review observed days and changes.</p><a class="button button--ghost feature-card__link" href="/kick/history/">Open History</a></article>',
  )
}
