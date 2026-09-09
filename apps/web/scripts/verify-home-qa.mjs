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
  'src/portal-page.ts', 'src/portal-page.css', 'src/i18n/portal.ts',
  'src/provider-home.ts', 'src/provider-home-shell.ts', 'src/provider-home-data.ts', 'src/provider-home.css',
  'src/provider-home-stream-map-entry.ts',
  'src/i18n/locale.ts', 'src/i18n/route.ts', 'src/i18n/provider-home.ts',
  'src/shared-shell.ts', 'src/shared-shell.css',
  'functions/_home/model.ts', 'functions/api/twitch-home.ts', 'functions/api/kick-home.ts',
  'fixtures/home-payload-states.json', 'docs/home-qa-contract.md', 'docs/home-payload-contract.md', 'docs/platform-home-repair-plan.md',
]
files.forEach(needFile)

if (existsSync(join(root, 'index.html'))) {
  const source = read('index.html')
  for (const fragment of [
    'data-provider="portal"',
    'data-portal-home',
    'class="portal-provider-grid"',
    'portal-provider-card--twitch',
    'portal-provider-card--kick',
    'class="portal-view-grid"',
    'class="portal-boundaries"',
    'See who is largest now',
    'id="portal-twitch-next"',
    'id="portal-kick-next"',
    'Open Twitch',
    'Open Kick',
    'Platforms stay separate',
    'href="/twitch/"',
    'href="/kick/"',
    '/src/portal-page.ts',
  ]) need('index.html', source, fragment)
  forbid('index.html', source, 'old portal panel layout', /class="portal-grid"|portal-panel--twitch|portal-panel--kick/)
  forbid('index.html', source, 'old fake totals', /118\.4K|42\.7K|1\.86M observed/)
  forbid('index.html', source, 'repetitive feature CTA labels', />Twitch (?:Heatmap|Day Flow|Battle Lines|History)|>Kick (?:Heatmap|Day Flow|Battle Lines|History)/)
}

if (existsSync(join(root, 'src/portal-page.ts'))) {
  const source = read('src/portal-page.ts')
  for (const fragment of [
    "import { localeFromPathname } from './i18n/locale'",
    "import { portalText } from './i18n/portal'",
    "import { localizeAvailableHref } from './i18n/route'",
    "void loadProvider('twitch')",
    "void loadProvider('kick')",
    'fetch(`/api/${platform}-home`',
    "version: 'viewloom-home-v1'",
    'validatePayload(payload, platform)',
    'renderProviderError',
    'presentationState(payload)',
    'localeFromPathname(window.location.pathname)',
    'portalText(locale, key, params)',
    "t('coverage.twitchFallback')",
    "t('coverage.kickFallback')",
    'renderProviderNext',
    'localizeAvailableHref(`/${platform}/heatmap/`, locale)',
    "t('next.heatmap')",
    'formatInteger(Math.max(0, value), locale)',
    'formatCompactNumber(Math.max(0, value), locale)',
    'shortAge',
    "state === 'error' || state === 'demo' || state === 'empty'",
  ]) need('src/portal-page.ts', source, fragment)
  forbid('src/portal-page.ts', source, 'combined platform arithmetic', /twitch[^\n]*(?:\+|sum)[^\n]*kick|kick[^\n]*(?:\+|sum)[^\n]*twitch/i)
  forbid('src/portal-page.ts', source, 'demo substitution', /fixture|fake count|Stream A/i)
}

if (existsSync(join(root, 'src/i18n/portal.ts'))) {
  const source = read('src/i18n/portal.ts')
  for (const fragment of [
    "'coverage.twitchFallback': 'Top 300 observed window. More live streams may exist beyond it.'",
    "'coverage.kickFallback': 'Top 100 observed candidates. Not provider-wide directory coverage.'",
    "'next.heatmap': 'Explore the current field in Heatmap'",
    "'coverage.twitchFallback': 'Top 300の観測範囲です。これより多くのライブ配信が存在する場合があります。'",
    "'coverage.kickFallback': 'Top 100の観測候補です。プラットフォーム全体のディレクトリ網羅を意味しません。'",
    "'next.heatmap': 'Heatmapで現在の勢力を見る'",
    'const ja: Record<PortalMessageKey, string>',
    'export function portalText',
  ]) need('src/i18n/portal.ts', source, fragment)
}

if (existsSync(join(root, 'src/portal-page.css'))) {
  const source = read('src/portal-page.css')
  for (const fragment of [
    '.portal-provider-grid',
    '.portal-provider-card--twitch',
    '.portal-provider-card--kick',
    '.portal-provider-next',
    '.portal-provider-next[hidden]',
    '.portal-view-grid',
    '.portal-boundaries',
    '@media (max-width: 760px)',
    '@media (max-width: 520px)',
  ]) need('src/portal-page.css', source, fragment)
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
    "mountProviderHome(platform: Platform, locale: Locale = 'en')",
    'providerHomeCoverage, providerHomeLede, providerHomeText',
    'localizeAvailableHref(href, locale)',
    "['01 · NOW', 'Heatmap'",
    "['02 · TODAY', 'Day Flow'",
    "['03 · RIVALRY', 'Battle Lines'",
    "['04 · TRENDS', 'History'",
    'id="home-live-table"',
    'class="home-live-context"',
    "t('live.caption'",
    "t('today.reversalReview')",
    'aria-controls="provider-home-nav"',
    'aria-live="polite"',
  ]) need('src/provider-home-shell.ts', source, fragment)
  forbid('src/provider-home-shell.ts', source, 'blind localized-base feature routing', /const\s+base\s*=\s*localizeHref/)
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
    'localeFromPathname(window.location.pathname)',
    'providerHomeText(locale, key, params)',
    "t('data.reviewReversals')",
    'formatInteger(Math.max(0, value), locale)',
    'sourceLabel(payload)',
    "status.dataset.state = 'error'",
  ]) need('src/provider-home-data.ts', source, fragment)
  forbid('src/provider-home-data.ts', source, 'internal payload wording', /Unavailable in Home payload/)
  forbid('src/provider-home-data.ts', source, 'internal QA wording', /No demo ranking was substituted|real Home payload/i)
}

