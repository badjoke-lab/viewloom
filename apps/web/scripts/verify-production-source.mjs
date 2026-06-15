import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

const pages = [
  'index.html',
  'about/index.html',
  'support/index.html',
  'twitch/index.html',
  'twitch/heatmap/index.html',
  'twitch/day-flow/index.html',
  'twitch/battle-lines/index.html',
  'twitch/history/index.html',
  'twitch/status/index.html',
  'kick/index.html',
  'kick/heatmap/index.html',
  'kick/day-flow/index.html',
  'kick/battle-lines/index.html',
  'kick/history/index.html',
  'kick/status/index.html',
]

const providerExpectations = [
  { path: 'index.html', provider: 'portal' },
  { path: 'about/index.html', provider: 'portal' },
  { path: 'support/index.html', provider: 'portal' },
  { path: 'twitch/index.html', provider: 'twitch' },
  { path: 'twitch/heatmap/index.html', provider: 'twitch' },
  { path: 'twitch/day-flow/index.html', provider: 'twitch' },
  { path: 'twitch/battle-lines/index.html', provider: 'twitch' },
  { path: 'twitch/history/index.html', provider: 'twitch' },
  { path: 'twitch/status/index.html', provider: 'twitch' },
  { path: 'kick/index.html', provider: 'kick' },
  { path: 'kick/heatmap/index.html', provider: 'kick' },
  { path: 'kick/day-flow/index.html', provider: 'kick' },
  { path: 'kick/battle-lines/index.html', provider: 'kick' },
  { path: 'kick/history/index.html', provider: 'kick' },
  { path: 'kick/status/index.html', provider: 'kick' },
]

const liveEntryContracts = [
  { path: 'twitch/heatmap/index.html', entry: '/src/live/heatmap-current-shell-entry.ts' },
  { path: 'kick/heatmap/index.html', entry: '/src/live/heatmap-current-shell-entry.ts' },
  { path: 'twitch/day-flow/index.html', entry: '/src/live/day-flow-current-shell-entry.ts' },
  { path: 'kick/day-flow/index.html', entry: '/src/live/day-flow-current-shell-entry.ts' },
  { path: 'twitch/battle-lines/index.html', entry: '/src/live/battle-lines-current-shell-entry.ts' },
  { path: 'kick/battle-lines/index.html', entry: '/src/live/battle-lines-current-shell-entry.ts' },
  { path: 'twitch/history/index.html', entry: '/src/live/history-current-shell-entry.ts' },
  { path: 'kick/history/index.html', entry: '/src/live/history-current-shell-entry.ts' },
  { path: 'twitch/status/index.html', entry: '/src/live/status-current-shell-entry.ts' },
  { path: 'kick/status/index.html', entry: '/src/live/status-current-shell-entry.ts' },
]

const requiredShellFragments = [
  '<span class="brand-mark">VL</span>',
  'ViewLoom<small>Live data observatory</small>',
  'class="masthead"',
  'class="global-nav"',
  'href="/twitch/"',
  'href="/kick/"',
  'href="/about/"',
  'href="/support/"',
  'class="page',
  'class="breadcrumb"',
  'class="footer"',
  '/src/mock-site.css',
  '/src/mock-site.ts',
  '/src/analytics.ts',
]

const requiredSourceFiles = [
  'vite.config.ts',
  'src/mock-site.css',
  'src/mock-site.ts',
  'src/live/heatmap-current-shell-entry.ts',
  'src/live/twitch-heatmap.ts',
  'src/features/twitch-heatmap/canvas-scene.ts',
  'src/live/day-flow-current-shell-entry.ts',
  'src/live/battle-lines-current-shell-entry.ts',
  'src/live/history-current-shell-entry.ts',
  'src/live/status-current-shell-entry.ts',
]

const forbiddenGlobalPatterns = [
  { label: 'failed cutover runtime', pattern: /mock-cutover/ },
  { label: 'failed cutover plugin', pattern: /mockCutoverPlugin/ },
  { label: 'public redesign mock label', pattern: /redesign mock/i },
  { label: 'public Portal mock label', pattern: /Portal mock/i },
  { label: 'old fake Twitch live number', pattern: />\s*287\s*</ },
  { label: 'old fake Twitch largest number', pattern: /118\.4K/ },
  { label: 'old fake Kick live number', pattern: />\s*83\s*</ },
  { label: 'old fake Kick largest number', pattern: /42\.7K/ },
  { label: 'old fake observed total', pattern: /1\.86M observed/ },
  { label: 'old fake UTC observation timestamp', pattern: /12:40 UTC|12:25 UTC|11:55 UTC/ },
  { label: 'legacy heatmap grid shell', pattern: /class="heatmap-grid"/ },
]

const forbiddenSourcePatterns = [
  { path: 'src/mock-site.ts', label: 'legacy static heatmap behavior', pattern: /data-selected-name|data-selected-viewers|data-selected-momentum/ },
  { path: 'src/live/twitch-heatmap.ts', label: 'legacy renderer switch', pattern: /shouldUseCanvasRenderer/ },
  { path: 'src/live/twitch-heatmap.ts', label: 'legacy DOM viewport', pattern: /createHeatmapViewport|heatmap-viewport-v2/ },
  { path: 'src/live/twitch-heatmap.ts', label: 'legacy DOM tile renderer', pattern: /renderHeatmapShell|renderTile\(/ },
  { path: 'src/live/twitch-heatmap.ts', label: 'legacy CSS transform renderer', pattern: /translate3d\(/ },
]

const removedHeatmapFiles = [
  'src/live/heatmap-viewport.ts',
  'src/live/heatmap-viewport-v2.ts',
  'src/live/heatmap-layout.ts',
  'src/live/heatmap-live-shell.ts',
  'src/live/heatmap-treemap.ts',
  'src/live/heatmap-inspector.ts',
]

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFragments(path, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path}: missing required production shell fragment: ${fragment}`)
  }
}

function forbidPatterns(path, source, patterns) {
  for (const { label, pattern } of patterns) {
    if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
  }
}

for (const path of pages) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing public page`)
}

for (const path of pages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragments(path, source, requiredShellFragments)
  forbidPatterns(path, source, forbiddenGlobalPatterns)
}

for (const { path, provider } of providerExpectations) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  if (!source.includes(`data-provider="${provider}"`)) failures.push(`${path}: expected data-provider="${provider}"`)
}

for (const { path, entry } of liveEntryContracts) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  if (!source.includes(entry)) failures.push(`${path}: missing live entry ${entry}`)
}

for (const path of requiredSourceFiles) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required production source file`)
}

for (const path of requiredSourceFiles.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  forbidPatterns(path, source, forbiddenGlobalPatterns.slice(0, 4))
}

for (const { path, label, pattern } of forbiddenSourcePatterns) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
}

for (const path of removedHeatmapFiles) {
  if (existsSync(join(root, path))) failures.push(`${path}: legacy Heatmap file must not exist in production source`)
}

if (existsSync(join(root, 'src/mock-cutover.css'))) failures.push('src/mock-cutover.css: must not exist')
if (existsSync(join(root, 'src/mock-cutover.ts'))) failures.push('src/mock-cutover.ts: must not exist')

if (failures.length > 0) {
  console.error('ViewLoom production source verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom production source verification passed for ${pages.length} public pages and ${liveEntryContracts.length} live entry contracts.`)
