import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const needFile = (path) => {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Home file`)
}
const need = (path, source, fragment) => {
  if (!source.includes(fragment)) failures.push(`${path}: missing fragment ${fragment}`)
}
const forbid = (path, source, label, pattern) => {
  if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`)
}

const files = [
  'index.html', 'twitch/index.html', 'kick/index.html',
  'src/provider-home.ts', 'src/provider-home-shell.ts', 'src/provider-home-data.ts', 'src/provider-home.css',
  'functions/_home/model.ts', 'functions/api/twitch-home.ts', 'functions/api/kick-home.ts',
  'fixtures/home-payload-states.json', 'docs/home-qa-contract.md', 'docs/home-payload-contract.md', 'docs/platform-home-repair-plan.md',
]
files.forEach(needFile)

if (existsSync(join(root, 'index.html'))) {
  const source = read('index.html')
  for (const fragment of ['data-provider="portal"', 'class="portal-grid"', 'portal-panel--twitch', 'portal-panel--kick', 'No combined platform totals are shown.', 'href="/twitch/"', 'href="/kick/"']) need('index.html', source, fragment)
  forbid('index.html', source, 'old fake totals', /118\.4K|42\.7K|1\.86M observed/)
}

for (const provider of ['twitch', 'kick']) {
  const path = `${provider}/index.html`
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of [
    `data-provider="${provider}"`,
    'class="data-strip"',
    'class="provider-overview"',
    'class="surface surface--dark"',
    'class="signal-list"',
    'class="feature-directory"',
    'href="/twitch/"',
    'href="/kick/"',
  ]) need(path, source, fragment)
  for (const slug of ['heatmap', 'day-flow', 'battle-lines', 'history', 'status']) need(path, source, `href="/${provider}/${slug}/"`)
  forbid(path, source, 'old overview grid', /overview-grid|view-card/)
  forbid(path, source, 'old fake totals', /118\.4K|42\.7K|1\.86M observed/)
}

if (existsSync(join(root, 'src/provider-home-shell.ts'))) {
  const source = read('src/provider-home-shell.ts')
  for (const fragment of [
    "['01 · NOW', 'Heatmap'",
    "['02 · TODAY', 'Day Flow'",
    "['03 · RIVALRY', 'Battle Lines'",
    "['04 · TRENDS', 'History'",
    'id="home-live-table"',
    'class="home-live-context"',
    '<caption>Top streams in the latest observed',
    'Reversal review',
    'aria-controls="provider-home-nav"',
    'aria-live="polite"',
  ]) need('src/provider-home-shell.ts', source, fragment)
  forbid('src/provider-home-shell.ts', source, 'internal provider signal section', /Latest provider signals/)
  forbid('src/provider-home-shell.ts', source, 'internal update section', /ViewLoom updates/)
  forbid('src/provider-home-shell.ts', source, 'duplicate coverage footer', /coverage note/i)
}

if (existsSync(join(root, 'src/provider-home-data.ts'))) {
  const source = read('src/provider-home-data.ts')
  for (const fragment of [
    '/api/${active}-home',
    'home-table--no-context',
    'home-live-context-',
    'Review reversals in Battle Lines',
    'sourceLabel(payload)',
    "status.dataset.state = 'error'",
  ]) need('src/provider-home-data.ts', source, fragment)
  forbid('src/provider-home-data.ts', source, 'internal payload wording', /Unavailable in Home payload/)
  forbid('src/provider-home-data.ts', source, 'internal QA wording', /No demo ranking was substituted|real Home payload/i)
}

if (existsSync(join(root, 'src/provider-home.ts'))) {
  const source = read('src/provider-home.ts')
  for (const fragment of [
    'installMobileNavigation',
    "document.body.dataset.homeState === 'partial'",
    "document.body.dataset.homeState = 'fresh'",
    "menu.setAttribute('aria-expanded'",
  ]) need('src/provider-home.ts', source, fragment)
  forbid('src/provider-home.ts', source, 'internal provider signal section', /Latest provider signals/)
  forbid('src/provider-home.ts', source, 'internal update section', /ViewLoom updates/)
  forbid('src/provider-home.ts', source, 'unofficial badge row', /provider-home-badge/)
}

if (existsSync(join(root, 'src/provider-home.css'))) {
  const source = read('src/provider-home.css')
  for (const fragment of [
    '.provider-overview',
    'align-items: start',
    '.home-table--no-context .home-live-context',
    '.status-inline[data-state="stale"] .dot',
    '.status-inline[data-state="error"] .dot',
    '.global-nav.is-open',
    '@media (max-width: 760px)',
    '@media (max-width: 520px)',
  ]) need('src/provider-home.css', source, fragment)
  forbid('src/provider-home.css', source, 'forced equal-height Home surface', /\.home-surface\s*\{[^}]*height:\s*100%/s)
}

