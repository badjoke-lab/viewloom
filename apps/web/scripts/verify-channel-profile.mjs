import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const helperPath = 'src/navigation/channel-profile-link.ts'
const helperSource = read(helperPath)
const compiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const helper = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

assert(helper.channelProfileHref('twitch', 'Alpha_Channel', 'Alpha Channel', '7d') === '/twitch/channel/?id=alpha_channel&name=Alpha+Channel&period=7d', 'Twitch channel profile link is wrong.')
assert(helper.channelProfileHref('kick', 'alpha-channel', 'Alpha', '30d') === '/kick/channel/?id=alpha-channel&name=Alpha&period=30d', 'Kick channel profile link is wrong.')
assert(helper.channelProfileHref('twitch', '', 'Invalid') === null, 'Empty streamer ids must not produce links.')

const profile = read('src/live/channel-profile.ts')
for (const fragment of [
  "provider === 'kick' ? '/api/kick-history' : '/api/history'",
  'retained daily Top 10 appearances',
  'Not in retained daily Top 10',
  'not confirmed offline',
  'Session start/end history is not available',
  '/day-flow/?date=',
  '/battle-lines/?battle=',
  "return '—'",
]) assert(profile.includes(fragment), `Channel profile source missing: ${fragment}`)
assert((profile.match(/\bfetch\(/g) ?? []).length === 1, 'Channel profile feature must make exactly one History request.')

const twitchPage = read('twitch/channel/index.html')
const kickPage = read('kick/channel/index.html')
for (const [label, source, provider] of [
  ['Twitch', twitchPage, 'twitch'],
  ['Kick', kickPage, 'kick'],
]) {
  for (const fragment of [
    `data-provider="${provider}"`,
    'data-channel-name',
    'data-channel-state',
    'data-channel-period="7d"',
    'data-channel-period="30d"',
    'data-channel-summary',
    'data-channel-trend',
    'data-channel-days',
    'data-channel-rivals',
    'data-channel-scope',
    '/src/live/channel-profile.ts',
    'Retained ranking footprint',
    'Session history',
    'Unavailable',
  ]) assert(source.includes(fragment), `${label} channel page missing: ${fragment}`)
}
assert(twitchPage.includes('/twitch/history/') && !twitchPage.includes('/kick/history/'), 'Twitch channel page crossed provider History routes.')
assert(kickPage.includes('/kick/history/') && !kickPage.includes('/twitch/history/'), 'Kick channel page crossed provider History routes.')

const vite = read('vite.config.ts')
assert(vite.includes("twitchChannel: 'twitch/channel/index.html'"), 'Twitch channel page is missing from the web build.')
assert(vite.includes("kickChannel: 'kick/channel/index.html'"), 'Kick channel page is missing from the web build.')

const rankingState = read('src/live/history-additional-rankings-state.ts')
const rankingRenderer = read('src/live/history-additional-rankings-render.ts')
assert(rankingState.includes('streamerId?: string'), 'History ranking state does not preserve streamerId.')
for (const fragment of [
  'channelProfileHref',
  'streamer.streamerId',
  'history-streamer-profile-link',
]) assert(rankingRenderer.includes(fragment), `History ranking profile link missing: ${fragment}`)

const css = read('src/channel-profile.css')
for (const fragment of [
  '.channel-profile-summary',
  '.channel-trend-bars',
  '.channel-day-grid',
  '.channel-rival-grid',
  '@media(max-width:760px)',
  '@media(max-width:420px)',
]) assert(css.includes(fragment), `Channel profile responsive CSS missing: ${fragment}`)

const doc = read('docs/channel-profile-minimal-contract.md')
for (const fragment of [
  '/twitch/channel/?id=<streamer-id>',
  '/kick/channel/?id=<streamer-id>',
  'retained ranking footprint',
  'Not in retained daily Top 10',
  'must not be described as offline',
  'session start/end history is not claimed',
  'No cross-platform totals',
  'additional browser request',
]) assert(doc.includes(fragment), `Channel profile contract missing: ${fragment}`)

if (failures.length) {
  console.error('Channel profile verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Channel profile verification passed.')
console.log('- Twitch and Kick routes remain provider-separated')
console.log('- History ranking links preserve provider, streamer id, name, and period')
console.log('- the page exposes only a retained ranking footprint')
console.log('- missing daily Top 10 rows are not labelled offline')
console.log('- desktop and mobile layout contracts are present')
