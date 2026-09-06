import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const entrySource = read('apps/web/src/provider-home-stream-map-entry.ts')
const homeSource = read('apps/web/src/provider-home.ts')
const shellSource = read('apps/web/src/provider-home-shell.ts')
const viteSource = read('apps/web/vite.config.ts')
const sitemapSource = read('apps/web/public/sitemap.xml')
const twitchSurfaceSource = read('docs/audits/public-surface-routes-twitch.json')
const kickSurfaceSource = read('docs/audits/public-surface-routes-kick.json')

assert.equal(existsSync('apps/web/twitch/map/index.html'), true, 'public Twitch Stream Map page must already exist')
assert.equal(existsSync('apps/web/kick/map/index.html'), true, 'authorized K4 must create the public Kick Stream Map page')

assert.equal(entrySource.includes("const TWITCH_STREAM_MAP_HREF = '/twitch/map/'"), true)
assert.equal(entrySource.includes("if (platform !== 'twitch') return"), true, 'legacy Twitch Home helper must remain Twitch-only')
assert.equal(entrySource.includes("link.dataset.providerHomeStreamMap = 'twitch'"), true)
assert.equal(entrySource.includes("number.textContent = '05 · WHERE'"), true)
assert.equal(entrySource.includes("title.textContent = 'Stream Map'"), true)
assert.equal(entrySource.includes('/kick/map/'), false, 'Twitch Home helper must not take ownership of Kick Map routing')

assert.equal(homeSource.includes("import { installProviderHomeStreamMapEntry } from './provider-home-stream-map-entry'"), true)
assert.equal(homeSource.includes('installProviderHomeStreamMapEntry(platform)'), true)
assert.equal(shellSource.includes("'05 · WHERE'"), true, 'shared provider Home shell must expose authorized Kick Map card')
assert.equal(shellSource.includes("'Stream Map'"), true, 'Kick Home Stream Map label missing')
assert.equal(shellSource.includes("'map'"), true, 'Kick Home Stream Map slug missing')
assert.equal(shellSource.includes("platform === 'kick'"), true, 'Kick Map Home card must remain provider-scoped')

assert.equal(viteSource.includes("twitchMap: 'twitch/map/index.html'"), true, 'Twitch Map must remain a production Vite input')
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), true, 'authorized Kick Map must be a production Vite input')
assert.equal(sitemapSource.includes('https://www.viewloom.net/twitch/map/'), true, 'Twitch Map must remain in the sitemap')
assert.equal(sitemapSource.includes('https://www.viewloom.net/kick/map/'), true, 'authorized Kick Map must be in the sitemap')
assert.equal(twitchSurfaceSource.includes('/twitch/map/'), true, 'Twitch Map must remain in the permanent public-surface inventory')
assert.equal(kickSurfaceSource.includes('/kick/map/'), true, 'Kick Map must enter the permanent public-surface inventory after K4')

console.log(JSON.stringify({
  ok: true,
  twitchHomeStreamMapEntry: '/twitch/map/',
  kickHomeStreamMapEntry: '/kick/map/',
  providerSeparated: true,
  twitchMapPublic: true,
  kickMapPublic: true,
  k4Authorized: true,
}, null, 2))
