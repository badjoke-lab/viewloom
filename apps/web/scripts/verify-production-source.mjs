import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

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

const featurePages = pages.filter((path) => path.includes('/heatmap/') || path.includes('/day-flow/') || path.includes('/battle-lines/') || path.includes('/history/') || path.includes('/status/'))
const providerHomePages = ['twitch/index.html', 'kick/index.html']
const contentPages = ['about/index.html', 'support/index.html']

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
]

const forbiddenSourcePatterns = [
  { path: 'src/mock-site.ts', label: 'legacy static heatmap grid behavior', pattern: /heatmap-grid|data-selected-name|data-selected-viewers|data-selected-momentum/ },
]

const connectedFeatureContracts = [
  {
    path: 'twitch/heatmap/index.html',
    required: ['/src/live/heatmap-current-shell-entry.ts', 'data-page="twitch-heatmap"', 'chart-placeholder--heatmap'],
    forbidden: [/class="heatmap-grid"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'kick/heatmap/index.html',
    required: ['/src/live/heatmap-current-shell-entry.ts', 'data-page="kick-heatmap"', 'chart-placeholder--heatmap'],
    forbidden: [/class="heatmap-grid"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'twitch/day-flow/index.html',
    required: ['/src/live/day-flow-current-shell-entry.ts', 'class="dayflow-stage"', 'data-dayflow-inspector'],
    forbidden: [/<svg viewBox="0 0 1210 620"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'kick/day-flow/index.html',
    required: ['/src/live/day-flow-current-shell-entry.ts', 'class="dayflow-stage"', 'data-dayflow-inspector'],
    forbidden: [/<svg viewBox="0 0 1210 620"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'twitch/battle-lines/index.html',
    required: ['/src/live/battle-lines-current-shell-entry.ts', 'class="battle-stage"', 'data-battle-summary', 'data-battle-feed'],
    forbidden: [/<svg viewBox="0 0 1210 560"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'kick/battle-lines/index.html',
    required: ['/src/live/battle-lines-current-shell-entry.ts', 'class="battle-stage"', 'data-battle-summary', 'data-battle-feed'],
    forbidden: [/<svg viewBox="0 0 1210 560"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</],
  },
  {
    path: 'twitch/history/index.html',
    required: ['/src/live/history-current-shell-entry.ts', 'class="history-stage"', 'data-history-summary', 'data-history-notes'],
    forbidden: [/<svg viewBox="0 0 1210 560"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</, /Stream A|Stream B|Stream C/],
  },
  {
    path: 'kick/history/index.html',
    required: ['/src/live/history-current-shell-entry.ts', 'class="history-stage"', 'data-history-summary', 'data-history-notes'],
    forbidden: [/<svg viewBox="0 0 1210 560"/, /data-name="Stream [A-Z]"/, />Stream [A-Z]</, /Stream A|Stream B|Stream C/],
  },
  {
    path: 'twitch/status/index.html',
    required: ['/src/live/status-current-shell-entry.ts', 'class="status-board"', 'class="metric-ledger"'],
    forbidden: [/>\s*Fresh\s*</, /Shell ready for real data/i],
  },
  {
    path: 'kick/status/index.html',
    required: ['/src/live/status-current-shell-entry.ts', 'class="status-board"', 'class="metric-ledger"'],
    forbidden: [/>\s*Fresh\s*</, /Shell ready for real data/i],
  },
]

const requiredPageFragments = [
  '<span class="brand-mark">VL</span>',
  'ViewLoom<small>Live data observatory</small>',
  'class="masthead"',
  'class="masthead__inner"',
  'class="global-nav"',
  'href="/twitch/"',
  'href="/kick/"',
  'href="/about/"',
  'href="/support/"',
  'class="status-inline"',
  'class="mobile-menu mobile-only"',
  'class="page',
  'class="breadcrumb"',
  'class="page-head"',
  'class="kicker"',
  'class="lede"',
  'class="head-facts"',
  'class="footer"',
  '/src/mock-site.css',
  '/src/mock-site.ts',
  '/src/analytics.ts',
]

const featurePageFragments = [
  'class="feature-tabs"',
  'class="data-strip"',
  'class="data-strip__title"',
  'class="data-strip__cell"',
]

const portalFragments = [
  'class="portal-grid"',
  'portal-panel--twitch',
  'portal-panel--kick',
  'class="portal-panel__stats"',
  'class="signal-list"',
]

const providerHomeFragments = [
  'class="overview-grid"',
  'class="view-card"',
  'class="signal-list"',
]

const contentPageFragments = [
  'class="prose"',
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

const featureTabExpectations = [
  'Heatmap',
  'Day Flow',
  'Battle Lines',
  'History',
  'Status',
]

const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFragments(path, source, fragments) {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${path}: missing required shell fragment: ${fragment}`)
  }
}

for (const path of pages) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing public page`)
}

for (const path of pages) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)

  requireFragments(path, source, requiredPageFragments)

  if (path === 'index.html') requireFragments(path, source, portalFragments)
  if (providerHomePages.includes(path)) requireFragments(path, source, providerHomeFragments)
  if (featurePages.includes(path)) {
    requireFragments(path, source, featurePageFragments)
    for (const tab of featureTabExpectations) {
      if (!source.includes(`>${tab}</a>`)) failures.push(`${path}: missing feature tab ${tab}`)
    }
  }
  if (contentPages.includes(path)) requireFragments(path, source, contentPageFragments)

  for (const { label, pattern } of forbiddenGlobalPatterns) {
    if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
  }
}

for (const { path, provider } of providerExpectations) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  if (!source.includes(`data-provider="${provider}"`)) failures.push(`${path}: expected data-provider="${provider}"`)
}

for (const contract of connectedFeatureContracts) {
  if (!existsSync(join(root, contract.path))) {
    failures.push(`${contract.path}: missing connected feature page`)
    continue
  }
  const source = read(contract.path)
  for (const fragment of contract.required) {
    if (!source.includes(fragment)) failures.push(`${contract.path}: missing live renderer contract fragment: ${fragment}`)
  }
  for (const pattern of contract.forbidden) {
    if (pattern.test(source)) failures.push(`${contract.path}: contains forbidden static/mock feature body pattern: ${pattern}`)
  }
}

const sourceFiles = [
  'vite.config.ts',
  'src/mock-site.css',
  'src/mock-site.ts',
  'src/live/heatmap-current-shell-entry.ts',
  'src/live/day-flow-current-shell-entry.ts',
  'src/live/battle-lines-current-shell-entry.ts',
  'src/live/history-current-shell-entry.ts',
  'src/live/status-current-shell-entry.ts',
  'src/battle-lines-visual-polish.ts',
  'src/history-unify.ts',
]

for (const path of sourceFiles) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing source file`)
}

for (const path of sourceFiles.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  for (const { label, pattern } of forbiddenGlobalPatterns.slice(0, 4)) {
    if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
  }
}

for (const { path, label, pattern } of forbiddenSourcePatterns) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
}

if (existsSync(join(root, 'src/mock-cutover.css'))) failures.push('src/mock-cutover.css: must not exist')
if (existsSync(join(root, 'src/mock-cutover.ts'))) failures.push('src/mock-cutover.ts: must not exist')

if (failures.length > 0) {
  console.error('ViewLoom production source verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom production source verification passed for ${pages.length} public pages and ${connectedFeatureContracts.length} live feature contracts.`)
