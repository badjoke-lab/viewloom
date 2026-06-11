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
const viewportPath = 'src/live/heatmap-viewport-v2.ts'
const contractPath = 'docs/heatmap-qa-contract.md'

for (const path of [...heatmapPages, viewportPath, contractPath]) requireFile(path)

for (const path of heatmapPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, '/src/live/heatmap-current-shell-entry.ts')
  requireFragment(path, source, 'chart-placeholder--heatmap')
  requireFragment(path, source, 'data-page=')
  forbidPattern(path, source, 'legacy static heatmap grid', /class="heatmap-grid"/)
  forbidPattern(path, source, 'static Stream tile labels', /data-name="Stream [A-Z]"|>Stream [A-Z]</)
}

if (existsSync(join(root, viewportPath))) {
  const source = read(viewportPath)
  requireFragment(viewportPath, source, 'function coverScale')
  requireFragment(viewportPath, source, 'Math.max(widthScale, heightScale)')
  requireFragment(viewportPath, source, 'COVER_OVERSCAN')
  requireFragment(viewportPath, source, 'function clampTranslation')
  requireFragment(viewportPath, source, 'clampTranslation(nextScale)')
  requireFragment(viewportPath, source, 'clampTranslation(getScale())')
  forbidPattern(viewportPath, source, 'contain-fit scaling', /Math\.min\(widthScale, heightScale\)/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'cover-fit scaling')
  requireFragment(contractPath, source, 'static `Stream A` tile grids')
}

if (failures.length > 0) {
  console.error('ViewLoom Heatmap QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Heatmap QA verification passed for ${heatmapPages.length} Heatmap pages.`)
