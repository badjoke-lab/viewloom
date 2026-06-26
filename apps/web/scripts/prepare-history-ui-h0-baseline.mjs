import { readFileSync } from 'node:fs'

const path = new URL('./history-ui-h0-browser.mjs', import.meta.url)
const source = readFileSync(path, 'utf8')

for (const fragment of [
  "'history-metric-ranking-context-stale'",
  "'history-metric-summary-stale'",
  "'history-mobile-task-flow-too-long'",
  "'history-selected-day-context-stale'",
  'before.ranking === after.ranking',
]) {
  if (!source.includes(fragment)) throw new Error(`P9H0 browser baseline missing: ${fragment}`)
}

if (source.includes("'history-first-keyboard-entry-missing',\n")) {
  throw new Error('P9H0 browser baseline still expects the production-only keyboard finding locally')
}

console.log('P9H0 deterministic baseline is static and self-contained.')
