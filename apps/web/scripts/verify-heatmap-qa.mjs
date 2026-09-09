import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Heatmap QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Heatmap QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Heatmap regression: ${label}`)
}

const heatmapPages = [
  'twitch/heatmap/index.html',
  'kick/heatmap/index.html',
  'ja/twitch/heatmap/index.html',
  'ja/kick/heatmap/index.html',
]
const japaneseHeatmapPages = new Set([
  'ja/twitch/heatmap/index.html',
  'ja/kick/heatmap/index.html',
])
const productionPath = 'src/live/twitch-heatmap.ts'
const scenePath = 'src/features/twitch-heatmap/canvas-scene.ts'
const cameraPath = 'src/features/twitch-heatmap/interactions/camera-core.mjs'
const layoutModePath = 'src/features/heatmap-page/layout-mode.ts'
const localizedControlsPath = 'src/features/heatmap-page/localized-controls.ts'
const heatmapCatalogPath = 'src/i18n/heatmap.ts'
const canvasCatalogPath = 'src/i18n/heatmap-canvas.ts'
const contractPath = 'docs/heatmap-qa-contract.md'

for (const path of [
  ...heatmapPages,
  productionPath,
  scenePath,
  cameraPath,
  layoutModePath,
  localizedControlsPath,
  heatmapCatalogPath,
  canvasCatalogPath,
  contractPath,
]) requireFile(path)

for (const path of heatmapPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/heatmap-current-shell-entry.ts')
  requireFragment(path, source, 'chart-placeholder--heatmap')
  requireFragment(path, source, 'id="heatmap-inspector"')
  requireFragment(path, source, 'data-page=')
  forbidPattern(path, source, 'legacy static heatmap grid', /class="heatmap-grid"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
  forbidPattern(path, source, 'static legacy inspector metrics', /id="heatmap-detail-title"|heatmap-live-detail-grid/)

  if (japaneseHeatmapPages.has(path)) {
    requireFragment(path, source, '<html lang="ja">')
    requireFragment(path, source, '<meta name="robots" content="noindex,follow" />')
    requireFragment(path, source, '観測日の集計基準はUTCです。')
    forbidPattern(path, source, 'premature hreflang exposure', /hreflang=/i)
    const provider = path.includes('/twitch/') ? 'twitch' : 'kick'
    requireFragment(path, source, `<link rel="canonical" href="https://www.viewloom.net/ja/${provider}/heatmap/" />`)
  }
}

if (existsSync(join(root, productionPath))) {
  const source = read(productionPath)
  requireFragment(productionPath, source, 'destroyCanvasScene')
  requireFragment(productionPath, source, 'renderCanvasScene({')
  requireFragment(productionPath, source, "cache: 'no-store'")
  requireFragment(productionPath, source, 'installLocalizedHeatmapControls')
  forbidPattern(productionPath, source, 'legacy renderer switch', /shouldUseCanvasRenderer/)
  forbidPattern(productionPath, source, 'legacy DOM viewport', /createHeatmapViewport|heatmap-viewport-v2/)
  forbidPattern(productionPath, source, 'legacy DOM tiles', /renderHeatmapShell|renderTile\(/)
}

if (existsSync(join(root, scenePath))) {
  const source = read(scenePath)
  requireFragment(scenePath, source, 'clampCameraToWorld')
  requireFragment(scenePath, source, 'viewloom:heatmap-layout-change')
  requireFragment(scenePath, source, 'findDirectionalNodeIndex')
  requireFragment(scenePath, source, 'viewloom:heatmap-selection-change')
}

if (existsSync(join(root, cameraPath))) {
  const source = read(cameraPath)
  requireFragment(cameraPath, source, 'scaledWidth <= safeBounds.viewportWidth')
  requireFragment(cameraPath, source, 'scaledHeight <= safeBounds.viewportHeight')
  requireFragment(cameraPath, source, 'clampCameraToWorld')
}

if (existsSync(join(root, layoutModePath))) {
  const source = read(layoutModePath)
  requireFragment(layoutModePath, source, "const MOBILE_WIDE_QUERY = '(max-width: 760px)'")
  requireFragment(layoutModePath, source, "const resolved: HeatmapLayoutMode = media.matches ? 'wide' : next")
}

if (existsSync(join(root, localizedControlsPath))) {
  const source = read(localizedControlsPath)
  requireFragment(localizedControlsPath, source, "localeFromPathname(window.location.pathname)")
  requireFragment(localizedControlsPath, source, "if (locale !== 'ja')")
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'Canvas scene')
  requireFragment(contractPath, source, '0 / 1 / 20 / 100 / 300 / 500')
  requireFragment(contractPath, source, 'retired DOM tile renderer')
}

if (failures.length > 0) {
  console.error('ViewLoom Heatmap QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Heatmap QA verification passed for ${heatmapPages.length} Heatmap pages.`)
console.log('- English and hidden Japanese Heatmap routes share the same runtime entry and Canvas renderer contract.')
console.log('- Japanese Heatmap candidates remain noindex/self-canonical/hreflang-hidden before J10.')
