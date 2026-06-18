import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const formatterPath = 'src/provider-coverage.ts'
const formatterSource = read(formatterPath)
const compiled = ts.transpileModule(formatterSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const formatter = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const official = { coverageModel: { mode: 'official-livestreams', topLimit: 100, description: 'Official bounded observation.' } }
assert(formatter.providerCoverageSource(official, 'kick') === 'Official endpoint', 'Official Kick label failed.')
assert(formatter.providerCoverageSummary(official, 'kick') === 'Official endpoint · Top 100 observed', 'Official Kick summary failed.')
assert(formatter.providerCoverageNote(official) === 'Official bounded observation.', 'Explicit coverage note failed.')
assert(formatter.providerCoverageSource({ coverageModel: { mode: 'registry' } }, 'kick') === 'Registry candidates', 'Registry label failed.')
assert(formatter.providerCoverageSource({ coverage: { mode: 'seed-list' } }, 'kick') === 'Seed list', 'Seed-list label failed.')
assert(formatter.providerCoverageSource({ sourceMode: 'public-channel-fallback' }, 'kick') === 'Candidate fallback', 'Fallback label failed.')
assert(formatter.providerCoverageSource({ source: 'demo' }, 'kick') === 'Fixture', 'Fixture label failed.')
assert(formatter.providerCoverageSource({}, 'twitch') === 'Helix endpoint', 'Twitch label fallback failed.')
assert(formatter.providerCoverageLimit({}, 'kick') === 100, 'Kick default limit failed.')
assert(formatter.providerCoverageLimit({}, 'twitch') === 300, 'Twitch default limit failed.')

const uiPath = 'src/kick-coverage-ui.ts'
const ui = read(uiPath)
for (const fragment of [
  "'/api/kick-home'",
  "'/api/kick-status'",
  "'/api/kick-day-flow'",
  "'/api/kick-battle-lines'",
  "'/api/kick-history'",
  "setTextById('home-strip-coverage', summary)",
  "setLabeledStrong('.status-board .status-cell', 'Coverage', summary)",
  "upsertNote('[data-dayflow-coverage]'",
  "upsertNote('[data-battle-coverage]'",
  "upsertNote('[data-history-notes]'",
  'response.clone().json()',
  'new MutationObserver(queueApply)',
]) assert(ui.includes(fragment), `${uiPath}: missing ${fragment}`)
assert(!ui.includes('/api/twitch-'), `${uiPath}: Twitch API interception is forbidden.`)
assert(ui.includes("document.body.dataset.provider === 'kick'"), `${uiPath}: Kick provider guard is missing.`)

const mockSite = read('src/mock-site.ts')
assert(mockSite.startsWith("import './dayflow-responsive.css'\nimport './features/heatmap-page/layout-mode.css'\nimport './kick-coverage-ui'"), 'mock-site must install coverage UI before feature requests.')

const home = read('kick/index.html')
const bootstrapIndex = home.indexOf('/src/provider-home-bootstrap.ts')
const homeIndex = home.indexOf('/src/provider-home.ts')
assert(bootstrapIndex >= 0 && homeIndex >= 0 && bootstrapIndex < homeIndex, 'Kick Home coverage bootstrap must load before provider Home.')
assert(read('src/provider-home-bootstrap.ts').includes("import './kick-coverage-ui'"), 'Kick Home bootstrap import is missing.')

const heatmapUtils = read('src/features/heatmap-page/data-state-utils.mjs')
for (const fragment of [
  "return 'official-livestreams'",
  "return 'registry'",
  "return 'seed-list'",
  "return 'public-channel-fallback'",
  "return 'Official endpoint'",
  "return 'Registry candidates'",
  "return 'Seed list'",
  "return 'Candidate fallback'",
]) assert(heatmapUtils.includes(fragment), `Heatmap source normalization is missing ${fragment}`)

if (failures.length) {
  console.error('Kick coverage UI verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Kick coverage UI verification passed for Home, Status, Heatmap, Day Flow, Battle Lines, and History.')
