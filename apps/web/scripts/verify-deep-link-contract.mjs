import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const source = read('src/navigation/deep-link-contract.ts')
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const contract = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

assert(JSON.stringify(contract.DEEP_LINK_PARAMETER_ORDER.dayFlow) === JSON.stringify(['metric', 'scope', 'top', 'bucket', 'rangeMode', 'date', 'time', 'streamer', 'auto']), 'Day Flow parameter order changed.')
assert(JSON.stringify(contract.DEEP_LINK_PARAMETER_ORDER.battleLines) === JSON.stringify(['metric', 'top', 'bucket', 'range', 'date', 'battle', 'stream', 'time']), 'Battle Lines parameter order changed.')
assert(JSON.stringify(contract.LEGACY_DEEP_LINK_PARAMETERS.battleLines) === JSON.stringify(['point']), 'Battle Lines legacy compatibility changed.')

const dayFlowUrl = contract.buildDeepLink('/twitch/day-flow?old=yes#chart', 'dayFlow', {
  auto: 'off', streamer: 'channel_name', time: '2026-06-18T12:35:00Z', date: '2026-06-18',
  rangeMode: 'date', bucket: 10, top: 20, scope: 'topFocus', metric: 'share', ignored: 'drop',
})
assert(dayFlowUrl === '/twitch/day-flow/?metric=share&scope=topFocus&top=20&bucket=10&rangeMode=date&date=2026-06-18&time=2026-06-18T12%3A35%3A00.000Z&streamer=channel_name&auto=off', `Unexpected Day Flow link: ${dayFlowUrl}`)

const battleUrl = contract.buildDeepLink('/kick/battle-lines/', 'battleLines', {
  stream: 'stream-b', battle: 'stream-a:stream-b', date: '2026-06-17', range: 'date',
  bucket: '10m', top: 3, metric: 'indexed', time: '2026-06-17T09:10:00Z', point: 42,
})
assert(battleUrl === '/kick/battle-lines/?metric=indexed&top=3&bucket=10m&range=date&date=2026-06-17&battle=stream-a%3Astream-b&stream=stream-b&time=2026-06-17T09%3A10%3A00.000Z', `Unexpected Battle Lines link: ${battleUrl}`)
assert(!battleUrl.includes('point='), 'New Battle Lines links must not emit legacy point indexes.')
assert(contract.readLegacyBattlePoint(new URLSearchParams('point=42')) === 42, 'Legacy point read failed.')
assert(contract.readLegacyBattlePoint(new URLSearchParams('point=-1')) === null, 'Invalid legacy point was accepted.')

const invalid = contract.normalizeDeepLinkParams('dayFlow', new URLSearchParams('metric=wrong&top=500&date=bad&auto=maybe'))
assert(invalid.size === 0, 'Invalid state was retained.')

const daySource = read('src/live/day-flow-current-shell-entry.ts')
const battleSource = read('src/live/battle-lines-current-shell-entry.ts')
for (const key of contract.DEEP_LINK_PARAMETER_ORDER.dayFlow) assert(daySource.includes(`'${key}'`), `Day Flow source is missing ${key}.`)
for (const key of ['metric', 'top', 'bucket', 'range', 'date', 'battle', 'stream']) assert(battleSource.includes(`'${key}'`), `Battle Lines source is missing ${key}.`)
assert(battleSource.includes("params.get('point')"), 'Legacy Battle Lines point read is missing.')
assert(daySource.includes('window.history.replaceState'), 'Day Flow URL synchronization is missing.')
assert(battleSource.includes('history.replaceState'), 'Battle Lines URL synchronization is missing.')

const copyPath = 'src/navigation/copy-current-view.ts'
const copySource = read(copyPath)
const analyticsSource = read('src/analytics.ts')
for (const fragment of [
  "import { buildDeepLink } from './deep-link-contract'",
  "import { VIEWLOOM_ORIGIN } from './url-contract'",
  "feature: 'dayFlow'",
  "feature: 'battleLines'",
  "feature: 'history'",
  "freezeSelectedInstant(params, 'rangeMode')",
  "freezeSelectedInstant(params, 'range')",
  "freezeRelativeDay(params, 'rangeMode', now)",
  "freezeRelativeDay(params, 'range', now)",
  "params.delete('point')",
  "params.set('auto', 'off')",
  'normalizeHistoryParams(',
  "output.set('period', source.get('period') === '7d' ? '7d' : '30d')",
  "output.set('metric', source.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes')",
  "button.textContent = 'Copy current view'",
  'navigator.clipboard?.writeText',
  "document.execCommand('copy')",
  "document.querySelector<HTMLElement>('.dayflow-toolbar')",
  "document.querySelector<HTMLElement>('.battle-actions')",
  "document.querySelector<HTMLElement>('.history-controls')",
]) assert(copySource.includes(fragment), `${copyPath}: missing ${fragment}`)
assert(analyticsSource.startsWith("import './navigation/copy-current-view'"), 'Analytics entry must mount Copy current view controls after feature runtimes.')
assert(!/\/twitch\/.*\/kick\/|\/kick\/.*\/twitch\//.test(copySource), 'Copy current view must not combine provider routes.')
assert(!copySource.includes('window.location.origin'), 'Generated share links must use the canonical production origin.')

if (failures.length) {
  console.error('ViewLoom deep-link contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom deep-link and Copy current view contract verification passed.')
