import { readFileSync, writeFileSync } from 'node:fs'

const path = new URL('./history-ui-h0-browser.mjs', import.meta.url)
let source = readFileSync(path, 'utf8')
const line = "  'history-first-keyboard-entry-missing',\n"
if (!source.includes(line)) throw new Error(`P9H0 baseline source no longer contains expected line: ${line.trim()}`)
source = source.replace(line, '')
writeFileSync(path, source)
console.log('Prepared deterministic P9H0 baseline: summary, selected-day, ranking context, and mobile task-flow are expected red; local keyboard entry remains an observation and P8B production evidence remains authoritative.')
