import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const pages = [
  'index.html', 'about/index.html', 'support/index.html',
  'twitch/index.html', 'twitch/heatmap/index.html', 'twitch/day-flow/index.html',
  'twitch/battle-lines/index.html', 'twitch/history/index.html', 'twitch/status/index.html',
  'kick/index.html', 'kick/heatmap/index.html', 'kick/day-flow/index.html',
  'kick/battle-lines/index.html', 'kick/history/index.html', 'kick/status/index.html',
]

const read = (path) => readFileSync(join(root, path), 'utf8')
const requireText = (path, source, text) => {
  if (!source.includes(text)) failures.push(`${path}: missing mobile QA fragment: ${text}`)
}
const forbidText = (path, source, text) => {
  if (source.includes(text)) failures.push(`${path}: contains forbidden mobile regression: ${text}`)
}

for (const path of pages) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing public page`)
    continue
  }
  const source = read(path)
  for (const text of [
    '<meta name="viewport" content="width=device-width, initial-scale=1.0"',
    'class="site-frame"', 'class="masthead"', 'class="global-nav"',
    'mobile-menu mobile-only', 'data-mobile-menu', 'aria-label="Open navigation"',
    'class="footer"',
  ]) requireText(path, source, text)
  if (!source.includes('class="page') && !source.includes(' page ')) {
    failures.push(`${path}: missing mobile QA page shell`)
  }
}

for (const path of pages.filter((value) => /\/(heatmap|day-flow|battle-lines|history|status)\//.test(value))) {
  requireText(path, read(path), 'class="feature-tabs"')
}

for (const path of ['twitch/history/index.html', 'kick/history/index.html']) {
  requireText(path, read(path), 'class="layout-split"')
}

for (const path of ['twitch/heatmap/index.html', 'kick/heatmap/index.html']) {
  const source = read(path)
  for (const text of [
    'class="heatmap-wrap', 'id="heatmap-layout-root"', 'data-layout="wide"',
    'data-heatmap-layout="wide"', 'data-heatmap-layout="split"',
    'id="heatmap-map-controls"',
  ]) requireText(path, source, text)
  forbidText(path, source, 'class="layout-split"')
}

for (const path of ['twitch/day-flow/index.html', 'kick/day-flow/index.html']) {
  const source = read(path)
  for (const text of [
    'dayflow-layout-shell', 'is-split', 'data-dayflow-layout="split"',
    'data-dayflow-layout="wide"', '@media(max-width:760px)', 'touch-action:none',
  ]) requireText(path, source, text)
  requireText(path, source, 'class="toolbar')
}

for (const path of ['twitch/battle-lines/index.html', 'kick/battle-lines/index.html']) {
  const source = read(path)
  for (const text of [
    '/src/live/battle-lines-wide.css', 'class="battle-controls"', 'class="battle-stage"',
    'data-battle-inspector', 'data-battle-reversals', 'data-battle-secondary',
  ]) requireText(path, source, text)
  forbidText(path, source, 'class="layout-split"')
}

for (const path of [
  'twitch/history/index.html', 'twitch/status/index.html',
  'kick/history/index.html', 'kick/status/index.html',
]) requireText(path, read(path), 'class="metric-ledger')

const cssChecks = {
  'src/mock-site.css': [
    '@media (max-width:760px)', '.global-nav{display:none}', '.mobile-menu{display:block',
    '.mobile-only{display:block}', '.page,.page--full{padding:18px 14px 52px}',
    '.layout-split,.provider-overview,.history-columns{grid-template-columns:1fr}',
    '.data-strip{grid-template-columns:1fr 1fr}', '.feature-tabs,.provider-tabs{margin-left:-14px',
    '.toolbar{overflow-x:auto;flex-wrap:nowrap', '.footer{padding:16px 14px 28px;display:block}',
  ],
  'src/features/heatmap-page/layout-mode.css': [
    '@media (max-width:1000px)', '@media (max-width:760px)',
    ".heatmap-layout[data-layout='split']", 'grid-template-columns:1fr', 'height:62vh',
  ],
  'src/dayflow-layout-summary.css': [
    '@media (max-width: 1000px)', '.dayflow-layout-shell.is-split',
    'grid-template-columns: minmax(0, 1fr)', '[data-dayflow-layout-stack]', 'display: none',
  ],
  'src/live/battle-lines-wide.css': [
    '@media(max-width:760px)', '.battle-controls{display:flex;overflow-x:auto',
    '.pair-inspector{grid-template-columns:1fr}', '.secondary-grid,.event-feed{grid-template-columns:1fr}',
    '.battle-chart-wrap{min-height:330px',
  ],
}

for (const [path, fragments] of Object.entries(cssChecks)) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing responsive CSS`)
    continue
  }
  const source = read(path)
  for (const fragment of fragments) requireText(path, source, fragment)
}

const contractPath = 'docs/mobile-qa-contract.md'
if (!existsSync(join(root, contractPath))) failures.push(`${contractPath}: missing mobile QA contract`)
else for (const text of ['Mobile QA Contract', 'viewport metadata', 'shared responsive breakpoints']) {
  requireText(contractPath, read(contractPath), text)
}

if (failures.length) {
  console.error('ViewLoom Mobile QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Mobile QA verification passed for ${pages.length} public pages, including Wide-first Heatmap, Split-default Day Flow, and Wide Battle Lines.`)
