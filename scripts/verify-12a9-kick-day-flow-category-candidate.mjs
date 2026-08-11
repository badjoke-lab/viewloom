import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const decision = JSON.parse(read('docs/audits/12a9-kick-day-flow-category-feasibility-decision.json'))
const core = read('apps/web/functions/api/day-flow-category-core.mjs')
const coreTypes = read('apps/web/functions/api/day-flow-category-core.d.mts')
const kickApi = read('apps/web/functions/api/kick-day-flow.ts')
const controls = read('apps/web/src/live/day-flow-category-preview-entry.ts')
const kickEntry = read('apps/web/src/live/day-flow-kick-entry.ts')
const kickPage = read('apps/web/kick/day-flow/index.html')
const twitchEntry = read('apps/web/src/live/day-flow-twitch-entry.ts')
const twitchApi = read('apps/web/functions/api/day-flow.ts')

assert.equal(decision.decision, 'authorize_hidden_kick_day_flow_category_candidate')
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'day_flow')
assert.equal(decision.authorization?.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization?.defaultRoutePublicExposureAuthorized, false)
assert.equal(decision.candidateContract?.previewParameter, 'categoryPreview=1')
assert.equal(decision.candidateContract?.productionHiddenBrowserRevalidationRequired, true)

assert.match(core, /provider = 'twitch'/)
assert.match(core, /bucketAggregation = 'max'/)
assert.match(core, /bucketAggregation === 'average'/)
assert.match(core, /`https:\/\/kick\.com\/\$\{id\}`/)
assert.match(core, /`https:\/\/www\.twitch\.tv\/\$\{id\}`/)
assert.match(core, /`all_observed_\$\{provider\}_viewers_per_bucket`/)
assert.match(coreTypes, /provider\?: 'twitch' \| 'kick'/)
assert.match(coreTypes, /bucketAggregation\?: 'max' \| 'average'/)

assert.match(kickApi, /url\.searchParams\.has\('category'\)/)
assert.match(kickApi, /FROM provider_category_dictionary/)
assert.match(kickApi, /\.bind\('kick'\)\.all<CategoryRow>/)
assert.match(kickApi, /provider: 'kick'/)
assert.match(kickApi, /bucketAggregation: 'average'/)
assert.match(kickApi, /implementationState: 'hidden_candidate'/)
assert.match(kickApi, /publicExposureAuthorized: false/)
assert.match(kickApi, /if \(!categoryCandidateRequested\)/)
assert.match(kickApi, /requestedCategory === 'all'\s*\? built/)
assert.match(kickApi, /if \(filterState !== 'selected'\) \{/)
assert.match(kickApi, /const others = makeGlobalOthers\(\[\], labels, totals, bucketSize\)/)
assert.match(kickApi, /const bands = others\.totalViewerMinutes > 0 \? \[others\] : \[\]/)
assert.match(kickApi, /return \{ bands, streamers: \[\], totals, observed \}/)
assert.match(kickApi, /makeGlobalOthers/)
assert.match(kickApi, /all_observed_kick_viewers_per_bucket/)
assert.match(kickApi, /displayed_selected_category_top_n_viewers_per_bucket/)
assert.doesNotMatch(kickApi, /DB_TWITCH_HOT/)

assert.match(controls, /const publicProvider = provider === 'twitch'/)
assert.match(controls, /const enabled = publicProvider \|\| legacyPreviewAtLoad/)
assert.match(controls, /provider === 'kick' \? '\/api\/kick-day-flow' : '\/api\/day-flow'/)
assert.match(controls, /filter\.implementationState === 'public' && filter\.publicExposureAuthorized === true/)
assert.match(controls, /filter\.implementationState === 'hidden_candidate' && filter\.publicExposureAuthorized === false/)
assert.match(controls, /next\.searchParams\.set\(PREVIEW_PARAM, '1'\)/)

assert.match(kickEntry, /import '\.\/day-flow-category-preview-entry'/)
assert.match(kickEntry, /import\('\.\/day-flow-current-shell-entry'\)/)
assert.match(kickPage, /src="\/src\/live\/day-flow-kick-entry\.ts"/)
assert.doesNotMatch(kickPage, /src="\/src\/live\/day-flow-current-shell-entry\.ts"/)

assert.match(twitchEntry, /import '\.\/day-flow-category-preview-entry'/)
assert.match(twitchEntry, /import\('\.\/day-flow-current-shell-entry'\)/)
assert.match(twitchApi, /implementationState: 'public'/)
assert.match(twitchApi, /publicExposureAuthorized: true/)
assert.doesNotMatch(twitchApi, /provider: 'kick'/)
assert.doesNotMatch(twitchApi, /bucketAggregation: 'average'/)

for (const forbidden of [
  'workers/collector-kick',
  'workers/collector-twitch',
  'wrangler.toml',
  'migrations/',
]) {
  assert.equal([core, kickApi, controls, kickEntry].some((source) => source.includes(forbidden)), false, `runtime candidate must not wire forbidden surface ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 795,
  repairIssue: 801,
  decisionIssue: 793,
  provider: 'kick',
  surface: 'day_flow',
  implementationState: 'hidden_candidate',
  publicExposureAuthorized: false,
  normalKickRouteCategoryFree: true,
  twitchPublicBoundaryPreserved: true,
  kickBucketAggregation: 'average',
  filterBeforeTopN: true,
  perObservedSnapshotMembership: true,
  zeroMatchSelectedBandsInferred: false,
  zeroMatchGlobalOthersPreserved: true,
  collectorWorkerD1ChangesAuthorized: false,
}, null, 2))
