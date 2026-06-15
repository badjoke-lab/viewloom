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
const analysisFeatureLabels = ['Heatmap', 'Day Flow', 'Battle Lines', 'History']
const contractPath = 'docs/home-qa-contract.md'
const planPath = 'docs/platform-home-repair-plan.md'
const payloadContractPath = 'docs/home-payload-contract.md'
const payloadModelPath = 'functions/_home/model.ts'
const twitchHomeApiPath = 'functions/api/twitch-home.ts'
const kickHomeApiPath = 'functions/api/kick-home.ts'
const stateFixturePath = 'fixtures/home-payload-states.json'

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
]) requireFile(path)

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
  for (const label of analysisFeatureLabels) {
    requireFragment(path, source, `<h3>${label}</h3>`)
  }
  forbidPattern(path, source, 'old overview card grid', /overview-grid|view-card/)
  forbidPattern(path, source, 'old fake totals', /287|118\.4K|83|42\.7K|1\.86M observed/)
}

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    'Portal and Provider Home QA Contract',
    'Exactly four analysis feature cards',
    'Status is not a fifth analysis feature card',
    'All totals must be labeled as observed values',
    'loading',
    'fresh',
    'partial',
    'stale',
    'empty',
    'demo',
    'error',
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
  requireFragment(twitchHomeApiPath, source, "platform: 'twitch'")
  requireFragment(twitchHomeApiPath, source, 'env.DB_TWITCH_HOT')
  requireFragment(twitchHomeApiPath, source, 'topLimit: 300')
  requireFragment(twitchHomeApiPath, source, 'staleAfterMinutes: 3')
  forbidPattern(twitchHomeApiPath, source, 'Kick DB binding', /DB_KICK_HOT/)
}

if (existsSync(join(root, kickHomeApiPath))) {
  const source = read(kickHomeApiPath)
  requireFragment(kickHomeApiPath, source, "platform: 'kick'")
  requireFragment(kickHomeApiPath, source, 'env.DB_KICK_HOT')
  requireFragment(kickHomeApiPath, source, 'topLimit: 100')
  requireFragment(kickHomeApiPath, source, 'staleAfterMinutes: 10')
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

console.log('ViewLoom Home QA verification passed for provider links, fixed schedule, and real Home payload contracts.')
