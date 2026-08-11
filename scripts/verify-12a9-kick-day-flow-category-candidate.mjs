import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const HIDDEN_SHA = '27b3cca084d62d8badd512c068be415c6865965e'
const show = (path) => execFileSync('git', ['show', `${HIDDEN_SHA}:${path}`], { encoding: 'utf8' })
const decision = JSON.parse(readFileSync('docs/audits/12a9-kick-day-flow-category-feasibility-decision.json', 'utf8'))
const core = show('apps/web/functions/api/day-flow-category-core.mjs')
const coreTypes = show('apps/web/functions/api/day-flow-category-core.d.mts')
const kickApi = show('apps/web/functions/api/kick-day-flow.ts')
const controls = show('apps/web/src/live/day-flow-category-preview-entry.ts')
const kickEntry = show('apps/web/src/live/day-flow-kick-entry.ts')
const kickPage = show('apps/web/kick/day-flow/index.html')
const twitchApi = show('apps/web/functions/api/day-flow.ts')

assert.equal(decision.decision, 'authorize_hidden_kick_day_flow_category_candidate')
assert.equal(decision.provider, 'kick')
assert.equal(decision.surface, 'day_flow')
assert.equal(decision.authorization?.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.authorization?.defaultRoutePublicExposureAuthorized, false)
assert.equal(decision.candidateContract?.previewParameter, 'categoryPreview=1')

assert.match(core, /provider = 'twitch'/)
assert.match(core, /bucketAggregation = 'max'/)
assert.match(core, /bucketAggregation === 'average'/)
assert.match(core, /`all_observed_\$\{provider\}_viewers_per_bucket`/)
assert.match(coreTypes, /provider\?: 'twitch' \| 'kick'/)
assert.match(coreTypes, /bucketAggregation\?: 'max' \| 'average'/)

assert.match(kickApi, /url\.searchParams\.has\('category'\)/)
assert.match(kickApi, /\.bind\('kick'\)\.all<CategoryRow>/)
assert.match(kickApi, /provider: 'kick'/)
assert.match(kickApi, /bucketAggregation: 'average'/)
assert.match(kickApi, /implementationState: 'hidden_candidate'/)
assert.match(kickApi, /publicExposureAuthorized: false/)
assert.match(kickApi, /if \(!categoryCandidateRequested\)/)
assert.match(kickApi, /requestedCategory === 'all'\s*\? built/)
assert.match(kickApi, /if \(filterState !== 'selected'\) \{/)
assert.match(kickApi, /const others = makeGlobalOthers\(\[\], labels, totals, bucketSize\)/)
assert.match(kickApi, /return \{ bands, streamers: \[\], totals, observed \}/)
assert.match(kickApi, /all_observed_kick_viewers_per_bucket/)
assert.match(kickApi, /displayed_selected_category_top_n_viewers_per_bucket/)
assert.doesNotMatch(kickApi, /DB_TWITCH_HOT/)

assert.match(controls, /const publicProvider = provider === 'twitch'/)
assert.doesNotMatch(controls, /provider === 'twitch' \|\| provider === 'kick'/)
assert.match(controls, /const enabled = publicProvider \|\| legacyPreviewAtLoad/)
assert.match(controls, /return legacyPreviewAtLoad && filter\.implementationState === 'hidden_candidate' && filter\.publicExposureAuthorized === false/)
assert.match(kickEntry, /import '\.\/day-flow-category-preview-entry'/)
assert.match(kickPage, /src="\/src\/live\/day-flow-kick-entry\.ts"/)
assert.match(twitchApi, /implementationState: 'public'/)
assert.match(twitchApi, /publicExposureAuthorized: true/)

console.log(JSON.stringify({
  status: 'pass',
  historicalAuthoritySha: HIDDEN_SHA,
  trackingIssue: 795,
  repairIssue: 801,
  decisionIssue: 793,
  provider: 'kick',
  surface: 'day_flow',
  implementationState: 'hidden_candidate',
  publicExposureAuthorized: false,
  historicalVerifier: true,
  kickBucketAggregation: 'average',
  filterBeforeTopN: true,
  perObservedSnapshotMembership: true,
  zeroMatchSelectedBandsInferred: false,
  zeroMatchGlobalOthersPreserved: true,
}, null, 2))
