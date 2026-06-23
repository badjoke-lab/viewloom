import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const source = read('src/live/channel/url-state.ts')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const state = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const parsed = state.parseChannelState(
  new URL('https://example.test/twitch/channel/?id=Alpha_Channel!&name=Alpha+Channel&period=7d&view=days&day=2026-06-20'),
  'twitch',
)
assert(parsed.channelId === 'alpha_channel', 'Channel id normalization is wrong.')
assert(parsed.requestedName === 'Alpha Channel', 'Requested display name is wrong.')
assert(parsed.period === '7d' && parsed.view === 'days' && parsed.selectedDay === '2026-06-20', 'Valid Channel state was not preserved.')

const fallback = state.parseChannelState(
  new URL('https://example.test/kick/channel/?id=Beta&period=90d&view=invalid&day=June-20'),
  'kick',
)
assert(fallback.period === '30d', 'Invalid period must fall back to 30d.')
assert(fallback.view === 'overview', 'Invalid view must fall back to Overview.')
assert(fallback.selectedDay === undefined, 'Invalid selected day must be removed.')

const overviewHref = state.channelStateUrl(new URL('https://example.test/twitch/channel/?qa=1&period=30d&view=overview'), {
  provider: 'twitch', channelId: 'alpha', requestedName: 'Alpha Channel', period: '30d', view: 'overview',
})
assert(overviewHref === '/twitch/channel/?qa=1&id=alpha&name=Alpha+Channel', 'Clean Overview URL is wrong.')

const reportHref = state.channelStateUrl(new URL('https://example.test/kick/channel/'), {
  provider: 'kick', channelId: 'beta', requestedName: '', period: '7d', view: 'report', selectedDay: '2026-06-20',
})
assert(reportHref === '/kick/channel/?id=beta&period=7d&view=report&day=2026-06-20', 'Report URL is wrong.')

assert(state.sameChannelRequestScope(parsed, { ...parsed, view: 'report', selectedDay: '2026-06-19' }), 'View/day changes must reuse the loaded payload.')
assert(!state.sameChannelRequestScope(parsed, { ...parsed, period: '30d' }), 'Period changes must refetch.')
assert(!state.sameChannelRequestScope(parsed, { ...parsed, channelId: 'beta' }), 'Channel id changes must refetch.')

const profile = read('src/live/channel-profile.ts')
for (const fragment of [
  'parseChannelState',
  'channelStateUrl',
  'sameChannelRequestScope',
  "window.addEventListener('popstate'",
  "history.pushState(null, '', href)",
  'data-channel-period',
]) assert(profile.includes(fragment), `Channel controller is missing: ${fragment}`)
assert((profile.match(/\bfetch\(/g) ?? []).length === 1, 'Channel controller must contain one History fetch implementation.')

if (failures.length) {
  console.error('Channel state verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Channel state verification passed.')
console.log('- URL state normalizes provider, id, period, view, and day')
console.log('- view/day changes reuse payload; period/id changes refetch')
console.log('- popstate and one-fetch controller contracts are present')
