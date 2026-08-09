import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const decisionPath = 'docs/audits/12a6-twitch-day-flow-category-feasibility-decision.json'
const decision = json(decisionPath)
const api = read('apps/web/functions/api/day-flow.ts')
const core = read('apps/web/functions/api/day-flow-category-core.mjs')
const preview = read('apps/web/src/live/day-flow-category-preview-entry.ts')
const twitchEntry = read('apps/web/src/live/day-flow-twitch-entry.ts')
const twitchHtml = read('apps/web/twitch/day-flow/index.html')
const kickHtml = read('apps/web/kick/day-flow/index.html')
const shell = read('apps/web/src/live/day-flow-current-shell-entry.ts')
const twitchWrangler = read('workers/collector-twitch/wrangler.toml')
const kickWrangler = read('workers/collector-kick/wrangler.toml')

for (const path of [
  'apps/web/functions/api/day-flow-category-core.mjs',
  'apps/web/functions/api/day-flow-category-core.d.mts',
  'apps/web/src/live/day-flow-twitch-entry.ts',
  'apps/web/scripts/day-flow-category-core.test.mjs',
  'apps/web/scripts/day-flow-category-preview-browser.mjs',
]) assert.equal(existsSync(path), true, `${path}: missing`)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.decisionPr, 744)
assert.equal(decision.decision, 'authorize_hidden_twitch_day_flow_category_candidate')
assert.equal(decision.authorization.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization.defaultRoutePublicExposureAuthorized, false)
assert.equal(decision.authorization.kickCategoryUiAuthorized, false)
assert.equal(decision.authorization.historyCategoryUiAuthorized, false)

for (const fragment of [
  "import { projectDayFlowCategory } from './day-flow-category-core.mjs'",
  "const categoryCandidateRequested = url.searchParams.has('category')",
  "if (!categoryCandidateRequested)",
  'buildPayload(rows, period, topN, bucketSize, valueMode)',
  'provider_category_dictionary',
  ".bind('twitch')",
  'buildCategoryCandidatePayload',
  "implementationState: 'hidden_candidate'",
  'publicExposureAuthorized: false',
  "membershipEvaluation: 'per_observed_snapshot'",
  'latestCategoryBackProjectionAllowed: false',
  "fullShareDenominator: 'all_observed_twitch_viewers_per_bucket'",
  "topFocusShareDenominator: 'displayed_selected_category_top_n_viewers_per_bucket'",
  "category_filter_before_top_n=true",
  "category_public_exposure=false",
]) assert.ok(api.includes(fragment), `Day Flow API missing candidate contract: ${fragment}`)

for (const fragment of [
  "const CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryRefs.length === parsed.rawItems.length',
  'updateStream(allStreams',
  'updateStream(selectedStreams',
  "filterBeforeTopN: true",
  "membershipEvaluation: 'per_observed_snapshot'",
  "latestCategoryBackProjectionAllowed: false",
  "state: coverageState(stats)",
  "return 'unavailable'",
  "return 'partial'",
  "return 'observed'",
]) assert.ok(core.includes(fragment), `category projection core missing: ${fragment}`)

for (const fragment of [
  "provider === 'twitch' && initialUrl.searchParams.get(PREVIEW_PARAM) === '1'",
  "requestUrl.pathname !== '/api/day-flow'",
  'requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  "root.dataset.dayflowCategoryPreview = 'hidden'",
  'Twitch Day Flow category preview',
  'dayflow-category-coverage-strip',
  'is-partial',
  'is-unavailable',
  "url.searchParams.set(PREVIEW_PARAM, '1')",
]) assert.ok(preview.includes(fragment), `hidden preview entry missing: ${fragment}`)

const previewImport = "import './day-flow-category-preview-entry'"
const shellImport = "void import('./day-flow-current-shell-entry')"
assert.ok(twitchEntry.includes(previewImport), 'Twitch Day Flow bootstrap must import preview boundary')
assert.ok(twitchEntry.includes(shellImport), 'Twitch Day Flow bootstrap must dynamically import existing shell')
assert.ok(twitchEntry.indexOf(previewImport) < twitchEntry.indexOf(shellImport), 'preview boundary must evaluate before shell hydration')

const twitchBootstrapScript = '<script type="module" src="/src/live/day-flow-twitch-entry.ts"></script>'
assert.ok(twitchHtml.includes(twitchBootstrapScript), 'Twitch Day Flow must load serialized Twitch bootstrap')
assert.equal(twitchHtml.includes('/src/live/day-flow-category-preview-entry.ts'), false, 'Twitch HTML must not race preview as a separate module script')
assert.equal(twitchHtml.includes('/src/live/day-flow-current-shell-entry.ts'), false, 'Twitch HTML must not race shell as a separate module script')
assert.equal(kickHtml.includes('day-flow-twitch-entry.ts'), false, 'Kick must not load Twitch Day Flow bootstrap')
assert.equal(kickHtml.includes('day-flow-category-preview-entry.ts'), false, 'Kick must not load Twitch category preview entry')
assert.equal(kickHtml.includes('dayflow-category-preview-controls'), false, 'Kick static HTML must not contain Twitch category controls')

// Existing Day Flow Full/Top Focus share semantics remain untouched in the main shell.
assert.ok(shell.includes("if (state.scope === 'full') return globalShareAt(band, index)"))
assert.ok(shell.includes('const denominator = nonOthers(payload).slice(0, state.top).reduce'))
assert.equal(shell.includes('categoryPreview'), false, 'existing shell should remain category-agnostic')
assert.equal(shell.includes('dayflow-category-preview'), false, 'existing shell should remain preview-agnostic')

for (const key of [
  'collectorChangeAuthorized',
  'workerCollectorDeploymentAuthorized',
  'd1MutationAuthorized',
  'd1SchemaChangeAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'thresholdRelaxationAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(decision.authorization[key], false, `${key}: must remain false`)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(twitchWrangler), '*/5 * * * *')
assert.equal(cron(kickWrangler), '*/5 * * * *')

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 745,
  decisionPr: 744,
  normalRouteUsesLegacyPath: true,
  hiddenCandidate: true,
  serializedTwitchBootstrap: true,
  membership: 'per_observed_snapshot',
  fullShareGlobal: true,
  coverageGapStates: ['observed', 'partial', 'unavailable'],
  publicExposureAuthorized: false,
  kickCategoryUiAuthorized: false,
}, null, 2))
