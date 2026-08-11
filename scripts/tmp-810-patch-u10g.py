from pathlib import Path


def must_replace(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'missing replacement: {label}')
    return text.replace(old, new)

# 1) Keep the original U10G history, but update the later authorized Day Flow boundary.
p = Path('docs/work-in-progress/u10g-architecture.md')
s = p.read_text()
start = s.index('## Post-U10G authorized Twitch Day Flow category boundary')
end = s.index('\n## Evidence', start)
section = """## Post-U10G authorized provider-separated Day Flow category boundary

PR #758 authorized the public Twitch Day Flow Category control. PR #808 later authorized the same already-validated Category surface for Kick after separate provider-scoped decision, hidden validation, honesty repair, and corrected production evidence. These authorizations do not reopen the general U10G permission to replace browser globals.

The retained architecture contract recognizes one bounded Day Flow exception per provider route:

- the Twitch and Kick Day Flow provider bootstraps may load `day-flow-category-preview-entry.ts` before the shared Day Flow controller;
- that boundary may wrap `window.fetch` only to add the selected `category` to the provider-correct same-origin Day Flow endpoint (`/api/day-flow` for Twitch, `/api/kick-day-flow` for Kick) and must delegate every other request unchanged;
- that boundary may wrap `history.replaceState` only to retain the current provider Day Flow `category` URL state and remove legacy `categoryPreview` after public interaction;
- `URLSearchParams.prototype.get` must never be replaced;
- both Battle Lines routes must retain native `fetch`, `history.replaceState`, and `URLSearchParams.prototype.get` identities;
- the shared Day Flow controller remains the only request/state/controller owner and still contains the single feature `fetch(` call;
- initial load must still produce exactly one provider-correct Day Flow request and zero cross-provider requests;
- both public Day Flow Category controls must expose `data-dayflow-category-preview=\"public\"` while preserving provider-separated endpoints, identities, totals, and rankings.

This is a scoped compatibility boundary for separately authorized public Twitch and Kick Day Flow Category filters, not a general relaxation of U10G.
"""
s = s[:start] + section + s[end:]
s = s.replace(
    'The later #758/#759 Twitch Day Flow category boundary is limited to the explicit exception above and does not alter those infrastructure or provider-separation boundaries.',
    'The later Twitch #758/#759 and Kick #808/#809 Day Flow category boundaries are limited to the explicit provider-scoped exception above and do not alter those infrastructure or provider-separation boundaries.',
)
p.write_text(s)

