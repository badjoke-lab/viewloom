const params = new URLSearchParams(window.location.search)

if (params.get('bandFocus') === 'reverse') {
  document.documentElement.dataset.dayflowBandFocus = 'reverse'
}
