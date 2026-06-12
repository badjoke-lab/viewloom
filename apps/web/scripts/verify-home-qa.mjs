import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Home QA file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Home QA fragment: ${fragment}`)
}

function forbidPattern(path, source, label, pattern) {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Home regression: ${label}`)
}

const portalPath = 'index.html'
const providerPages = [
  { path: 'twitch/index.html', provider: 'twitch', coverage: 'Top 300', basePath: '/twitch/' },
  { path: 'kick/index.html', provider: 'kick', coverage: 'Top 100', basePath: '/kick/' },
]
const requiredFeatureSlugs = ['heatmap', 'day-flow', 'battle-lines', 'history', 'status']
const contractPath = 'docs/home-qa-contract.md'

for (const path of [portalPath, ...providerPages.map((page) => page.path), contractPath]) requireFile(path)

if (existsSync(join(root, portalPath))) {
  const source = read(portalPath)
  requireFragment(portalPath, source, 'data-provider="portal"')
  requireFragment(portalPath, source, 'class="portal-grid"')
  requireFragment(portalPath, source, 'portal-panel--twitch')
  requireFragment(portalPath, source, 'portal-panel--kick')
  requireFragment(portalPath, source, 'class="portal-panel__stats"')
  requireFragment(portalPath, source, 'class="signal-list"')
  requireFragment(portalPath, source, 'No combined platform totals are shown.')
  requireFragment(portalPath, source, 'href="/twitch/"')
  requireFragment(portalPath, source, 'href="/kick/"')
  forbidPattern(portalPath, source, 'mock portal label', /Portal mock|redesign mock/i)
  forbidPattern(portalPath, source, 'old fake totals', /287|118\.4K|83|42\.7K|1\.86M observed/)
}

for (const { path, provider, coverage, basePath } of providerPages.filter((page) => existsSync(join(root, page.path)))) {
  const source = read(path)
  requireFragment(path, source, `data-provider="${provider}"`)
  requireFragment(path, source, 'class="data-strip"')
  requireFragment(path, source, 'class="provider-overview"')
  requireFragment(path, source, 'class="surface surface--dark"')
  requireFragment(path, source, 'class="signal-list"')
  requireFragment(path, source, 'class="feature-directory"')
  requireFragment(path, source, coverage)
  requireFragment(path, source, 'href="/twitch/"')
  requireFragment(path, source, 'href="/kick/"')
  for (const slug of requiredFeatureSlugs) {
    requireFragment(path, source, `href="${basePath}${slug}/"`)
  }
  for (const label of ['Heatmap', 'Day Flow', 'Battle Lines', 'History', 'Status']) {
    requireFragment(path, source, `<h3>${label}</h3>`)
  }
  forbidPattern(path, source, 'old overview card grid', /overview-grid|view-card/)
  forbidPattern(path, source, 'old fake totals', /287|118\.4K|83|42\.7K|1\.86M observed/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  requireFragment(contractPath, source, 'Portal and Provider Home QA Contract')
  requireFragment(contractPath, source, 'combined Twitch/Kick totals')
  requireFragment(contractPath, source, 'Heatmap, Day Flow, Battle Lines, History, and Status')
}

if (failures.length > 0) {
  console.error('ViewLoom Home QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom Home QA verification passed for portal and provider home pages, including provider feature links.')
