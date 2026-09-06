import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const entrySource = read('apps/web/src/provider-home-stream-map-entry.ts')
const homeSource = read('apps/web/src/provider-home.ts')
const shellSource = read('apps/web/src/provider-home-shell.ts')
const viteSource = read('apps/web/vite.config.ts')
const sitemapSource = read('apps/web/public/sitemap.xml')
const twitchSurfaceSource = read('docs/audits/public-surface-routes-twitch.json')

assert.equal(existsSync('apps/web/twitch/map/index.html'), true, 'public Twitch Stream Map page must already exist')
assert.equal(existsSync('apps/web/kick/map'), false, 'Kick Map must remain absent before K4 authorization')

assert.equal(entrySource.includes("const TWITCH_STREAM_MAP_HREF = '/twitch/map/'"), true)
assert.equal(entrySource.includes("if (platform !== 'twitch') return"), true, 'Stream Map Home entry must be Twitch-only before K4')
assert.equal(entrySource.includes("link.dataset.providerHomeStreamMap = 'twitch'"), true)
assert.equal(entrySource.includes("number.textContent = '05 · WHERE'"), true)
assert.equal(entrySource.includes("title.textContent = 'Stream Map'"), true)
assert.equal(entrySource.includes('/kick/map/'), false, 'Twitch Home entry helper must not contain Kick Map public routing')

assert.equal(homeSource.includes("import { installProviderHomeStreamMapEntry } from './provider-home-stream-map-entry'"), true)
assert.equal(homeSource.includes('installProviderHomeStreamMapEntry(platform)'), true)
assert.equal(shellSource.includes('/kick/map/'), false, 'shared provider Home shell must not expose Kick Map before K4')

assert.equal(viteSource.includes("twitchMap: 'twitch/map/index.html'"), true, 'Twitch Map must remain a production Vite input')
assert.equal(viteSource.includes("kickMap: 'kick/map/index.html'"), false, 'Kick Map must remain absent from production Vite inputs before K4')
assert.equal(sitemapSource.includes('https://www.viewloom.net/twitch/map/'), true, 'Twitch Map must remain in the sitemap')
assert.equal(twitchSurfaceSource.includes('/twitch/map/'), true, 'Twitch Map must remain in the permanent public-surface inventory')

console.log(JSON.stringify({
  ok: true,
  twitchHomeStreamMapEntry: '/twitch/map/',
  twitchOnly: true,
  twitchMapPublic: true,
  kickMapPublic: false,
  k4Touched: false,
}, null, 2))