# 2) Update repository architecture verifier to the now-authorized provider-separated Day Flow wrapper.
p = Path('scripts/verify-quality-u10g-architecture.mjs')
s = p.read_text()
s = must_replace(
    s,
    "  'apps/web/src/live/day-flow-twitch-entry.ts',\n",
    "  'apps/web/src/live/day-flow-twitch-entry.ts',\n  'apps/web/src/live/day-flow-kick-entry.ts',\n",
    'required kick entry',
)
s = must_replace(
    s,
    "  'Post-U10G authorized Twitch Day Flow category boundary',\n  'only the Twitch Day Flow bootstrap may load `day-flow-category-preview-entry.ts` before the shared Day Flow controller',\n  '`URLSearchParams.prototype.get` must never be replaced',\n  'This is a scoped compatibility boundary for the already-authorized public Twitch Category filter, not a general relaxation of U10G.',",
    "  'Post-U10G authorized provider-separated Day Flow category boundary',\n  'the Twitch and Kick Day Flow provider bootstraps may load `day-flow-category-preview-entry.ts` before the shared Day Flow controller',\n  '`URLSearchParams.prototype.get` must never be replaced',\n  'This is a scoped compatibility boundary for separately authorized public Twitch and Kick Day Flow Category filters, not a general relaxation of U10G.',",
    'note fragments',
)
s = must_replace(
    s,
    "assert.equal((kickHtml.match(/day-flow-current-shell-entry\\.ts/g)??[]).length,1,'Kick Day Flow primary entry count changed')\nassert.equal(kickHtml.includes('day-flow-twitch-entry.ts'),false,'Kick must not load Twitch Day Flow bootstrap')",
    "assert.equal((kickHtml.match(/day-flow-kick-entry\\.ts/g)??[]).length,1,'Kick Day Flow must have one provider bootstrap entry')\nassert.equal((kickHtml.match(/day-flow-current-shell-entry\\.ts/g)??[]).length,0,'Kick HTML must not race the controller beside its bootstrap')\nassert.equal(kickHtml.includes('day-flow-twitch-entry.ts'),false,'Kick must not load Twitch Day Flow bootstrap')",
    'kick html entry',
)
s = must_replace(
    s,
    "const twitchEntry=read('apps/web/src/live/day-flow-twitch-entry.ts')\nconst categoryBoundary",
    "const twitchEntry=read('apps/web/src/live/day-flow-twitch-entry.ts')\nconst kickEntry=read('apps/web/src/live/day-flow-kick-entry.ts')\nconst categoryBoundary",
    'kick entry read',
)
s = must_replace(
    s,
    "assert.ok(twitchEntry.indexOf(categoryImport)<twitchEntry.indexOf(controllerImport),'public category boundary must initialize before controller hydration')",
    "assert.ok(twitchEntry.indexOf(categoryImport)<twitchEntry.indexOf(controllerImport),'Twitch public category boundary must initialize before controller hydration')\nassert.ok(kickEntry.includes(categoryImport),'Kick bootstrap missing public category boundary')\nassert.ok(kickEntry.includes(controllerImport),'Kick bootstrap missing single Day Flow controller')\nassert.ok(kickEntry.indexOf(categoryImport)<kickEntry.indexOf(controllerImport),'Kick public category boundary must initialize before controller hydration')",
    'kick bootstrap assertions',
)
old_block = """for (const fragment of [
  \"const enabled = provider === 'twitch'\",
  \"const legacyPreviewAtLoad = initialUrl.searchParams.get(PREVIEW_PARAM) === '1'\",
  \"root.dataset.dayflowCategoryPreview = 'public'\",
  \"filter.implementationState !== 'public'\",
  'filter.publicExposureAuthorized !== true',
  'window.fetch =',
  'window.history.replaceState =',
  \"requestUrl.origin !== window.location.origin || requestUrl.pathname !== '/api/day-flow'\",
  'if (next.pathname === window.location.pathname)',
  'requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  'next.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  \"if (legacyPreviewAtLoad && !publicInteractionSeen) next.searchParams.set(PREVIEW_PARAM, '1')\",
  'if (publicInteractionSeen) next.searchParams.delete(PREVIEW_PARAM)',
]) assert.ok(categoryBoundary.includes(fragment),`public Twitch category boundary missing ${fragment}`)"""
new_block = """for (const fragment of [
  \"const publicProvider = provider === 'twitch' || provider === 'kick'\",
  'const enabled = publicProvider || legacyPreviewAtLoad',
  \"const legacyPreviewAtLoad = initialUrl.searchParams.get(PREVIEW_PARAM) === '1'\",
  \"root.dataset.dayflowCategoryPreview = publicProvider ? 'public' : 'hidden'\",
  \"filter.implementationState === 'public' && filter.publicExposureAuthorized === true\",
  'window.fetch =',
  'window.history.replaceState =',
  \"const apiPath = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'\",
  'requestUrl.origin !== window.location.origin || requestUrl.pathname !== apiPath',
  'if (next.pathname === window.location.pathname)',
  'requestUrl.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  'next.searchParams.set(CATEGORY_PARAM, selectedCategory)',
  \"if (legacyPreviewAtLoad && !publicInteractionSeen) next.searchParams.set(PREVIEW_PARAM, '1')\",
  'if (publicInteractionSeen) next.searchParams.delete(PREVIEW_PARAM)',
]) assert.ok(categoryBoundary.includes(fragment),`public provider Day Flow category boundary missing ${fragment}`)"""
s = must_replace(s, old_block, new_block, 'category wrapper fragment block')
s = must_replace(
    s,
    "// PR #758 authorizes exactly one bounded provider-specific compatibility layer:\n// Twitch Day Flow may wrap fetch/history before the shared controller hydrates.\n// The browser gate must prove that the wrapper appears only on Twitch Day Flow,\n// issues one provider-correct request, preserves URLSearchParams.get identity,\n// and leaves Kick/Battle Lines on native browser identities.\nfor (const forbidden of ['URLSearchParams.prototype.get =','/api/kick-day-flow','/api/battle-lines','/api/kick-battle-lines']) assert.equal(categoryBoundary.includes(forbidden),false,`public Twitch category boundary exceeds scope: ${forbidden}`)",
    "// PR #758 and #808 authorize the same bounded provider-specific compatibility layer on Day Flow only.\n// The browser gate must prove one provider-correct request, native URLSearchParams.get,\n// and native browser identities on both Battle Lines routes.\nfor (const forbidden of ['URLSearchParams.prototype.get =','/api/battle-lines','/api/kick-battle-lines']) assert.equal(categoryBoundary.includes(forbidden),false,`public Day Flow category boundary exceeds scope: ${forbidden}`)",
    'provider wrapper scope comment',
)
s = must_replace(
    s,
    '  "const expectsCategoryBoundary = provider === \'twitch\'",',
    '  "const expectsCategoryBoundary = provider === \'twitch\' || provider === \'kick\'",',
    'browser source expectation',
)
s = must_replace(
    s,
    "console.log('- Twitch public category boundary is explicitly scoped to same-origin Day Flow fetch/history coordination')\nconsole.log('- legacy categoryPreview=1 is preserved only as URL compatibility until public Category interaction')\nconsole.log('- Kick Day Flow and both Battle Lines routes retain native browser identities')",
    "console.log('- Twitch and Kick public category boundaries are scoped to provider-correct same-origin Day Flow fetch/history coordination')\nconsole.log('- legacy categoryPreview=1 is preserved only as URL compatibility until public Category interaction')\nconsole.log('- both Battle Lines routes retain native browser identities')",
    'repo verifier summary',
)
p.write_text(s)

