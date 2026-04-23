export function shouldUseCanvasRenderer(): boolean {
  const params = new URLSearchParams(window.location.search)
  const query = params.get('heatmapRenderer')
  const saved = window.localStorage.getItem('viewloom.heatmap.renderer')
  return query === 'canvas' || saved === 'canvas'
}
