import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const sourceUrl = new URL('../src/features/twitch-stream-map/geography-ui-bootstrap.ts', import.meta.url)
const source = await readFile(sourceUrl, 'utf8')

assert.match(source, /if \(state === 'available'\) return `Stable Twitch user ID available for all \$\{format\(available\)\} parsed snapshot streams\.`/)
assert.match(source, /if \(state === 'partial'\) return `Stable Twitch user ID available for \$\{format\(available\)\} parsed streams; \$\{format\(missing\)\} still lack it\. Login remains a join key only\.`/)
assert.match(source, /Minute snapshot has no stable Twitch user ID; login remains a join key only, not a stable identity\./)

assert.match(source, /stableIdentityStreams\?: number/)
assert.match(source, /missingStableIdentityStreams\?: number/)
assert.match(source, /loginIsStableIdentity\?: boolean/)
assert.match(source, /stableIdentityMessage\(stableState, stableCount, missingStableCount\)/)

assert.match(source, /<button type="button" disabled aria-disabled="true" title="Current \/ IRL requires fresh current-location evidence">Current \/ IRL<\/button>/)
assert.match(source, /Current \/ IRL remains unavailable\./)

console.log('twitch stream map city UI stable-ID state verification passed')
