import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const entrySource = read('apps/web/src/provider-home-stream-map-entry.ts')
const homeSource = read('apps/web/src/provider-home.ts')
const shellSource = read('apps/web/src/provider-home-shell.ts')
const localeSource = read('apps/web/src/i18n/locale.ts')
const routeSource = read('apps/web/src/i18n/route.ts')
const messagesSource = read('apps/web/src/i18n/messages/en.ts')
const viteSource = read('apps/web/vite.config.ts')
const sitemapSource = read('apps/web/public/sitemap.xml')
const twitchSurfaceSource = read('docs/audits/public-surface-routes-twitch.json')
const kickSurfaceSource = read('docs/audits/public-surface-routes-kick.json')

assert.equal(existsSync('apps/web/twitch/map/index.html'), true, 'public Twitch Stream Map page must already exist')
assert.equal(existsSync('apps/web/kick/map/index.html'), true, 'authorized K4 must create the public Kick Stream Map page')

assert.equal(entrySource.includes("import type { Locale } from './i18n/locale'"), true)
assert.equal(entrySource.includes("import { localizeAvailableHref } from './i18n/route'"), true, 'Stream Map Home entry must respect staged locale route availability')
assert.equal(entrySource.includes("installProviderHomeStreamMapEntry(platform: Platform, locale: Locale = 'en')"), true)
assert.equal(entrySource.includes("const href = localizeAvailableHref('/twitch/map/', locale)"), true)
assert.equal(entrySource.includes("if (platform !== 'twitch') return"), true, 'legacy Twitch Home helper must remain Twitch-only')
assert.equal(entrySource.includes("link.dataset.providerHomeStreamMap = 'twitch'"), true)
assert.equal(entrySource.includes("number.textContent = '05 · WHERE'"), true)
assert.equal(entrySource.includes("translate(locale, 'feature.streamMap')"), true)
assert.equal(entrySource.includes("translate(locale, 'map.twitchHomeCopy')"), true)
assert.equal(entrySource.includes("translate(locale, 'map.countryCityEvidence')"), true)
assert.equal(entrySource.includes('/kick/map/'), false, 'Twitch Home helper must not take ownership of Kick Map routing')

assert.equal(homeSource.includes("import { installProviderHomeStreamMapEntry } from './provider-home-stream-map-entry'"), true)
assert.equal(homeSource.includes('installProviderHomeStreamMapEntry(platform, locale)'), true)
assert.equal(homeSource.includes('localeFromPathname(window.location.pathname)'), true)
assert.equal(localeSource.includes("export const JAPANESE_PATH_PREFIX = '/ja'"), true)
assert.equal(routeSource.includes('withLocalePathname'), true)
assert.equal(routeSource.includes('localizeAvailableHref'), true, 'availability-aware locale routing must be present')
assert.equal(routeSource.includes("'/twitch/'"), true, 'Japanese Twitch Home must remain an available localized route')
assert.equal(routeSource.includes("'/twitch/map/'"), false, 'Japanese Twitch Map must not be treated as available before its localized route exists')
assert.equal(messagesSource.includes("'feature.streamMap': 'Stream Map'"), true)
assert.equal(shellSource.includes("'05 · WHERE'"), true, 'shared provider Home shell must expose authorized Kick Map card')
assert.equal(shellSource.includes("'Stream Map'"), true, 'Kick Home Stream Map label missing')
assert.equal(shellSource.includes("'map'"), true, 'Kick Home Stream Map slug missing')
assert.equal(shellSource.includes("platform === 'kick'"), true, 'Kick Map Home card must remain provider-scoped')

assert.equal(viteSource.includes("twitchMap: 'twitch/map/index.html'"), true, 'Twitch Map must remain a production Vite input')
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), true, 'authorized Kick Map must be a production Vite input')
assert.equal(sitemapSource.includes('https://www.viewloom.net/twitch/map/'), true, 'Twitch Map must remain in the sitemap')
assert.equal(sitemapSource.includes('https://www.viewloom.net/kick/map/'), true, 'authorized Kick Map must be in the sitemap')
assert.equal(sitemapSource.includes('https://www.viewloom.net/ja/twitch/map/'), false, 'unreleased Japanese Twitch Map must stay out of the sitemap')
assert.equal(sitemapSource.includes('https://www.viewloom.net/ja/kick/map/'), false, 'unreleased Japanese Kick Map must stay out of the sitemap')
assert.equal(twitchSurfaceSource.includes('/twitch/map/'), true, 'Twitch Map must remain in the permanent public-surface inventory')
assert.equal(kickSurfaceSource.includes('/kick/map/'), true, 'Kick Map must enter the permanent public-surface inventory after K4')

console.log(JSON.stringify({
  ok: true,
  twitchHomeStreamMapEntry: '/twitch/map/',
  japaneseTwitchHomeStreamMapEntry: '/twitch/map/',
  japaneseTwitchHomeFallbackUntilLocalizedMapExists: true,
  kickHomeStreamMapEntry: '/kick/map/',
  providerSeparated: true,
  localeAwareHomeEntry: true,
  twitchMapPublic: true,
  kickMapPublic: true,
  japaneseMapRoutesPublic: false,
  k4Authorized: true,
}, null, 2))
