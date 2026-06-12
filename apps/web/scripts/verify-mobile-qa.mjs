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

const featurePages = pages.filter((path) => path.includes('/heatmap/') || path.includes('/day-flow/') || path.includes('/battle-lines/') || path.includes('/history/') || path.includes('/status/'))
const visualPages = pages.filter((path) => path.includes('/heatmap/') || path.includes('/day-flow/') || path.includes('/battle-lines/') || path.includes('/history/'))
const toolbarPages = pages.filter((path) => path.includes('/day-flow/') || path.includes('/battle-lines/'))
const ledgerPages = pages.filter((path) => path.includes('/history/') || path.includes('/status/'))

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing mobile QA fragment: ${fragment}`)
}

function requirePattern(path, source, label, pattern) {
  if (!pattern.test(source)) failures.push(`${path}: missing mobile QA pattern: ${label}`)
}

for (const path of pages) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing public page`)
    continue
  }
  const source = read(path)
  requireFragment(path, source, '<meta name="viewport" content="width=device-width, initial-scale=1.0"')
  requireFragment(path, source, 'class="site-frame"')
  requireFragment(path, source, 'class="masthead"')
  requireFragment(path, source, 'class="global-nav"')
  requireFragment(path, source, 'mobile-menu mobile-only')
  requireFragment(path, source, 'data-mobile-menu')
  requireFragment(path, source, 'aria-label="Open navigation"')
  requirePattern(path, source, 'page shell', /class="page(\s|--)/)
  requireFragment(path, source, 'class="footer"')
}

for (const path of featurePages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, 'class="feature-tabs"')
}

for (const path of visualPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, 'class="layout-split"')
}

for (const path of toolbarPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, 'class="toolbar"')
}

for (const path of ledgerPages.filter((path) => existsSync(join(root, path)))) {
  const source = read(path)
  requireFragment(path, source, 'class="metric-ledger')
}

for (const path of ['twitch/heatmap/index.html', 'kick/heatmap/index.html']) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  requireFragment(path, source, 'class="heatmap-wrap')
}

const cssPath = 'src/mock-site.css'
if (!existsSync(join(root, cssPath))) {
  failures.push(`${cssPath}: missing shared CSS`)
} else {
  const source = read(cssPath)
  requireFragment(cssPath, source, '@media (max-width:760px)')
  requirePattern(cssPath, source, 'hide global nav on mobile', /\.global-nav\{display:none\}/)
  requirePattern(cssPath, source, 'show mobile menu on mobile', /\.mobile-menu\{display:block/)
  requirePattern(cssPath, source, 'show mobile-only on mobile', /\.mobile-only\{display:block\}/)
  requirePattern(cssPath, source, 'mobile page padding', /\.page,\.page--full\{padding:18px 14px 52px\}/)
  requirePattern(cssPath, source, 'layout collapse', /\.layout-split,\.provider-overview,\.history-columns\{grid-template-columns:1fr\}/)
  requirePattern(cssPath, source, 'data strip mobile columns', /\.data-strip\{grid-template-columns:1fr 1fr\}/)
  requirePattern(cssPath, source, 'feature tabs horizontal scroll padding', /\.feature-tabs,\.provider-tabs\{margin-left:-14px/)
  requirePattern(cssPath, source, 'toolbar horizontal scroll', /\.toolbar\{overflow-x:auto;flex-wrap:nowrap/)
  requirePattern(cssPath, source, 'footer mobile stack', /\.footer\{padding:16px 14px 28px;display:block\}/)
}

const contractPath = 'docs/mobile-qa-contract.md'
if (!existsSync(join(root, contractPath))) {
  failures.push(`${contractPath}: missing mobile QA contract`)
} else {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'Mobile QA Contract')
  requireFragment(contractPath, source, 'viewport metadata')
  requireFragment(contractPath, source, 'shared responsive breakpoints')
}

if (failures.length > 0) {
  console.error('ViewLoom Mobile QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom Mobile QA verification passed for ${pages.length} public pages.`)
