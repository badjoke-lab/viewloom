import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const webRoot = process.cwd()
const origin = 'https://www.viewloom.net'
const manifest = JSON.parse(readFileSync(resolve(webRoot, 'src/i18n/seo-release-candidates.json'), 'utf8'))
const sitemap = readFileSync(resolve(webRoot, 'public/sitemap.xml'), 'utf8')
const routeHelper = readFileSync(resolve(webRoot, 'src/i18n/route.ts'), 'utf8')

assert.equal(manifest.schema, 'viewloom-japanese-seo-release-candidates-v1')
assert.equal(manifest.status, 'staged_pre_j10')
assert.equal(manifest.publicReleaseEnabled, false)
assert.equal(manifest.releaseGate, 'J10')
assert.equal(manifest.routes.length, 27)
assert.equal(manifest.counts.pairs, 27)
assert.equal(manifest.counts.releaseIndexable, 23)
assert.equal(manifest.counts.persistentNoindex, 4)
assert.equal(manifest.counts.japaneseSitemapAdditionsAfterJ10, 23)

const indexable = manifest.routes.filter((route) => route.indexableAfterJ10)
const persistentNoindex = manifest.routes.filter((route) => !route.indexableAfterJ10)
assert.equal(indexable.length, 23)
assert.deepEqual(
  persistentNoindex.map((route) => route.englishRoute).sort(),
  ['/kick/channel/', '/kick/watchlist/', '/twitch/channel/', '/twitch/watchlist/'].sort(),
)

for (const route of manifest.routes) {
  const english = readRoute(route.englishRoute)
  const japanese = readRoute(route.japaneseRoute)

  assert.match(english, /<html\b[^>]*\blang=["']en["']/i, route.englishRoute + ': html lang must be en')
  assert.match(japanese, /<html\b[^>]*\blang=["']ja["']/i, route.japaneseRoute + ': html lang must be ja')

  assert.equal(link(english, 'canonical'), route.englishCanonical, route.englishRoute + ': English canonical mismatch')
  assert.equal(link(japanese, 'canonical'), route.japaneseCanonical, route.japaneseRoute + ': Japanese canonical mismatch')
  assert.equal(meta(japanese, 'name', 'robots').toLowerCase(), 'noindex,follow', route.japaneseRoute + ': Japanese route must remain noindex,follow before J10')
  assert.doesNotMatch(english, /hreflang=/i, route.englishRoute + ': public hreflang must remain absent before J10')
  assert.doesNotMatch(japanese, /hreflang=/i, route.japaneseRoute + ': public hreflang must remain absent before J10')

  if (route.indexableAfterJ10) {
    assert.equal(meta(english, 'name', 'robots').toLowerCase().includes('noindex'), false, route.englishRoute + ': English indexable counterpart unexpectedly noindex')
    assert.equal(sitemap.includes('<loc>' + route.englishCanonical + '</loc>'), true, route.englishRoute + ': English indexable counterpart missing from current sitemap')
    assert.equal(route.sitemapAfterJ10, true)
    assert.deepEqual(route.hreflangAfterJ10, {
      en: route.englishCanonical,
      ja: route.japaneseCanonical,
      'x-default': route.englishCanonical,
    }, route.japaneseRoute + ': staged hreflang cluster mismatch')
  } else {
    assert.equal(meta(english, 'name', 'robots').toLowerCase(), 'noindex,follow', route.englishRoute + ': persistent English utility route must remain noindex')
    assert.equal(sitemap.includes('<loc>' + route.englishCanonical + '</loc>'), false, route.englishRoute + ': persistent noindex English route must stay outside sitemap')
    assert.equal(route.sitemapAfterJ10, false)
    assert.equal(route.hreflangAfterJ10, null)
  }

  assert.equal(sitemap.includes('<loc>' + route.japaneseCanonical + '</loc>'), false, route.japaneseRoute + ': Japanese route must stay outside sitemap before J10')

  verifyMetadata(english, route.englishCanonical, route.englishRoute)
  verifyMetadata(japanese, route.japaneseCanonical, route.japaneseRoute)

  if (route.structuredData) {
    verifyStructuredData(english, route.structuredData, route.englishCanonical, route.englishRoute, false)
    verifyStructuredData(japanese, route.structuredData, route.japaneseCanonical, route.japaneseRoute, true)
  }
}

assert.equal((sitemap.match(/<loc>/g) ?? []).length, 23, 'current public sitemap must remain at 23 English indexable routes')
assert.equal(/https:\/\/www\.viewloom\.net\/ja\//.test(sitemap), false, 'current public sitemap must not expose Japanese candidates before J10')

const setBody = routeHelper.match(/const JAPANESE_AVAILABLE_PATHNAMES = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? ''
const available = [...setBody.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]).sort()
assert.deepEqual(available, manifest.routes.map((route) => route.englishRoute).sort(), 'locale route-switch availability must exactly match the 27 SEO route pairs')

console.log('Japanese localized SEO candidate contract verified.')
console.log('- route pairs: 27 exact English/Japanese equivalents')
console.log('- staged J10 indexable/hreflang/x-default/sitemap clusters: 23')
console.log('- persistent noindex Channel/Watchlist pairs: 4')
console.log('- pre-J10 Japanese state: noindex, self-canonical, no public hreflang, no sitemap exposure')
console.log('- localized title/description, OG, Twitter, and applicable structured data: complete')

function readRoute(route) {
  const normalized = route.replace(/^\/+|\/+$/g, '')
  const path = normalized ? normalized + '/index.html' : 'index.html'
  return readFileSync(resolve(webRoot, path), 'utf8')
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

function title(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''
}

function verifyMetadata(html, canonical, label) {
  const pageTitle = title(html)
  const description = meta(html, 'name', 'description')
  const ogTitle = meta(html, 'property', 'og:title')
  const ogDescription = meta(html, 'property', 'og:description')
  const ogUrl = meta(html, 'property', 'og:url')
  const ogImage = meta(html, 'property', 'og:image')
  const twitterCard = meta(html, 'name', 'twitter:card')
  const twitterTitle = meta(html, 'name', 'twitter:title')
  const twitterDescription = meta(html, 'name', 'twitter:description')
  const twitterImage = meta(html, 'name', 'twitter:image')

  assert.ok(pageTitle, label + ': title missing')
  assert.ok(description, label + ': meta description missing')
  assert.equal(ogTitle, pageTitle, label + ': og:title must match title')
  assert.ok(ogDescription, label + ': og:description missing')
  assert.equal(ogUrl, canonical, label + ': og:url must match canonical')
  assert.ok(ogImage, label + ': og:image missing')
  assert.equal(twitterCard, 'summary_large_image', label + ': twitter:card mismatch')
  assert.equal(twitterTitle, pageTitle, label + ': twitter:title must match title')
  assert.ok(twitterDescription, label + ': twitter:description missing')
  assert.ok(twitterImage, label + ': twitter:image missing')
}

function verifyStructuredData(html, expectedType, canonical, label, requireJapanese) {
  const raw = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim() ?? ''
  assert.ok(raw, label + ': expected structured data missing')
  const data = JSON.parse(raw)
  assert.equal(data['@type'], expectedType, label + ': structured data type mismatch')
  assert.equal(data.url, canonical, label + ': structured data URL mismatch')
  assert.ok(typeof data.description === 'string' && data.description.trim(), label + ': structured data description missing')
  if (requireJapanese) assert.equal(data.inLanguage, 'ja', label + ': Japanese structured data must declare inLanguage=ja')
}