# 3) Update the retained browser architecture fixture to expect the authorized wrapper on both Day Flow providers.
p = Path('apps/web/scripts/quality-u10g-architecture-browser.mjs')
s = p.read_text()
s = must_replace(
    s,
    "const expectsCategoryBoundary = provider === 'twitch'",
    "const expectsCategoryBoundary = provider === 'twitch' || provider === 'kick'",
    'browser provider boundary',
)
s = s.replace('authorized Twitch Day Flow fetch wrapper was not installed', 'authorized provider Day Flow fetch wrapper was not installed')
s = s.replace('authorized Twitch Day Flow history wrapper was not installed', 'authorized provider Day Flow history wrapper was not installed')
s = must_replace(
    s,
    "  await context.route('**/api/kick-day-flow*', (route) => {\n    if (provider === 'kick') { requests.value += 1; return replyJson(route, dayFlowPayload('kick')) }",
    "  await context.route('**/api/kick-day-flow*', (route) => {\n    if (provider === 'kick') {\n      requests.value += 1\n      const url = new URL(route.request().url())\n      if (url.searchParams.get('category') === 'all') categoryRequests.value += 1\n      return replyJson(route, dayFlowPayload('kick'))\n    }",
    'kick category request counting',
)
p.write_text(s)

# 4) Update retained evidence verifier to require both Day Flow providers to keep the same bounded wrapper contract.
p = Path('scripts/verify-quality-u10g-browser-evidence.mjs')
s = p.read_text()
old = """      if (provider === 'twitch') {
        assert.equal(scenario.categoryRequests, 1, `${scenario.id}: Twitch category request missing`)
        assert.equal(scenario.initial.fetchSame, false, `${scenario.id}: authorized Twitch fetch wrapper missing`)
        assert.equal(scenario.initial.replaceStateSame, false, `${scenario.id}: authorized Twitch history wrapper missing`)
        assert.equal(scenario.initial.categoryControlPresent, true, `${scenario.id}: public Twitch Category control missing`)
        assert.equal(scenario.initial.categoryControlPublic, true, `${scenario.id}: Twitch Category control not marked public`)
        assert.equal(scenario.initial.categoryParam, 'all', `${scenario.id}: Twitch category URL state changed`)
      } else {
        assert.equal(scenario.categoryRequests, 0, `${scenario.id}: Kick issued category request`)
        assert.equal(scenario.initial.fetchSame, true, `${scenario.id}: Kick fetch identity changed`)
        assert.equal(scenario.initial.replaceStateSame, true, `${scenario.id}: Kick replaceState identity changed`)
        assert.equal(scenario.initial.categoryControlPresent, false, `${scenario.id}: Kick exposed Category control`)
        assert.equal(scenario.initial.categoryControlPublic, false, `${scenario.id}: Kick exposed public Category marker`)
        assert.equal(scenario.initial.categoryParam, null, `${scenario.id}: Kick emitted category URL state`)
      }"""
new = """      assert.equal(scenario.categoryRequests, 1, `${scenario.id}: provider category request missing`)
      assert.equal(scenario.initial.fetchSame, false, `${scenario.id}: authorized Day Flow fetch wrapper missing`)
      assert.equal(scenario.initial.replaceStateSame, false, `${scenario.id}: authorized Day Flow history wrapper missing`)
      assert.equal(scenario.initial.categoryControlPresent, true, `${scenario.id}: public Category control missing`)
      assert.equal(scenario.initial.categoryControlPublic, true, `${scenario.id}: Category control not marked public`)
      assert.equal(scenario.initial.categoryParam, 'all', `${scenario.id}: category URL state changed`)"""
s = must_replace(s, old, new, 'evidence provider block')
s = must_replace(
    s,
    "console.log('- Twitch Day Flow alone carries the authorized public category fetch/history wrapper')\nconsole.log('- Kick Day Flow and both Battle Lines routes retain native fetch/history identities')",
    "console.log('- Twitch and Kick Day Flow carry separately authorized provider-correct public category fetch/history wrappers')\nconsole.log('- both Battle Lines routes retain native fetch/history identities')",
    'evidence summary',
)
p.write_text(s)

print('patched U10G provider-separated public Day Flow boundary')
