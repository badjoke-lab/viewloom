import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webRoot = process.cwd()
const repoRoot = resolve(webRoot, '../..')
const qa = JSON.parse(readFileSync(resolve(repoRoot, 'docs/audits/japanese-localization-release-candidate.json'), 'utf8'))
const seo = JSON.parse(readFileSync(resolve(webRoot, 'src/i18n/seo-release-candidates.json'), 'utf8'))
const routeHelper = readFileSync(resolve(webRoot, 'src/i18n/route.ts'), 'utf8')
const localeHelper = readFileSync(resolve(webRoot, 'src/i18n/locale.ts'), 'utf8')
const sitemap = readFileSync(resolve(webRoot, 'public/sitemap.xml'), 'utf8')

assert.equal(qa.schema, 'viewloom-japanese-release-candidate-qa-v1')
assert.equal(qa.status, 'candidate_pre_j10')
assert.equal(qa.sourceJ8.pr, 1340)
assert.equal(qa.sourceJ8.mergeSha, '6b0258f7244521b1a44f8a6fb673b4e8bf16bfee')
assert.equal(qa.counts.routePairs, 27)
assert.equal(qa.counts.japaneseRoutes, 27)
assert.equal(qa.counts.indexableAfterJ10, 23)
assert.equal(qa.counts.persistentNoindex, 4)
assert.equal(qa.counts.browserViewports, 4)
assert.equal(qa.counts.browserScenarios, 216)
assert.equal(qa.counts.japaneseBrowserScenarios, 108)
assert.equal(qa.releaseBoundary.publicReleaseEnabled, false)
assert.equal(qa.releaseBoundary.releaseGate, 'J10')
assert.equal(qa.releaseBoundary.japaneseRobotsBeforeJ10, 'noindex,follow')
assert.equal(qa.releaseBoundary.publicHreflangBeforeJ10, false)
assert.equal(qa.releaseBoundary.japaneseSitemapBeforeJ10, false)
assert.equal(qa.releaseBoundary.visibleLanguageSwitcherBeforeJ10, false)

for (const [key, expected] of Object.entries({
  providersSeparated: true,
  combinedTotalsAllowed: false,
  combinedRankingsAllowed: false,
  utcAggregationUnchanged: true,
  rawProviderDataTranslated: false,
  geographyEvidenceUnchanged: true,
  currentIrlMeaningUnchanged: true,
  collectorChanged: false,
  d1SchemaOrWriteChanged: false,
  cadenceChanged: false,
  retentionChanged: false,
})) assert.equal(qa.semantics[key], expected, 'QA semantic boundary mismatch: ' + key)

assert.equal(seo.routes.length, 27)
assert.equal(seo.publicReleaseEnabled, false)
assert.equal(seo.releaseGate, 'J10')
assert.equal(seo.counts.releaseIndexable, 23)
assert.equal(seo.counts.persistentNoindex, 4)

const forbiddenEnglishPresentation = [
  'Open navigation',
  'Loading channel',
  'Copy current URL',
  'Last 30 days',
  'Last 7 days',
  'Back to History',
  'Retained Days',
  'Report & Export',
  'Scope & limits',
  'Loading retained',
  'Loading daily',
  'Current health',
  'Observed streams',
  'Observed viewers',
  'No data available',
  'Try again',
]

