import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Home QA file`)
}
const requireFragment = (path, source, fragment) => {
  if (!source.includes(fragment)) failures.push(`${path}: missing required Home QA fragment: ${fragment}`)
}
const forbidPattern = (path, source, label, pattern) => {
  if (pattern.test(source)) failures.push(`${path}: contains forbidden Home regression: ${label}`)
}

const portalPath = 'index.html'
const providerPages = [
  { path: 'twitch/index.html', provider: 'twitch', coverage: 'Top 300', basePath: '/twitch/' },
  { path: 'kick/index.html', provider: 'kick', coverage: 'Top 100', basePath: '/kick/' },
]
const requiredFeatureSlugs = ['heatmap', 'day-flow', 'battle-lines', 'history', 'status']
const analysisFeatureLabels = ['Heatmap', 'Day Flow', 'Battle Lines', 'History']
const contractPath = 'docs/home-qa-contract.md'
const planPath = 'docs/platform-home-repair-plan.md'
const payloadContractPath = 'docs/home-payload-contract.md'
const payloadModelPath = 'functions/_home/model.ts'
const twitchHomeApiPath = 'functions/api/twitch-home.ts'
const kickHomeApiPath = 'functions/api/kick-home.ts'
const stateFixturePath = 'fixtures/home-payload-states.json'
const shellPath = 'src/provider-home-shell.ts'
const clientPath = 'src/provider-home-data.ts'
const entryPath = 'src/provider-home.ts'
const stylePath = 'src/provider-home.css'

for (const path of [
  portalPath,
  ...providerPages.map((page) => page.path),
  contractPath,
  planPath,
  payloadContractPath,
  payloadModelPath,
  twitchHomeApiPath,
  kickHomeApiPath,
  stateFixturePath,
  shellPath,
  clientPath,
  entryPath,
  stylePath,
]) requireFile(path)

if (existsSync(join(root, portalPath))) {
  const source = read(portalPath)
  for (const fragment of [
    'data-provider="portal"',
    'class="portal-grid"',
    'portal-panel--twitch',
    'portal-panel--kick',
    'class="portal-panel__stats"',
    'class="signal-list"',
    'No combined platform totals are shown.',
    'href="/twitch/"',
    'href="/kick/"',
  ]) requireFragment(portalPath, source, fragment)
  forbidPattern(portalPath, source, 'mock portal label', /Portal mock|redesign mock/i)
  forbidPattern(portalPath, source, 'old fake totals', /287|118\.4K|83|42\.7K|1\.86M observed/)
}

for (const { path, provider, coverage, basePath } of providerPages.filter((page) => existsSync(join(root, page.path)))) {
  const source = read(path)
  for (const fragment of [
    `data-provider="${provider}"`,
    'class="data-strip"',
    'class="provider-overview"',
    'class="surface surface--dark"',
    'class="signal-list"',
    'class="feature-directory"',
    coverage,
    'href="/twitch/"',
    'href="/kick/"',
  ]) requireFragment(path, source, fragment)
  for (const slug of requiredFeatureSlugs) requireFragment(path, source, `href="${basePath}${slug}/"`)
  for (const label of analysisFeatureLabels) requireFragment(path, source, `<h3>${label}</h3>`)
  forbidPattern(path, source, 'old overview card grid', /overview-grid|view-card/)
  forbidPattern(path, source, 'old fake totals', /287|118\.4K|83|42\.7K|1\.86M observed/)
}

if (existsSync(join(root, shellPath))) {
  const source = read(shellPath)
  for (const fragment of [
    'id="home-live-table"',
    'class="home-live-context"',
    'Top streams in the latest observed',
    'Reversal review',
    'Review retained rollups',
    'aria-controls="provider-home-nav"',
    'aria-live="polite"',
  ]) requireFragment(shellPath, source, fragment)
  for (const label of analysisFeatureLabels) requireFragment(shellPath, source, `<h3>${label}</h3>`)
  forbidPattern(shellPath, source, 'internal provider signal section', /Latest provider signals/)
  forbidPattern(shellPath, source, 'internal update section', /ViewLoom updates/)
  forbidPattern(shellPath, source, 'duplicate coverage footer', /coverage note/)
}

if (existsSync(join(root, clientPath))) {
  const source = read(clientPath)
  for (const fragment of [
    '/api/${active}-home',
    'home-table--no-context',
    'home-live-context-',
    'Review reversals in Battle Lines',
    'sourceLabel(payload)',
    "status.dataset.state = 'error'",
  ]) requireFragment(clientPath, source, fragment)
  forbidPattern(clientPath, source, 'internal payload wording', /Unavailable in Home payload/)
  forbidPattern(clientPath, source, 'internal QA wording', /No demo ranking was substituted|real Home payload/i)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    'installMobileNavigation',
    "document.body.dataset.homeState === 'partial'",
    "document.body.dataset.homeState = 'fresh'",
    "menu.setAttribute('aria-expanded'",
  ]) requireFragment(entryPath, source, fragment)
  forbidPattern(entryPath, source, 'internal provider signal section', /Latest provider signals/)
  forbidPattern(entryPath, source, 'internal update section', /ViewLoom updates/)
  forbidPattern(entryPath, source, 'unofficial badge row', /provider-home-badge/)
}

if (existsSync(join(root, stylePath))) {
  const source = read(stylePath)
  for (const fragment of [
    '.provider-overview',
    'align-items: start',
    '.home-table--no-context .home-live-context',
    '.status-inline[data-state="stale"] .dot',
    '.status-inline[data-state="error"] .dot',
    '.global-nav.is-open',
    '@media (max-width: 760px)',
    '@media (max-width: 520px)',
  ]) requireFragment(stylePath, source, fragment)
  forbidPattern(stylePath, source, 'forced equal-height Home surface', /\.home-surface\s*\{[^}]*height:\s*100%/s)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Portal and Provider Home QA Contract',
    'Exactly four analysis feature cards',
    'Status is not a fifth analysis feature card',
    'All totals must be labeled as observed values',
    'loading', 'fresh', 'partial', 'stale', 'empty', 'demo', 'error',
    'Twitch and Kick values are never combined',
    '/api/twitch-home',
    '/api/kick-home',
    'viewloom-home-v1',
    'docs/home-payload-contract.md',
    'fixtures/home-payload-states.json',
    'docs/platform-home-repair-plan.md',
  ]) requireFragment(contractPath, source, fragment)
}

if (existsSync(join(root, planPath))) {
  const source = read(planPath)
  for (const fragment of [
    'Platform Home Repair Plan',
    'Home PR 1 — Contract and QA',
    'Home PR 2 — Real home payloads',
    'Home PR 3 — Shared provider-home UI',
    'Home PR 4 — Provider differences, mobile, and final QA',
    '/api/twitch-home',
    '/api/kick-home',
    'Fixed schedule after Platform Home',
    'Changelog foundation',
    'Deep Link',
    'Merge reporting rule',
  ]) requireFragment(planPath, source, fragment)
}

if (existsSync(join(root, payloadContractPath))) {
  const source = read(payloadContractPath)
  for (const fragment of [
    'Provider Home Payload Contract',
    'viewloom-home-v1',
    '/api/twitch-home',
    '/api/kick-home',
    'largest_observed',
    'fastest_riser',
    'closest_gap',
    'top_category',
    'cache-control: no-store',
    'Unsupported values are `unavailable`',
  ]) requireFragment(payloadContractPath, source, fragment)
}

if (existsSync(join(root, twitchHomeApiPath))) {
  const source = read(twitchHomeApiPath)
  for (const fragment of ["platform: 'twitch'", 'env.DB_TWITCH_HOT', 'topLimit: 300', 'staleAfterMinutes: 10']) requireFragment(twitchHomeApiPath, source, fragment)
  forbidPattern(twitchHomeApiPath, source, 'Kick DB binding', /DB_KICK_HOT/)
}

if (existsSync(join(root, kickHomeApiPath))) {
  const source = read(kickHomeApiPath)
  for (const fragment of ["platform: 'kick'", 'env.DB_KICK_HOT', 'topLimit: 100', 'staleAfterMinutes: 10']) requireFragment(kickHomeApiPath, source, fragment)
  forbidPattern(kickHomeApiPath, source, 'Twitch DB binding', /DB_TWITCH_HOT/)
}

if (existsSync(join(root, payloadModelPath))) {
  const source = read(payloadModelPath)
  for (const fragment of [
    "version: 'viewloom-home-v1'",
    'buildProviderHomeResponse',
    'buildProviderHomePayload',
    'fetchLatestSnapshots',
    'LIMIT 2',
    'fetchTodayPeak',
    'fetchRecentRollups',
    'LIMIT 9',
    'deriveHomeState',
    "activity: 'unavailable'",
    "latestReversal: 'unavailable'",
    "'cache-control': 'no-store'",
    'No demo fallback was substituted',
  ]) requireFragment(payloadModelPath, source, fragment)
  forbidPattern(payloadModelPath, source, 'browser feature API fan-out', /fetch\(['"]\/api\/(?:twitch-|kick-)?(?:heatmap|day-flow|battle-lines|history)/)
  forbidPattern(payloadModelPath, source, 'secret material in response', /TWITCH_CLIENT_SECRET|KICK_CLIENT_SECRET|Authorization:/)
}

if (existsSync(join(root, stateFixturePath))) {
  try {
    const fixtures = JSON.parse(read(stateFixturePath))
    const states = new Set()
    if (!Array.isArray(fixtures.derivationFixtures)) failures.push(`${stateFixturePath}: derivationFixtures must be an array`)
    else {
      for (const fixture of fixtures.derivationFixtures) {
        const actual = deriveFixtureState(fixture.input ?? {})
        states.add(fixture.expected)
        if (actual !== fixture.expected) failures.push(`${stateFixturePath}: ${fixture.name ?? 'unnamed fixture'} expected ${fixture.expected} but derived ${actual}`)
      }
    }
    for (const required of ['fresh', 'partial', 'stale', 'empty', 'demo']) {
      if (!states.has(required)) failures.push(`${stateFixturePath}: missing ${required} derivation fixture`)
    }
    if (fixtures.errorFixture?.state !== 'error') failures.push(`${stateFixturePath}: missing explicit error fixture`)
    if (fixtures.errorFixture?.source !== 'real') failures.push(`${stateFixturePath}: error fixture must not claim demo source`)
    if (fixtures.errorFixture?.error?.code !== 'home_payload_unavailable') failures.push(`${stateFixturePath}: error fixture code mismatch`)
  } catch (error) {
    failures.push(`${stateFixturePath}: invalid JSON fixture: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function deriveFixtureState(input) {
  const mode = String(input.sourceMode ?? '').toLowerCase()
  if (mode === 'demo' || mode === 'fixture') return 'demo'
  if (input.minutesSinceUpdate == null) return 'empty'
  if (input.minutesSinceUpdate >= input.staleAfterMinutes) return 'stale'
  if (input.observedStreams === 0) return 'empty'
  if (input.platform === 'kick' && mode !== 'authenticated') return 'partial'
  if (input.hasMore) return 'partial'
  return 'fresh'
}

if (failures.length > 0) {
  console.error('ViewLoom Home QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom Home QA verification passed for data-connected provider pages and repaired public presentation.')
