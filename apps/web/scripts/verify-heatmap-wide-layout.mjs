import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

const twitch = read('../twitch/heatmap/index.html')
const kick = read('../kick/heatmap/index.html')
const layout = read('../src/features/heatmap-page/layout-mode.ts')
const layoutCss = read('../src/features/heatmap-page/layout-mode.css')
const supportCss = read('../src/features/heatmap-page/layout-support.css')
const adapter = read('../src/features/heatmap-page/data-truth-adapter.ts')
const canvasScene = read('../src/features/twitch-heatmap/canvas-scene.ts')

for (const [name, source] of [['Twitch', twitch], ['Kick', kick]]) {
  assert.match(source, /data-heatmap-layout="wide"/, `${name} page must start Wide`)
  assert.match(source, /data-heatmap-layout-controls/, `${name} page must expose layout controls`)
  assert.match(source, /data-heatmap-layout="wide"[^>]*aria-pressed="true"/, `${name} Wide control must be active`)
  assert.match(source, /data-heatmap-layout="split"[^>]*aria-pressed="false"/, `${name} Split control must be available on desktop`)
  assert.match(source, /id="heatmap-map-controls"/, `${name} page must expose the external map-control host`)
  assert.match(source, /id="heatmap-layout-root"[^>]*data-layout="wide"/, `${name} layout root must start Wide`)
  assert.match(source, /id="heatmap-inspector"/, `${name} page must preserve the inspector`)
  assert.match(source, /support-grid--feature/, `${name} page must preserve support cards`)
  assert.doesNotMatch(source, /class="layout-split"/, `${name} page must not be permanently Split`)
}

assert.match(layout, /type HeatmapLayoutMode = 'wide' \| 'split'/)
assert.match(layout, /viewloom\.heatmap\.layout/)
assert.match(layout, /url\.searchParams\.set\(QUERY_KEY, resolved\)/)
assert.match(layout, /value === 'wide' \|\| value === 'theater'/)
assert.match(layout, /return 'wide'/)
assert.match(layout, /viewloom:heatmap-layout-change/)
assert.match(layout, /MOBILE_WIDE_QUERY/)

assert.match(layoutCss, /\.heatmap-layout\[data-layout='wide'\]/)
assert.match(layoutCss, /\.heatmap-layout\[data-layout='split'\]/)
assert.match(layoutCss, /\.heatmap-control-dock/)
assert.match(layoutCss, /grid-template-columns:minmax\(0,1fr\) var\(--heatmap-rail-width\)/)
assert.match(supportCss, /grid-column: 1 \/ -1/)

assert.match(adapter, /installHeatmapLayoutMode/)
assert.match(adapter, /layout-support\.css/)

assert.match(canvasScene, /ensureMapControlsHost/)
assert.match(canvasScene, /#heatmap-map-controls/)
assert.match(canvasScene, /heatmap-map-control/)
assert.doesNotMatch(canvasScene, /heatmap-canvas-toolbar/)
assert.doesNotMatch(canvasScene, /heatmap-canvas-toolbar__group/)
assert.match(canvasScene, /ResizeObserver/)

console.log('Heatmap Wide-first layout verification passed.')
