import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decisionPath = 'docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json'
assert.equal(existsSync(decisionPath), true)
const decision = json(decisionPath)
const controls = read('apps/web/src/features/twitch-heatmap/category-preview-controls.ts')
const model = read('apps/web/src/features/twitch-heatmap/model.ts')
const api = read('apps/web/functions/api/twitch-heatmap.ts')
const runtime = read('apps/web/src/live/twitch-heatmap.ts')

assert.equal(decision.authorization.publicTwitchCategoryUiAuthorized, true)
assert.equal(decision.authorization.kickCategoryUiAuthorized, false)
assert.equal(decision.publicBehavior.defaultCategory, 'all')
assert.equal(decision.publicBehavior.defaultTop, 50)
assert.deepEqual(decision.publicBehavior.allowedTopValues, [20, 50, 100])

for (const fragment of [
  "const TOP_VALUES = [20, 50, 100] as const",
  'const DEFAULT_TOP = 50',
  "const enabled = provider === 'twitch'",
  '<span class="heatmap-control-dock__label">Category</span>',
  'aria-label="Twitch category"',
  'aria-label="Twitch maximum streams"',
  'All categories',
  "url.searchParams.delete(PREVIEW_PARAM)",
  'window.history.replaceState',
]) assert.ok(controls.includes(fragment), `controls missing: ${fragment}`)
for (const forbidden of ['Hidden preview', 'public exposure disabled', 'data-hidden-preview']) {
  assert.equal(controls.includes(forbidden), false, `controls still hidden-only: ${forbidden}`)
}

assert.ok(model.includes("implementationState: 'hidden' | 'public'"))
assert.ok(model.includes('publicExposureAuthorized: boolean'))
for (const fragment of [
  "implementationState: 'public'",
  'publicExposureAuthorized: true',
  'category_filter_public_exposure=true',
  'filterBeforeTopN: true',
]) assert.ok(api.includes(fragment), `api missing: ${fragment}`)
assert.equal(api.includes("category_filter_public_exposure=false"), false)
assert.ok(runtime.includes('readCategoryPreviewState(provider.key)'))
assert.ok(runtime.includes('buildCategoryPreviewEndpoint(provider.endpoint, provider.key, categoryPreview)'))
assert.ok(runtime.includes('installCategoryPreviewControls'))
assert.ok(runtime.includes('syncCategoryPreviewControls'))

const kickSource = read('apps/web/src/live/twitch-heatmap.ts')
assert.ok(kickSource.includes("key: 'kick'"))
assert.ok(controls.includes("if (!options.state.enabled || options.provider !== 'twitch')"))

console.log(JSON.stringify({
  status: 'pass',
  provider: 'twitch',
  defaultCategory: decision.publicBehavior.defaultCategory,
  defaultTop: decision.publicBehavior.defaultTop,
  topValues: decision.publicBehavior.allowedTopValues,
  publicTwitchCategoryUiAuthorized: true,
  kickCategoryUiAuthorized: false,
}, null, 2))
