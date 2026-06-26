import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('./history-ui-h0-browser.mjs', import.meta.url)
const lines = readFileSync(path, 'utf8').split('\n')
const output = []
let fixed = 0

for (const line of lines) {
  if (line.includes("'history-first-keyboard-entry-missing'")) continue
  if (line.includes('before.ranking') && line.includes('history-metric-ranking-context-stale')) {
    output.push("  if (before.ranking === after.ranking) fail('history-metric-ranking-context-stale')")
    fixed += 1
  } else {
    output.push(line)
  }
}

if (fixed !== 1) throw new Error('ranking comparison count mismatch')
writeFileSync(path, output.join('\n'))
console.log('P9H0 deterministic baseline prepared.')
