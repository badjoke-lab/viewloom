import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const path = 'docs/kick-coverage-ui-contract.md'
const source = readFileSync(join(process.cwd(), path), 'utf8')
const required = [
  'Kick coverage UI contract',
  'Official endpoint',
  'Registry candidates',
  'Seed list',
  'Candidate fallback',
  'No additional API request is made',
  'Twitch routes are not observed',
]
const missing = required.filter((fragment) => !source.includes(fragment))
if (missing.length) {
  console.error('Kick coverage UI contract verification failed:')
  for (const fragment of missing) console.error(`- missing ${fragment}`)
  process.exit(1)
}
console.log('Kick coverage UI contract verification passed.')
