import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const jsonPath = 'docs/audits/r12c0-message-inventory.json'
const mdPath = 'docs/audits/r12c0-message-inventory.md'
for (const path of [jsonPath, mdPath]) assert.equal(existsSync(path), true, `missing ${path}`)

const inventory = JSON.parse(readFileSync(jsonPath, 'utf8'))
assert.equal(inventory.schema, 'viewloom-r12c0-message-inventory-v1')
assert.equal(inventory.phase, 'Phase 12')
assert.equal(inventory.workstream, 'R12C-0')
assert.equal(inventory.status, 'complete')

assert.equal(inventory.product_identity.portal_headline, 'Observe the field. Then follow the movement.')
assert.ok(inventory.product_identity.portal_lede.includes('Twitch and Kick observations always remain separate'))
assert.ok(inventory.product_identity.about_lede.includes('bounded observed field'))

for (const key of ['heatmap', 'day_flow', 'battle_lines', 'history', 'channel', 'local_watchlist', 'status']) {
  assert.ok(inventory.feature_roles[key], `missing feature role ${key}`)
}
assert.equal(inventory.feature_roles.heatmap.role, 'Now')
assert.equal(inventory.feature_roles.day_flow.role, 'Today')
assert.equal(inventory.feature_roles.battle_lines.role, 'Rivalry')
assert.equal(inventory.feature_roles.history.role, 'Trends')

assert.equal(inventory.operating_facts_and_limitations.collection_cadence, '5 minutes')
assert.equal(inventory.operating_facts_and_limitations.rollup_retention, 'Up to 180 days')
assert.equal(inventory.operating_facts_and_limitations.twitch_observed_window, 'Top 300 observed')
assert.equal(inventory.operating_facts_and_limitations.kick_observed_window, 'Top 100 observed candidates')
assert.ok(inventory.operating_facts_and_limitations.platform_separation.includes('No combined audience totals or cross-platform rankings'))

for (const route of [
  '/about/', '/twitch/status/', '/kick/status/', '/changelog/', '/support/', '/contact/',
  '/terms/', '/privacy/', '/refund-policy/', '/commercial-disclosure/'
]) {
  assert.ok(Object.values(inventory.public_help_and_policy_routes).includes(route), `missing route inventory ${route}`)
}

assert.ok(inventory.faq_source_material.length >= 10, 'FAQ source material is incomplete')
for (const term of ['observed data', 'platform-separated', 'viewer-minutes', 'data status']) {
  assert.ok(inventory.terminology.approved_candidates_for_r12c1.includes(term), `approved terminology candidate missing: ${term}`)
}
for (const term of ['complete platform coverage', 'official analytics', 'cross-platform ranking']) {
  assert.ok(inventory.terminology.avoid_or_forbid.includes(term), `forbidden terminology missing: ${term}`)
}

assert.equal(inventory.share_asset_inventory.repo_owned.length, 1)
assert.equal(inventory.share_asset_inventory.repo_owned[0].path, 'apps/web/public/og/viewloom.svg')
assert.equal(inventory.share_asset_inventory.repo_owned[0].dimensions, '1200x630')
assert.equal(inventory.share_asset_inventory.ci_generated_not_repo_owned_launch_assets.viewports.length, 4)
assert.ok(inventory.share_asset_inventory.r12c2_asset_gaps.length >= 8)

for (const id of [
  'launch-description-set-missing',
  'faq-package-missing',
  'retention-explanation-fragmented',
  'kick-candidate-model-needs-plain-language',
  'launch-asset-package-missing',
]) assert.ok(inventory.message_gaps_for_r12c1.some((gap) => gap.id === id), `message gap missing: ${id}`)

for (const [key, value] of Object.entries(inventory.completion)) {
  if (key === 'next_workstream') continue
  assert.equal(value, true, `R12C-0 completion flag not true: ${key}`)
}
assert.equal(inventory.completion.next_workstream, 'R12C-1 launch copy and FAQ')

const notes = readFileSync(mdPath, 'utf8')
for (const fragment of [
  'Status: complete',
  'Workstream: R12C-0',
  'Observe the field. Then follow the movement.',
  'Heatmap       Now',
  'Day Flow      Today',
  'Battle Lines  Rivalry',
  'History       Trends',
  'apps/web/public/og/viewloom.svg',
  'curated current desktop product screenshot',
  'plain-language Kick candidate-coverage explanation',
  'The next workstream is R12C-1 launch copy and FAQ.',
]) assert.ok(notes.includes(fragment), `${mdPath}: missing ${fragment}`)

console.log('R12C-0 message inventory verification passed.')
console.log('- Portal/About source messages are inventoried')
console.log('- feature roles and evidence boundaries are inventoried')
console.log('- Status/help/support/legal route map is inventoried')
console.log('- FAQ source material and terminology candidates are defined')
console.log('- generic OG asset and CI-only screenshot evidence are separated')
console.log('- R12C-1 message gaps and R12C-2 asset gaps are explicit')
console.log('- R12C-1 launch copy and FAQ is next')
