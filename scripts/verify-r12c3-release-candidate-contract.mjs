import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const required = [
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/english-launch-copy.md',
  'docs/product/launch-asset-captions.md',
  'docs/audits/r12c0-message-inventory.json',
  'docs/audits/r12c1-launch-copy-package.json',
  'docs/audits/r12c2-launch-assets-capture.json',
  'docs/audits/r12c2-launch-asset-manifest.json',
  'docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md',
  'apps/web/scripts/verify-content-qa.mjs',
  'apps/web/scripts/verify-seo-qa.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  'scripts/verify-public-current-browser-audit.mjs',
  'scripts/verify-r12c2-launch-assets-package.mjs',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) assert.equal(existsSync(path), true, `missing R12C-3 dependency: ${path}`)

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
]) {
  const source = read(path)
  for (const fragment of [
    'R12C-2',
    'complete',
    'R12C-3',
    'active',
    'work-release-r12c3-release-candidate-acceptance',
    'Phase 12A Analytics Capture Foundation',
  ]) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.counts.public_readiness_configured_pages, 25)
assert.equal(inventory.counts.production_smoke_page_routes, 25)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const r12c0 = json('docs/audits/r12c0-message-inventory.json')
assert.equal(r12c0.status, 'complete')
assert.equal(r12c0.completion.r12c0_complete, true)

const r12c1 = json('docs/audits/r12c1-launch-copy-package.json')
assert.equal(r12c1.status, 'complete')
assert.equal(r12c1.completion.r12c1_complete, true)
assert.equal(r12c1.faq.length, 12)

const capture = json('docs/audits/r12c2-launch-assets-capture.json')
assert.equal(capture.result, 'pass')
assert.equal(capture.assets.length, 6)
assert.equal(capture.violations.length, 0)

const manifest = json('docs/audits/r12c2-launch-asset-manifest.json')
assert.equal(manifest.capture.result, 'pass')
assert.equal(manifest.packageVerification.result, 'pass')
assert.equal(manifest.assetCount, 6)
assert.equal(manifest.assets.length, 6)

const productionSmoke = read('.github/workflows/production-smoke.yml')
for (const fragment of [
  'Wait for the matching production deployment',
  'expected="$GITHUB_SHA"',
  'test "${#routes[@]}" = \'25\'',
  '/api/twitch-status',
  '/api/kick-status',
  'DB_TWITCH_HOT',
  'DB_KICK_HOT',
  'Verify explicit not-found behavior',
]) assert.ok(productionSmoke.includes(fragment), `Production Smoke missing ${fragment}`)

const contentQa = read('apps/web/scripts/verify-content-qa.mjs')
assert.ok(contentQa.includes('https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'))
assert.ok(contentQa.includes('/refund-policy/'))
assert.ok(contentQa.includes('/commercial-disclosure/'))
assert.ok(contentQa.includes('ViewLoom is not Twitch or Kick support'))

const seoQa = read('apps/web/scripts/verify-seo-qa.mjs')
assert.ok(seoQa.includes('const pages = ['))
assert.ok(seoQa.includes('commercial-disclosure/index.html'))
assert.ok(seoQa.includes('kick/status/index.html'))
assert.ok(seoQa.includes('canonical'))
assert.ok(seoQa.includes('og:image'))

console.log('R12C-3 release candidate contract verification passed.')
console.log('- canonical state is R12C-3 active')
console.log('- R12C-0 inventory, R12C-1 copy, and R12C-2 assets are complete')
console.log('- 25 HTML routes / 26 inventory entries / 100 browser scenarios remain owned')
console.log('- Twitch and Kick bindings and no-combination invariants remain separate')
console.log('- production smoke owns exact-SHA deployment matching and 25 hosted routes')
console.log('- content, support/legal, SEO, canonical, sitemap, and launch-asset contracts are present')
