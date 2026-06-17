import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const bridgePath = 'src/navigation/battle-lines-deep-link-bridge.ts'
const bridge = read(bridgePath)
const twitch = read('twitch/battle-lines/index.html')
const kick = read('kick/battle-lines/index.html')

assert(bridge.includes("import { buildDeepLink } from './deep-link-contract'"), `${bridgePath}: shared deep-link builder is not used.`)
assert(bridge.includes("name !== 'point'"), `${bridgePath}: incoming time links are not bridged to the legacy point reader.`)
assert(bridge.includes("parsed.searchParams.delete('point')"), `${bridgePath}: outgoing legacy point is not removed.`)
assert(bridge.includes("parsed.searchParams.set('time', time)"), `${bridgePath}: outgoing selected time is not written.`)
assert(bridge.includes("buildDeepLink(parsed.pathname, 'battleLines'"), `${bridgePath}: outgoing URL is not normalized by the shared contract.`)
assert(bridge.includes("/(?:twitch|kick)\\/battle-lines\\/$/"), `${bridgePath}: provider Battle Lines route guard is missing.`)

for (const [path, source] of [
  ['twitch/battle-lines/index.html', twitch],
  ['kick/battle-lines/index.html', kick],
]) {
  const bridgeIndex = source.indexOf('/src/navigation/battle-lines-deep-link-bridge.ts')
  const entryIndex = source.indexOf('/src/live/battle-lines-current-shell-entry.ts')
  assert(bridgeIndex >= 0, `${path}: time-link bridge script is missing.`)
  assert(entryIndex >= 0, `${path}: Battle Lines entry script is missing.`)
  assert(bridgeIndex < entryIndex, `${path}: time-link bridge must load before the Battle Lines entry.`)
}

if (failures.length) {
  console.error('Battle Lines time-link bridge verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Battle Lines time-link bridge verification passed for Twitch and Kick.')