for (const pair of seo.routes) {
  const expectedJapaneseRoute = pair.englishRoute === '/' ? '/ja/' : '/ja' + pair.englishRoute
  assert.equal(pair.japaneseRoute, expectedJapaneseRoute, pair.englishRoute + ': route-pair equivalence mismatch')

  const english = readRoute(pair.englishRoute)
  const japanese = readRoute(pair.japaneseRoute)
  const englishText = visibleText(english)
  const japaneseText = visibleText(japanese)

  assert.match(english, /<html\b[^>]*\blang=["']en["']/i, pair.englishRoute + ': English html lang mismatch')
  assert.match(japanese, /<html\b[^>]*\blang=["']ja["']/i, pair.japaneseRoute + ': Japanese html lang mismatch')
  assert.equal(hasJapaneseScript(englishText), false, pair.englishRoute + ': Japanese presentation literal leaked into English page')

  for (const literal of forbiddenEnglishPresentation) {
    assert.equal(japaneseText.includes(literal), false, pair.japaneseRoute + ': English presentation literal leaked: ' + literal)
  }

  assert.equal(meta(japanese, 'name', 'robots').toLowerCase(), 'noindex,follow', pair.japaneseRoute + ': Japanese route must remain noindex before J10')
  assert.equal(link(japanese, 'canonical'), pair.japaneseCanonical, pair.japaneseRoute + ': Japanese canonical mismatch')
  assert.doesNotMatch(japanese, /hreflang=/i, pair.japaneseRoute + ': public hreflang emitted before J10')
  assert.doesNotMatch(japanese, /data-language-switch|class=["'][^"']*language-switch/i, pair.japaneseRoute + ': public language switcher emitted before J10')
  assert.equal(sitemap.includes('<loc>' + pair.japaneseCanonical + '</loc>'), false, pair.japaneseRoute + ': Japanese sitemap exposure before J10')
  assert.doesNotMatch(japanese, /\/api\/ja(?:\/|-)/i, pair.japaneseRoute + ': localized API path is forbidden')
}

assert.equal((sitemap.match(/<loc>/g) ?? []).length, 23, 'pre-J10 sitemap must remain at 23 English routes')
assert.equal(/https:\/\/www\.viewloom\.net\/ja\//.test(sitemap), false, 'pre-J10 sitemap must remain Japanese-free')

assert.match(routeHelper, /const \[withoutHash, hash\] = splitHash\(href\)/, 'route helper must preserve hash separately')
assert.match(routeHelper, /const \[pathname, search\] = splitSearch\(withoutHash\)/, 'route helper must preserve query separately')
assert.match(routeHelper, /return `\$\{localizedPathname\}\$\{search\}\$\{hash\}`/, 'localized route must restore query then hash')
assert.match(routeHelper, /if \(!isLocalizedRouteAvailable\(pathname \|\| '\/', locale\)\) return href/, 'availability-aware route switch must preserve unavailable href')
assert.match(routeHelper, /export function equivalentLocaleHref\(href: string, locale: Locale\): string/, 'equivalent locale route helper missing')
assert.match(localeHelper, /export const JAPANESE_PATH_PREFIX = '\/ja'/, 'Japanese path prefix contract changed')
assert.match(localeHelper, /if \(locale === 'en'\) return basePath/, 'English route restoration contract changed')
assert.match(localeHelper, /if \(basePath === '\/'\) return `\$\{JAPANESE_PATH_PREFIX\}\/`/, 'Japanese root route mapping changed')
assert.match(localeHelper, /return `\$\{JAPANESE_PATH_PREFIX\}\$\{basePath\}`/, 'Japanese route prefix mapping changed')

console.log('Japanese release-candidate static QA verified.')
console.log('- exact route parity: 27 English/Japanese pairs')
console.log('- presentation leakage guards: English pages contain no Japanese script; Japanese pages reject known untranslated UI literals')
console.log('- route switch preserves equivalent path mapping plus query/hash contract')
console.log('- J10 boundary remains closed: Japanese noindex, no public hreflang, no sitemap exposure, no visible language switcher')
console.log('- J8 SEO inventory remains 23 future indexable + 4 persistent noindex utility pairs')

function readRoute(route) {
  const normalized = route.replace(/^\/+|\/+$/g, '')
  const path = normalized ? normalized + '/index.html' : 'index.html'
  return readFileSync(resolve(webRoot, path), 'utf8')
}

function visibleText(html) {
  return html
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasJapaneseScript(value) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value)
}

function attr(source, name) {
  return source.match(new RegExp('\\b' + name + '=["\\']([^"\\']*)["\\']', 'i'))?.[1] ?? ''
}

function meta(html, key, value) {
  const item = (html.match(/<meta\b[^>]*>/gi) ?? []).find((entry) => attr(entry, key).toLowerCase() === value.toLowerCase()) ?? ''
  return attr(item, 'content')
}

function link(html, rel) {
  const item = (html.match(/<link\b[^>]*>/gi) ?? []).find((entry) => attr(entry, 'rel').toLowerCase().split(/\s+/).includes(rel)) ?? ''
  return attr(item, 'href')
}