if (existsSync(join(root, 'src/provider-home.ts'))) {
  const source = read('src/provider-home.ts')
  for (const fragment of [
    'installSharedShell, setSharedShellStatus, syncSharedShellStatus',
    'localeFromPathname(window.location.pathname)',
    'providerHomeText(locale, key, params)',
    'mountProviderHome(platform, locale)',
    'installProviderHomeStreamMapEntry(platform, locale)',
    'installSharedShell()',
    "document.body.dataset.homeState === 'partial'",
    "document.body.dataset.homeState = 'fresh'",
    'setSharedShellStatus(status',
    'syncSharedShellStatus(status)',
  ]) need('src/provider-home.ts', source, fragment)
  forbid('src/provider-home.ts', source, 'duplicate mobile navigation owner', /installMobileNavigation|menu\.setAttribute\('aria-expanded'/)
  forbid('src/provider-home.ts', source, 'internal provider signal section', /Latest provider signals/)
  forbid('src/provider-home.ts', source, 'internal update section', /ViewLoom updates/)
  forbid('src/provider-home.ts', source, 'unofficial badge row', /provider-home-badge/)
}

if (existsSync(join(root, 'src/i18n/provider-home.ts'))) {
  const source = read('src/i18n/provider-home.ts')
  for (const fragment of [
    "'live.caption': 'Top streams in the latest observed {name} snapshot'",
    "'today.reversalReview': 'Reversal review'",
    "'data.reviewReversals': 'Review reversals in Battle Lines'",
    "'live.caption': '最新の{name}観測スナップショットにおける上位配信'",
    "'today.reversalReview': '逆転の確認'",
    "'data.reviewReversals': 'Battle Linesで逆転を確認'",
    'const ja: Record<ProviderHomeMessageKey, string>',
    'export function providerHomeText',
  ]) need('src/i18n/provider-home.ts', source, fragment)
}

if (existsSync(join(root, 'src/i18n/locale.ts'))) {
  const source = read('src/i18n/locale.ts')
  for (const fragment of [
    "SUPPORTED_LOCALES = ['en', 'ja']",
    "JAPANESE_PATH_PREFIX = '/ja'",
    'localeFromPathname(pathname: string)',
  ]) need('src/i18n/locale.ts', source, fragment)
}

if (existsSync(join(root, 'src/i18n/route.ts'))) {
  const source = read('src/i18n/route.ts')
  for (const fragment of [
    'JAPANESE_AVAILABLE_PATHNAMES',
    'export function localizeAvailableHref',
    'return localizeHref(href, locale)',
  ]) need('src/i18n/route.ts', source, fragment)
}

if (existsSync(join(root, 'src/provider-home-stream-map-entry.ts'))) {
  const source = read('src/provider-home-stream-map-entry.ts')
  for (const fragment of [
    "installProviderHomeStreamMapEntry(platform: Platform, locale: Locale = 'en')",
    "localizeAvailableHref('/twitch/map/', locale)",
    "translate(locale, 'feature.streamMap')",
    "translate(locale, 'map.twitchHomeCopy')",
  ]) need('src/provider-home-stream-map-entry.ts', source, fragment)
  forbid('src/provider-home-stream-map-entry.ts', source, 'Kick Map routing ownership', /\/kick\/map\//)
}

if (existsSync(join(root, 'src/shared-shell.ts'))) {
  const source = read('src/shared-shell.ts')
  for (const fragment of [
    'export function installSharedShell()',
    "nav.id = 'viewloom-global-navigation'",
    "menu.setAttribute('aria-expanded'",
    "event.key !== 'Escape'",
    'export function setSharedShellStatus',
    'export function syncSharedShellStatus',
    'Twitch observation',
    'Kick observation',
  ]) need('src/shared-shell.ts', source, fragment)
}

if (existsSync(join(root, 'src/provider-home.css'))) {
  const source = read('src/provider-home.css')
  for (const fragment of [
    '.provider-overview',
    'align-items: start',
    '.home-table--no-context .home-live-context',
    '@media (max-width: 760px)',
    '@media (max-width: 520px)',
  ]) need('src/provider-home.css', source, fragment)
  forbid('src/provider-home.css', source, 'forced equal-height Home surface', /\.home-surface\s*\{[^}]*height:\s*100%/s)
}

if (existsSync(join(root, 'src/shared-shell.css'))) {
  const source = read('src/shared-shell.css')
  for (const fragment of [
    '.global-nav.is-open',
    '.status-inline[data-state="fresh"] .dot',
    '.status-inline[data-state="partial"] .dot',
    '.status-inline[data-state="unavailable"] .dot',
    '@media(max-width:760px)',
  ]) need('src/shared-shell.css', source, fragment)
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
    'Two provider briefing cards',
    'Exactly four analysis view cards',
    'Status is not a fifth analysis feature card',
    'All totals must be labeled as observed values',
    'Twitch and Kick values are never combined',
    'Which analysis view answers my current question?',
    '`Open Twitch` and `Open Kick`',
    'Platforms stay separate',
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

console.log('ViewLoom Home QA verification passed for the Portal briefing, localized data-connected provider pages, and shared shell ownership.')
