import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const path = 'docs/kick-feature-coverage-contract.md'
const source = readFileSync(join(process.cwd(), path), 'utf8')
const required = [
  'Kick feature coverage contract',
  'coverageModel',
  'official-livestreams',
  'registry',
  'seed-list',
  'fixture',
  'All modes are bounded',
  'Twitch routes are never intercepted',
]
const missing = required.filter((fragment) => !source.includes(fragment))
if (missing.length) {
  console.error('Kick feature coverage documentation verification failed:')
  for (const fragment of missing) console.error(`- missing ${fragment}`)
  process.exit(1)
}
console.log('Kick feature coverage documentation verification passed.')