if (existsSync(join(root, 'functions/api/twitch-home.ts'))) {
  const source = read('functions/api/twitch-home.ts')
  for (const fragment of ["platform: 'twitch'", 'DB_TWITCH_HOT', 'topLimit: 300', 'staleAfterMinutes: 10']) need('functions/api/twitch-home.ts', source, fragment)
  forbid('functions/api/twitch-home.ts', source, 'Kick DB binding', /DB_KICK_HOT/)
}

if (existsSync(join(root, 'functions/api/kick-home.ts'))) {
  const source = read('functions/api/kick-home.ts')
  for (const fragment of ["platform: 'kick'", 'DB_KICK_HOT', 'topLimit: 100', 'staleAfterMinutes: 10']) need('functions/api/kick-home.ts', source, fragment)
  forbid('functions/api/kick-home.ts', source, 'Twitch DB binding', /DB_TWITCH_HOT/)
}

if (existsSync(join(root, 'functions/_home/model.ts'))) {
  const source = read('functions/_home/model.ts')
  for (const fragment of [
    "version: 'viewloom-home-v1'", 'buildProviderHomeResponse', 'buildProviderHomePayload',
    'fetchLatestSnapshots', 'LIMIT 2', 'fetchTodayPeak', 'fetchRecentRollups', 'LIMIT 9',
    'deriveHomeState', "activity: 'unavailable'", "latestReversal: 'unavailable'", "'cache-control': 'no-store'", 'No demo fallback was substituted',
  ]) need('functions/_home/model.ts', source, fragment)
  forbid('functions/_home/model.ts', source, 'secret material', /TWITCH_CLIENT_SECRET|KICK_CLIENT_SECRET|Authorization:/)
}

if (existsSync(join(root, 'fixtures/home-payload-states.json'))) {
  try {
    const fixtures = JSON.parse(read('fixtures/home-payload-states.json'))
    const states = new Set()
    if (!Array.isArray(fixtures.derivationFixtures)) failures.push('fixtures/home-payload-states.json: derivationFixtures must be an array')
    else {
      for (const fixture of fixtures.derivationFixtures) {
        const actual = deriveFixtureState(fixture.input ?? {})
        states.add(fixture.expected)
        if (actual !== fixture.expected) failures.push(`fixtures/home-payload-states.json: ${fixture.name ?? 'unnamed'} expected ${fixture.expected} but derived ${actual}`)
      }
    }
    for (const required of ['fresh', 'partial', 'stale', 'empty', 'demo']) if (!states.has(required)) failures.push(`fixtures/home-payload-states.json: missing ${required} fixture`)
    if (fixtures.errorFixture?.state !== 'error') failures.push('fixtures/home-payload-states.json: missing error fixture')
    if (fixtures.errorFixture?.source !== 'real') failures.push('fixtures/home-payload-states.json: error fixture must keep real source')
  } catch (error) {
    failures.push(`fixtures/home-payload-states.json: invalid JSON ${error instanceof Error ? error.message : String(error)}`)
  }
}

if (existsSync(join(root, 'docs/home-qa-contract.md'))) {
  const source = read('docs/home-qa-contract.md')
  for (const fragment of [
    'Portal and Provider Home QA Contract',
    'Exactly four analysis feature cards',
    'Status is not a fifth analysis feature card',
    'All totals must be labeled as observed values',
    'Twitch and Kick values are never combined',
    'ten-minute stale threshold',
    'Internal release notes',
    'Reviewed product milestones belong on `/changelog/`',
  ]) need('docs/home-qa-contract.md', source, fragment)
}

if (existsSync(join(root, 'docs/home-payload-contract.md'))) {
  const source = read('docs/home-payload-contract.md')
  for (const fragment of ['Provider Home Payload Contract', 'viewloom-home-v1', '/api/twitch-home', '/api/kick-home', 'cache-control: no-store']) need('docs/home-payload-contract.md', source, fragment)
}

if (existsSync(join(root, 'docs/platform-home-repair-plan.md'))) {
  const source = read('docs/platform-home-repair-plan.md')
  for (const fragment of ['Platform Home Repair Plan', 'Home PR 1 — Contract and QA', 'Home PR 4 — Provider differences, mobile, and final QA', 'Changelog foundation', 'Deep Link', 'Merge reporting rule']) need('docs/platform-home-repair-plan.md', source, fragment)
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

if (failures.length) {
  console.error('ViewLoom Home QA verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('ViewLoom Home QA verification passed for data-connected provider pages and repaired public presentation.')
