import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const failures = []
const read = path => readFileSync(join(process.cwd(), path), 'utf8')
const check = (condition, message) => { if (!condition) failures.push(message) }
const twitch = read('twitch/status/index.html')
const kick = read('kick/status/index.html')
const entry = read('src/live/status-current-shell-entry.ts')
const enhancer = read('src/live/status-page-enhancer.ts')
const setup = read('src/live/status-page-setup.ts')
const features = read('src/live/status-page-features.ts')
const model = read('src/live/status-page-model.ts')
const css = read('src/status-page.css')
const twitchApi = read('functions/api/twitch-status.ts')
const kickApi = read('functions/api/kick-status.ts')
const contract = read('docs/data-status-page-contract.md')
for (const [name, source, provider] of [['Twitch', twitch, 'twitch'], ['Kick', kick, 'kick']]) {
  check(source.includes(`data-provider="${provider}"`), `${name} Status provider marker is missing.`)
  check(source.includes(`/${provider}/status/`), `${name} Status canonical route is missing.`)
  check(source.includes('/src/live/status-current-shell-entry.ts'), `${name} Status entry is missing.`)
}
for (const fragment of ["provider === 'kick' ? '/api/kick-status' : '/api/twitch-status'", "new CustomEvent('viewloom:status'", "fetch(endpoint", "cache: 'no-store'"]) check(entry.includes(fragment), `Status entry missing: ${fragment}`)
check((entry.match(/\bfetch\(/g) ?? []).length === 1, 'Status entry must make one provider status request.')
for (const fragment of ['prepareStatusPage()', "addEventListener('viewloom:status'", 'renderStatusSummary', 'renderStatusDetails', 'renderStatusFeatures', 'renderStatusLimitations', 'sanitizePayload']) check(enhancer.includes(fragment), `Status enhancer missing: ${fragment}`)
for (const fragment of ['data-status-summary', 'data-status-collector', 'data-status-coverage', 'data-status-feature-cards', 'data-status-limitations', 'data-status-debug']) check(setup.includes(fragment) || twitch.includes(fragment), `Status layout hook missing: ${fragment}`)
check(features.includes('data-status-feature-cards') || features.includes('status-feature-card'), 'Mobile feature cards are missing.')
check(model.includes('Bearer [redacted]'), 'Debug payload sanitization is missing.')
for (const fragment of ['.status-summary-grid', '.status-detail-grid', '.status-feature-cards', '@media(max-width:760px)']) check(css.includes(fragment), `Status responsive CSS missing: ${fragment}`)
for (const [name, source, binding, database] of [['Twitch', twitchApi, 'DB_TWITCH_HOT', 'vl_twitch_hot'], ['Kick', kickApi, 'DB_KICK_HOT', 'vl_kick_hot']]) {
  check(source.includes(`binding: '${binding}'`) && source.includes(`database: '${database}'`), `${name} storage identity is missing.`)
  check(source.includes('features: buildFeatures'), `${name} feature matrix payload is missing.`)
}
for (const fragment of ['/twitch/status/', '/kick/status/', 'Empty must not be presented as demo.', 'must not call feature APIs', 'Cloudflare deployment configuration']) check(contract.includes(fragment), `Data Status contract missing: ${fragment}`)
if (failures.length) { console.error('Data Status verification failed:'); failures.forEach(item => console.error(`- ${item}`)); process.exit(1) }
console.log('Data Status verification passed.')
