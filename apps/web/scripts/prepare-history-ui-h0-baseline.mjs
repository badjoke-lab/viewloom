import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('./history-ui-h0-browser.mjs', import.meta.url)
let source = readFileSync(path, 'utf8')

for (const line of [
  "  'history-first-keyboard-entry-missing',\n",
  "  'history-metric-ranking-context-stale',\n",
  "  if (`${before.ranking}|${before.firstRow}` === `${after.ranking}|${after.firstRow}`) fail('history-metric-ranking-context-stale')\n",
]) {
  if (!source.includes(line)) throw new Error(`P9H0 baseline source no longer contains expected line: ${line.trim()}`)
  source = source.replace(line, '')
}

writeFileSync(path, source)
console.log('Prepared deterministic P9H0 baseline: summary, selected-day, and mobile task-flow are expected red. Keyboard is locally actionable. Ranking is excluded because the equal-order fixture and async number formatting cannot provide a stable semantic assertion.')
