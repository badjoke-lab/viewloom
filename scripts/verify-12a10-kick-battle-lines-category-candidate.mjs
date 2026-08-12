import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const HIDDEN_SHA = 'a802e7fe1e964180904c72744b7228c549a54660'
const read = (path) => readFileSync(path, 'utf8')
const readAt = (sha, path) => execFileSync('git', ['show', `${sha}:${path}`], { encoding: 'utf8' })
const json = (path) => JSON.parse(read(path))
const decision = json('docs/audits/12a10-kick-battle-lines-category-feasibility-decision.json')
const core = readAt(HIDDEN_SHA, 'apps/web/functions/_lib/battle-lines-core.ts')
const category = readAt(HIDDEN_SHA, 'apps/web/functions/_lib/battle-lines-category.ts')
const api = readAt(HIDDEN_SHA, 'apps/web/functions/api/kick-battle-lines.ts')
const controller = readAt(HIDDEN_SHA, 'apps/web/src/live/battle-lines-current-shell-entry.ts')
const kickHtml = readAt(HIDDEN_SHA, 'apps/web/kick/battle-lines/index.html')
const twitchApi = readAt(HIDDEN_SHA, 'apps/web/functions/api/battle-lines.ts')

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.trackingIssue, 813)
assert.equal(decision.decision, 'authorize_hidden_kick_battle_lines_category_candidate')
assert.equal(decision.implementationBoundary.hiddenCandidateImplementationAuthorized, true)
assert.equal(decision.implementationBoundary.publicExposureAuthorized, false)

for (const fragment of [
  "export type BattlePointState = 'observed' | 'offline' | 'not_observed' | 'missing' | 'outside_category' | 'category_unavailable'",
  "pointState?: 'outside_category' | 'category_unavailable'",
  'categoryScoped?: boolean',
  'explicitStates: Map<number, BattlePointState>',
  "item.pointState === 'category_unavailable'",
  "explicit === 'outside_category' || explicit === 'category_unavailable'",
  'scoreBattles(lines, options.metric, Boolean(options.categoryScoped))',
  'const categoryIneligible = categoryScoped',
  'previousRawLeader = null',
  "a.points[index].state === 'outside_category'",
  "b.points[index].state === 'category_unavailable'",
]) assert.ok(core.includes(fragment), `Battle Lines core category contract missing: ${fragment}`)

for (const fragment of [
  "export const BATTLE_CATEGORY_CONTRACT_VERSION = 'category-source-v1'",
  'categoryRefs.length === parsed.rawItems.length',
  "'category_unavailable' as const",
  "'outside_category' as const",
  'candidateIds.add(item.id)',
  'category.viewerMinutes += item.viewers * sampleIntervalMinutes',
]) assert.ok(category.includes(fragment), `category projection missing: ${fragment}`)
assert.ok(category.includes("return !normalized || normalized.toLowerCase() === 'all' ? 'all'"))
assert.ok(category.includes("coverageState === 'unavailable'"))
assert.ok(category.includes("knownCategoryIds.has(options.selectedCategory)"))
assert.ok(category.includes("state === 'selected'"))

const noCategoryBranch = api.indexOf('if (!categoryCandidateRequested)')
const dictionaryRead = api.indexOf('FROM provider_category_dictionary')
assert.ok(noCategoryBranch > 0 && dictionaryRead > noCategoryBranch, 'no-category fallback must return before category dictionary path')
for (const fragment of [
  "const categoryCandidateRequested = url.searchParams.has('category')",
  "const requestedCategory = normalizeBattleCategory(url.searchParams.get('category'))",
  "requestedCategory === 'all'",
  "buildBattleLinesPayload(compacted.rows, options)",
  "buildBattleLinesPayload(projection.rows, { ...options, categoryScoped: true })",
  "implementationState: 'hidden_candidate'",
  'publicExposureAuthorized: false',
  'filterBeforeCandidateCompaction: true',
  'filterBeforeTopN: true',
  'filterBeforeRecommendedBattleScoring: true',
  "candidateRankingMetric: 'category_qualified_viewer_minutes'",
  "selectedCategoryPointStates: ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing']",
  'outsideCategoryExcludedFromMissingPenalty: true',
  'categoryUnavailableExcludedFromMissingPenalty: true',
  'unknownCategoryMaySubstituteGlobalLines: false',
  'FROM provider_category_dictionary',
  ".bind('kick').all<KickBattleCategoryDictionaryRow>()",
]) assert.ok(api.includes(fragment), `Kick Battle Lines candidate API missing: ${fragment}`)
assert.equal(api.includes('DB_TWITCH_HOT'), false)

for (const fragment of [
  "const categoryPreviewEnabled = provider === 'kick' && params.get('categoryPreview') === '1'",
  'if (categoryPreviewEnabled) installCategoryPreviewControl()',
  "if (categoryPreviewEnabled) query.set('category', state.category)",
  "next.set('categoryPreview', '1')",
  "next.set('category', state.category)",
  "root.dataset.battleCategoryPreview = 'hidden'",
  'data-battle-category-preview-select',
  "filter.implementationState !== 'hidden_candidate'",
  'filter.publicExposureAuthorized !== false',
  'state.category = normalizeCategory(select.value)',
  '.battle-category-preview select{min-height:44px}',
]) assert.ok(controller.includes(fragment), `hidden Battle Lines controller missing: ${fragment}`)
for (const forbidden of ['window.fetch =', 'window.history.replaceState =', 'URLSearchParams.prototype.get =']) {
  assert.equal(controller.includes(forbidden), false, `Battle Lines controller must retain native browser global: ${forbidden}`)
}

assert.equal(kickHtml.includes('data-battle-category-preview'), false, 'normal Kick HTML must remain category-free')
assert.equal(kickHtml.includes('categoryPreview'), false, 'normal Kick HTML must not hard-code preview activation')
assert.equal(twitchApi.includes('battle-lines-category'), false, 'Twitch Battle Lines must not import Kick category implementation')
assert.equal(twitchApi.includes('categoryFilter'), false, 'Twitch Battle Lines category surface must remain absent')

for (const key of [
  'normalKickBattleLinesRemainsCategoryFree',
  'hiddenCategoryControlRequiresPreview',
  'selectedCategoryFilterBeforeTopAndScoring',
  'categorySwitchPointStateHonesty',
  'categoryUnavailablePointStateHonesty',
  'unknownCategoryHonesty',
  'viewersAndIndexedModes',
  'desktopNoOverflow',
  'mobileNoOverflow',
  'twitchProviderIsolation',
  'exactProductionReadOnlyEvidenceRequiredBeforePublicDecision',
]) assert.equal(decision.requiredHiddenValidation[key], true)

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 815,
  decisionIssue: 813,
  provider: 'kick',
  surface: 'battle_lines',
  implementationState: 'hidden_candidate',
  publicExposureAuthorized: false,
  normalRouteCategoryFree: true,
  categoryFilterBeforeTopAndScoring: true,
  pointStates: ['observed', 'outside_category', 'category_unavailable', 'offline', 'not_observed', 'missing'],
  nativeBrowserGlobalsPreserved: true,
  historicalVerifier: true,
  hiddenAuthoritySha: HIDDEN_SHA,
}, null, 2))
