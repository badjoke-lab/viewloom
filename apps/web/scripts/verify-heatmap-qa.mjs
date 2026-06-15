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

const heatmapPages = ['twitch/heatmap/index.html', 'kick/heatmap/index.html']
const productionPath = 'src/live/twitch-heatmap.ts'
const scenePath = 'src/features/twitch-heatmap/canvas-scene.ts'
const cameraPath = 'src/features/twitch-heatmap/interactions/camera-core.mjs'
const layoutModePath = 'src/features/heatmap-page/layout-mode.ts'
const contractPath = 'docs/heatmap-qa-contract.md'

for (const path of [...heatmapPages, productionPath, scenePath, cameraPath, layoutModePath, contractPath]) requireFile(path)

for (const path of heatmapPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/heatmap-current-shell-entry.ts')
  requireFragment(path, source, 'chart-placeholder--heatmap')
  requireFragment(path, source, 'id="heatmap-inspector"')
  requireFragment(path, source, 'data-page=')
  forbidPattern(path, source, 'legacy static heatmap grid', /class="heatmap-grid"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
  forbidPattern(path, source, 'static legacy inspector metrics', /id="heatmap-detail-title"|heatmap-live-detail-grid/)
}

if (existsSync(join(root, productionPath))) {
  const source = read(productionPath)
  requireFragment(productionPath, source, 'destroyCanvasScene')
  requireFragment(productionPath, source, 'renderCanvasScene({')
  requireFragment(productionPath, source, "cache: 'no-store'")
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
