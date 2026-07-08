import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const jsonPath = 'docs/audits/r12c1-launch-copy-package.json'
const mdPath = 'docs/product/english-launch-copy.md'
const inventoryPath = 'docs/audits/r12c0-message-inventory.json'
for (const path of [jsonPath, mdPath, inventoryPath]) assert.equal(existsSync(path), true, `missing ${path}`)

const source = JSON.parse(readFileSync(inventoryPath, 'utf8'))
assert.equal(source.status, 'complete')
assert.equal(source.workstream, 'R12C-0')
assert.equal(source.completion.r12c0_complete, true)

const pkg = JSON.parse(readFileSync(jsonPath, 'utf8'))
assert.equal(pkg.schema, 'viewloom-r12c1-launch-copy-package-v1')
assert.equal(pkg.phase, 'Phase 12')
assert.equal(pkg.workstream, 'R12C-1')
assert.equal(pkg.status, 'complete')
assert.equal(pkg.source_inventory, inventoryPath)
assert.equal(pkg.source_language_document, mdPath)

assert.ok(pkg.descriptions.one_line.length >= 80 && pkg.descriptions.one_line.length <= 260, 'one-line description length outside accepted boundary')
assert.ok(pkg.descriptions.short.length >= 180 && pkg.descriptions.short.length <= 650, 'short description length outside accepted boundary')
assert.ok(pkg.descriptions.long_sections.length >= 9, 'long description section inventory incomplete')
assert.ok(/independent, unofficial/i.test(pkg.descriptions.one_line), 'one-line description must preserve independent/unofficial identity')
assert.ok(/bounded/i.test(pkg.descriptions.one_line), 'one-line description must preserve bounded evidence claim')
assert.ok(/Twitch and Kick remain separate/i.test(pkg.descriptions.short), 'short description must preserve provider separation')

const expectedFeatures = ['Heatmap', 'Day Flow', 'Battle Lines', 'History', 'Channel', 'Local Watchlist', 'Status']
assert.deepEqual(pkg.feature_roles.map((item) => item.feature), expectedFeatures)
for (const item of pkg.feature_roles) {
  assert.ok(item.role, `${item.feature}: role missing`)
  assert.ok(item.summary, `${item.feature}: summary missing`)
}

assert.equal(pkg.coverage.twitch, 'configured Top 300 observed window')
assert.equal(pkg.coverage.kick, 'configured set of up to 100 observed candidates')
assert.ok(pkg.coverage.kick_plain_language.includes('not a provider-wide directory'))
assert.ok(pkg.coverage.global_boundary.includes('bounded provider-specific sets'))

assert.equal(pkg.provider_separation.separate_across.length, 10)
for (const boundary of ['collection', 'storage', 'routes', 'coverage models', 'retained data', 'rankings', 'exports', 'baselines', 'relationships', 'analytical claims']) {
  assert.ok(pkg.provider_separation.separate_across.includes(boundary), `provider separation boundary missing: ${boundary}`)
}
assert.equal(pkg.provider_separation.forbidden_outputs.length, 3)

assert.equal(pkg.retention.collection_cadence, '5 minutes')
assert.equal(pkg.retention.public_daily_rollups, 'up to 180 days')
assert.ok(pkg.retention.boundary.includes('does not mean every raw observation is retained for 180 days'))
assert.ok(pkg.retention.boundary.includes('exact session records'))

assert.equal(pkg.faq.length, 12)
const expectedQuestions = [
  'What is ViewLoom?',
  'Does ViewLoom cover every live stream?',
  'Why is Kick described as candidate-based?',
  'Are Twitch and Kick combined?',
  'Are these official Twitch or Kick analytics?',
  'What is each main view for?',
  'How often is data collected?',
  'How long is historical data retained?',
  'What do Fresh, Partial, and Empty mean?',
  'Does support affect rankings, coverage, or data correction?',
  'Where can I check data health and methodology?',
  'Where is Local Watchlist data stored?',
]
assert.deepEqual(pkg.faq.map((item) => item.question), expectedQuestions)
for (const item of pkg.faq) assert.ok(item.answer.length >= 40, `${item.question}: answer too short`)

const expectedHelpLinks = {
  method_and_limits: 'https://vl.badjoke-lab.com/about/',
  twitch_status: 'https://vl.badjoke-lab.com/twitch/status/',
  kick_status: 'https://vl.badjoke-lab.com/kick/status/',
  changelog: 'https://vl.badjoke-lab.com/changelog/',
  repository: 'https://github.com/badjoke-lab/viewloom',
}
assert.deepEqual(pkg.links.status_help, expectedHelpLinks)
const expectedLegalLinks = {
  support: 'https://vl.badjoke-lab.com/support/',
  contact: 'https://vl.badjoke-lab.com/contact/',
  terms: 'https://vl.badjoke-lab.com/terms/',
  privacy: 'https://vl.badjoke-lab.com/privacy/',
  refund_policy: 'https://vl.badjoke-lab.com/refund-policy/',
  commercial_disclosure: 'https://vl.badjoke-lab.com/commercial-disclosure/',
}
assert.deepEqual(pkg.links.support_legal, expectedLegalLinks)

const expectedForbidden = [
  'complete platform coverage',
  'official Twitch or Kick analytics',
  'unique viewers',
  'exact creator revenue',
  'exact session reconstruction',
  'causal explanations for audience movement',
  'combined Twitch and Kick audience totals',
  'cross-platform rankings',
  'Twitch-parity Kick directory coverage',
  'charitable donation framing for the support flow',
]
assert.deepEqual(pkg.forbidden_claims, expectedForbidden)

const reusableCopy = `${pkg.descriptions.one_line}\n${pkg.descriptions.short}\n${pkg.faq.map((item) => item.answer).join('\n')}`.toLowerCase()
for (const forbidden of ['complete platform coverage', 'unique viewers', 'exact creator revenue', 'exact session reconstruction', 'combined twitch and kick audience totals', 'cross-platform rankings']) {
  assert.equal(reusableCopy.includes(forbidden), false, `reusable launch copy contains forbidden positive claim: ${forbidden}`)
}

for (const [key, value] of Object.entries(pkg.completion)) {
  if (key === 'next_workstream') continue
  assert.equal(value, true, `R12C-1 completion flag not true: ${key}`)
}
assert.equal(pkg.completion.next_workstream, 'R12C-2 launch/share asset package')

const md = readFileSync(mdPath, 'utf8')
for (const fragment of [
  'Status: approved Phase 12 source-language package',
  '## 1. One-line description',
  '## 2. Short listing description',
  '## 3. Long description',
  '## 4. Core feature summary',
  '## 5. Coverage limitations',
  '## 6. Provider separation explanation',
  '## 7. Collection and retention explanation',
  '## 8. FAQ',
  '## 9. Status and help links',
  '## 10. Support and legal links',
  '## 11. Terminology contract',
  '## 12. R12C-2 handoff',
  'ViewLoom collects observations on a 5-minute schedule.',
  'Public daily rollups can be retained for up to 180 days.',
  'The next workstream',
]) assert.ok(md.includes(fragment), `${mdPath}: missing ${fragment}`)

console.log('R12C-1 launch copy package verification passed.')
console.log('- one-line, short, and long descriptions are present')
console.log('- seven product roles are covered')
console.log('- provider-specific coverage and separation boundaries are explicit')
console.log('- cadence and rollup-retention explanations are bounded')
console.log('- 12 FAQ answers and both link packages are complete')
console.log('- reusable launch copy avoids forbidden positive claims')
console.log('- R12C-2 launch/share asset package is next')
