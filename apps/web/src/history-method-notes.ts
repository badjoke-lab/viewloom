const coverage = document.querySelector<HTMLElement>('#history-coverage')

if (coverage && !document.querySelector('[data-history-method-notes]')) {
  const section = document.createElement('section')
  section.className = 'history-method-grid'
  section.dataset.historyMethodNotes = 'true'
  section.innerHTML = `
    <article class="history-method-card">
      <div class="history-method-card__label">Metric</div>
      <h2>Viewer-minutes</h2>
      <p>Approximate observed audience volume across the selected period. A stream with more viewers for longer time ranks higher.</p>
    </article>
    <article class="history-method-card">
      <div class="history-method-card__label">Metric</div>
      <h2>Peak viewers</h2>
      <p>The highest observed viewer value in the selected period. It highlights spikes, but not necessarily sustained strength.</p>
    </article>
    <article class="history-method-card">
      <div class="history-method-card__label">Quality</div>
      <h2>Coverage</h2>
      <p>Coverage shows whether the selected days had enough observed snapshots. Partial or missing days can make rankings incomplete.</p>
    </article>
  `
  coverage.insertAdjacentElement('afterend', section)
}
