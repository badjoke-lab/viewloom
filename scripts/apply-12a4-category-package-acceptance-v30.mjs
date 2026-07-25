import fs from 'node:fs'

const ACCEPTANCE_PR = 642
const RELEASE_PACKAGE_PR = 641
const RELEASE_PACKAGE_HEAD = '92df448997078fc9d33b962221a81611b1b1adb9'
const RELEASE_PACKAGE_MERGE = '7afb81bb9098104107860e9fe6c920c7380964ad'
const RELEASE_WORKFLOW_RUN = 30089007295
const RELEASE_VERIFY_JOB = 89467818501
const RELEASE_PREFLIGHT_JOB = 89467818503
const CONTROLS_PACKAGE_PR = 640
const CONTROLS_PACKAGE_HEAD = 'dd480ffd380c9928329a9d5db1c02f47e87f4fb8'
const CONTROLS_PACKAGE_MERGE = 'aecd4a10ca0da3146c23e5841412603e1e4416dd'
const CONTROLS_WORKFLOW_RUN = 30005758951
const CONTROLS_WORKFLOW_JOB = 89201237079

const read = (path) => fs.readFileSync(path, 'utf8')
const write = (path, content) => fs.writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`)
const json = (path) => JSON.parse(read(path))
const writeJson = (path, value) => write(path, JSON.stringify(value, null, 2))

function replaceOnce(source, before, after, label) {
  if (!source.includes(before)) throw new Error(`${label}: source fragment missing`)
  return source.replace(before, after)
}

function replaceAllRequired(source, before, after, expected, label) {
  const count = source.split(before).length - 1
  if (count !== expected) throw new Error(`${label}: expected ${expected} matches, found ${count}`)
  return source.split(before).join(after)
}

function addClosedBlocker(gate, value) {
  if (!gate.closedBlockers.includes(value)) gate.closedBlockers.push(value)
}

const gatePath = 'docs/audits/12a2-current-gate-state.json'
const gate = json(gatePath)
gate.schemaVersion = 'viewloom-12a2-current-gate-state-v30'
gate.status = '12a4_release_and_hidden_controls_packages_accepted'
gate.categoryCapture.kickReleasePackageAccepted = true
gate.categoryCapture.twitchHeatmapCategoryHiddenControlsAccepted = true
addClosedBlocker(gate, 'kick_permanent_category_capture_release_package_not_accepted')
addClosedBlocker(gate, 'twitch_heatmap_category_filter_hidden_controls_not_accepted')
gate.openBlockers = gate.openBlockers.filter((value) => ![
  'kick_permanent_category_capture_release_package_not_accepted',
  'twitch_heatmap_category_filter_hidden_controls_not_accepted',
].includes(value))
gate.currentWorkstream.name = 'Kick release and hidden Twitch controls accepted; exact Kick release and seven-day Twitch audit next'
gate.currentWorkstream.kickReleasePackageAccepted = true
gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted = true
gate.nextWorkstream = 'create a separate exact one-file Kick release trigger with the accepted PR #641 merge identity; independently run the Twitch seven-day accumulation audit at or after 2026-07-27T11:40:00Z before any public category-filter cutover'

const kickTrack = gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture
kickTrack.releasePackageAccepted = true
kickTrack.releasePackagePr = RELEASE_PACKAGE_PR
kickTrack.releasePackageMergeSha = RELEASE_PACKAGE_MERGE
kickTrack.releasePackageAcceptancePr = ACCEPTANCE_PR
const twitchTrack = gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter
twitchTrack.hiddenControlsAccepted = true
twitchTrack.hiddenControlsPr = CONTROLS_PACKAGE_PR
twitchTrack.hiddenControlsMergeSha = CONTROLS_PACKAGE_MERGE
twitchTrack.hiddenControlsAcceptancePr = ACCEPTANCE_PR

const packageAcceptance = gate.categoryParallelPackageAcceptance
packageAcceptance.kick.releasePackageAccepted = true
packageAcceptance.kick.releasePackagePr = RELEASE_PACKAGE_PR
packageAcceptance.kick.releasePackageMergeSha = RELEASE_PACKAGE_MERGE
packageAcceptance.twitchHiddenApi.hiddenControlsAccepted = true
packageAcceptance.twitchHiddenApi.hiddenControlsPr = CONTROLS_PACKAGE_PR
packageAcceptance.twitchHiddenApi.hiddenControlsMergeSha = CONTROLS_PACKAGE_MERGE
packageAcceptance.canonicalAcceptance = {
  status: 'accepted',
  acceptancePr: ACCEPTANCE_PR,
  productionMutationPerformed: false,
  publicTwitchExposureEnabled: false,
  kickReleasePackage: {
    packagePr: RELEASE_PACKAGE_PR,
    packageCandidateHeadSha: RELEASE_PACKAGE_HEAD,
    packageMergeSha: RELEASE_PACKAGE_MERGE,
    workflowRunId: RELEASE_WORKFLOW_RUN,
    verifyPackageJobId: RELEASE_VERIFY_JOB,
    inspectProductionJobId: RELEASE_PREFLIGHT_JOB,
    freshReadOnlyPreflightPass: true,
  },
  twitchHiddenControls: {
    packagePr: CONTROLS_PACKAGE_PR,
    packageCandidateHeadSha: CONTROLS_PACKAGE_HEAD,
    packageMergeSha: CONTROLS_PACKAGE_MERGE,
    workflowRunId: CONTROLS_WORKFLOW_RUN,
    workflowJobId: CONTROLS_WORKFLOW_JOB,
    publicExposureEnabled: false,
  },
}
writeJson(gatePath, gate)

const releasePath = 'docs/audits/12a4-kick-permanent-category-release-contract.json'
const release = json(releasePath)
release.status = 'accepted'
release.acceptedPackage.requiredGateSchemaVersion = gate.schemaVersion
release.acceptance = {
  pr: ACCEPTANCE_PR,
  mergeSha: RELEASE_PACKAGE_MERGE,
  packagePr: RELEASE_PACKAGE_PR,
  packageCandidateHeadSha: RELEASE_PACKAGE_HEAD,
  packageMergeSha: RELEASE_PACKAGE_MERGE,
  workflowRunId: RELEASE_WORKFLOW_RUN,
  verifyPackageJobId: RELEASE_VERIFY_JOB,
  inspectProductionJobId: RELEASE_PREFLIGHT_JOB,
  packageVerificationPass: true,
  freshReadOnlyPreflightPass: true,
  collectorHealthProxyPass: true,
  productionRuntimeCaptureStarted: false,
  productionWorkerPublished: false,
  remoteD1OperationPerformed: false,
  twitchChanged: false,
}
release.nextGate = 'create a separate exact one-file Kick release trigger using merge 7afb81bb9098104107860e9fe6c920c7380964ad and a start boundary no more than three hours ahead'
writeJson(releasePath, release)

const controlsPath = 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json'
const controls = json(controlsPath)
controls.status = 'accepted'
controls.acceptance = {
  canonicalAcceptancePr: ACCEPTANCE_PR,
  packagePr: CONTROLS_PACKAGE_PR,
  packageCandidateHeadSha: CONTROLS_PACKAGE_HEAD,
  packageMergeSha: CONTROLS_PACKAGE_MERGE,
  workflowRunId: CONTROLS_WORKFLOW_RUN,
  workflowJobId: CONTROLS_WORKFLOW_JOB,
  staticContractPass: true,
  categoryRolloutPolicyPass: true,
  webTypecheckPass: true,
  webBuildPass: true,
  productionHtmlControlAbsencePass: true,
  publicExposureEnabled: false,
  publicNavigationChanged: false,
  normalHeatmapControlChanged: false,
  collectorChanged: false,
  kickChanged: false,
}
controls.nextGate = 'run the seven-day Twitch accumulation audit at or after 2026-07-27T11:40:00.000Z while public exposure remains disabled; use a separate public cutover PR only after acceptance'
writeJson(controlsPath, controls)

write('docs/product/current-roadmap.md', `# ViewLoom current roadmap

Status: source of truth  
Last updated: 2026-07-25

## Current position

ViewLoom is a production Twitch/Kick observation site with provider-separated collectors, D1 storage, public data-status surfaces, Heatmap, Day Flow, Battle Lines, History & Trends, and channel pages.

## Current milestone: 12A — free-tier long-run hardening

### Completed

- Provider-separated Kick and Twitch bounded category canaries, rollback, final acceptance, and execution-path retirement.
- 12A-4-19 permanent rollout decision: Twitch first and provider separated.
- 12A-4-20 through 12A-4-23: Twitch permanent implementation, release, observation, and final acceptance.
- 12A-4-24A Kick permanent-category implementation package accepted in PR #637.
- 12A-5A hidden Twitch Heatmap category API package accepted in PR #638.
- Kick dormant release package accepted in PR #641 and frozen canonically in PR #642.
- Hidden Twitch Heatmap category controls accepted from PR #640 and frozen canonically in PR #642 without public exposure.

### Current gate: exact Kick release and Twitch seven-day audit

Twitch permanent category capture remains active and accepted on the existing five-minute collector. The hidden category controls are complete and accepted, but remain available only through the non-public exact query \`categoryPreview=1\`.

The Kick permanent implementation and dormant release package are accepted. Kick runtime remains inactive until a separate exact one-file trigger is merged with the accepted PR #641 merge identity and a bounded start time.

The earliest Twitch seven-day audit boundary is \`2026-07-27T11:40:00Z\` / 2026-07-27 20:40 JST.

### Active deliverables

#### Track A — Kick

1. Create a separate exact one-file trigger using accepted release-package merge \`${RELEASE_PACKAGE_MERGE}\` and a start time no more than three hours ahead.
2. Run a fresh read-only production preflight immediately before publish.
3. Publish only the accepted Kick permanent config.
4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
5. Observe for at least 24 hours, extending to 48 hours on warning.
6. Final acceptance or verified rollback and temporary-path retirement.

#### Track B — Twitch hidden filter

1. Keep the accepted hidden controls non-public and preserve the existing unfiltered Heatmap fallback.
2. At or after 2026-07-27 20:40 JST, run the seven-day accumulation audit.
3. Verify category continuity, dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, bounded growth, and storage headroom.
4. Create a separate public cutover PR only if the audit passes.
5. Keep Kick category UI absent and preserve provider-specific options, URL state, and results.

### Following gates

1. Kick exact release, initial verification, observation, and acceptance or rollback.
2. 12A-5B Twitch seven-day accumulation audit at or after 2026-07-27 20:40 JST.
3. 12A-5C public Twitch Heatmap category-filter cutover.
4. Kick category UI only after separate Kick acceptance and Kick stable accumulation evidence.
5. Provider-specific Day Flow category views, then category history.

## Hard boundaries

- Twitch and Kick remain separate data products, databases, collectors, options, URL state, and results.
- Cross-provider category identity, mapping, totals, and combined rankings are not allowed.
- Existing Worker cadence remains \`*/5 * * * *\` for both providers.
- No new Worker cron is authorized.
- No backfill or retention expansion is authorized.
- Kick rollout must not mutate Twitch.
- Accepted hidden Twitch controls must not become public before the seven-day audit and separate cutover acceptance.
- Twitch accumulation evidence must not be reused as Kick UI evidence.
- Existing unfiltered Heatmap remains the fallback until public cutover acceptance.

## Source of truth

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a4-kick-permanent-category-decision-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-capture-package-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-release-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json\`
- \`docs/audits/12a4-twitch-permanent-category-final-acceptance.json\`
- \`docs/work-in-progress/phase12a4-category-parallel-execution.md\`
`)

write('docs/product/current-schedule.md', `# ViewLoom current execution schedule

Status: source of truth  
Last updated: 2026-07-25

\`\`\`text
Phase 12A Analytics Capture Foundation active
Canonical target 12A-4-24 exact Kick release and Twitch seven-day audit
Twitch permanent category capture accepted and active yes
Kick permanent implementation package accepted yes
Kick permanent release package accepted yes
Kick permanent runtime active no
Twitch Heatmap hidden category API package accepted yes
Twitch Heatmap hidden control package accepted yes
Twitch Heatmap public category-filter exposure authorized no
Twitch seven-day audit earliest 2026-07-27T11:40:00Z
Existing Twitch Worker cadence */5 * * * * unchanged
Existing Kick Worker cadence */5 * * * * unchanged
New Worker cron no
Backfill no
Retention expansion no
Cross-provider category identity or ranking no
\`\`\`

## Active parallel sequence

The two tracks proceed in parallel. Every PR must identify its track and cite the current specification, plan, roadmap, schedule, canonical gate, active WIP, relevant decision/package contracts, and development policy.

## Track A — Kick permanent category capture

Completed:

1. 12A-4-24 documentation, decision contracts, canonical authorization, and policy synchronization merged in PR #636.
2. Kick permanent configuration and normal rollback configuration added and accepted through PR #637 and PR #639.
3. Dormant release package merged in PR #641.
4. Release fixtures, package verification, collector typecheck, normal/permanent dry-run, and fresh read-only production preflight passed.
5. Release package canonical acceptance frozen in PR #642 without production publish or remote D1 mutation.

Next:

1. Create an exact one-file trigger on main using accepted release merge \`${RELEASE_PACKAGE_MERGE}\` and a start boundary no more than three hours ahead.
2. Re-run the fresh read-only Kick production preflight immediately before deployment.
3. Publish only \`workers/collector-kick/wrangler.category-permanent.toml\`.
4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
5. Observe for at least 24 hours.
6. Extend to 48 hours on warning; restore normal Kick configuration immediately on a hard stop.
7. Freeze final evidence, accept or roll back Kick, and retire all temporary paths.

## Track B — hidden Twitch Heatmap category filter

Completed:

1. Twitch Heatmap API category contract accepted through PR #638 and PR #639.
2. Hidden Twitch-only controls, \`All categories\` default, Top 20/50/100, URL restoration, truthful states, mobile layout, focus-visible behavior, and aria-live status added in PR #640.
3. Production HTML still exposes no category control and public navigation remains unchanged.
4. Complete hidden control package accepted canonically in PR #642.

Next:

1. Keep the hidden controls non-public and preserve the existing unfiltered Heatmap fallback.
2. At or after \`2026-07-27T11:40:00Z\`, run the seven-day accumulation audit.
3. Verify collector errors, provider leakage, freshness, real/non-empty state, category and dictionary continuity, bounded growth, and storage headroom.
4. Authorize a separate public cutover PR only if every audit gate passes.
5. Otherwise keep the feature hidden and record the failed or extended gate.

## Twitch seven-day accumulation gate

At or after \`2026-07-27T11:40:00Z\` / 2026-07-27 20:40 JST:

1. run a read-only audit of Twitch category-bearing snapshot continuity since \`2026-07-20T11:40:00Z\`;
2. verify collector errors, provider leakage, freshness, real/non-empty state, dictionary continuity, bounded growth, and storage headroom;
3. verify complete hidden implementation acceptance and public exposure still disabled during the audit;
4. authorize a separate public cutover PR only if every gate passes;
5. otherwise keep the feature hidden and record the failed or extended gate.

The seven-day boundary blocks public exposure only. It does not block Kick rollout work.

## Public Twitch cutover

A separate PR must explicitly:

- enable the normal Twitch Heatmap category control;
- expose no Kick category UI;
- retain \`All categories\` and the unfiltered fallback;
- pass production browser, mobile, accessibility, and data-truth checks;
- record exact build and deployment identities.

## Hard stops

### Kick

- permanent Kick flag absent after release or obsolete canary bindings present;
- provider leakage greater than zero;
- projected Kick 90-day size greater than 440 MB or provider headroom below 10 MB;
- projected account-wide D1 headroom below 500 MB;
- latest Kick collection stale, non-real, or empty for two consecutive expected cycles;
- category payload absent for three consecutive otherwise successful snapshots;
- repeated collector or D1 failures;
- any unexpected Twitch configuration, binding, row, API, or runtime change.

### Hidden Twitch filter

- public nav or normal-route exposure before authorization;
- collector, cron, retention, backfill, Kick, or cross-provider mutation;
- category selection applied after Top N instead of before Top N;
- provider category identity or URL state shared across Twitch and Kick;
- demo, empty, partial, stale, unknown, or unavailable states collapsed into false real data.

## Mandatory references

Every category PR must read and cite:

1. \`docs/product/category-capture-permanent-rollout-spec.md\`;
2. \`docs/product/category-capture-permanent-rollout-plan.md\`;
3. \`docs/product/current-roadmap.md\`;
4. this schedule;
5. \`docs/audits/12a2-current-gate-state.json\`;
6. \`docs/work-in-progress/phase12a4-category-parallel-execution.md\`;
7. the relevant decision and package contracts;
8. \`docs/operations/development-and-deployment-policy.md\`.
`)

write('docs/work-in-progress/phase12a4-category-parallel-execution.md', `# 12A-4-24 category parallel execution

## Status

Twitch permanent category capture is accepted and active. Both next-stage packages are now accepted canonically in PR #642:

- Track A: Kick dormant permanent-category release package from PR #641 is accepted; the separate exact one-file release trigger is next under Issue #634.
- Track B: hidden Twitch Heatmap category controls from PR #640 are accepted; the seven-day accumulation audit is next under Issue #635.

Public Twitch category-filter exposure remains unauthorized until the seven-day Twitch accumulation audit and a separate public cutover PR.

## Accepted Twitch baseline

- Production start: \`2026-07-20T11:40:00.000Z\`.
- Final acceptance PR: #633.
- Final observation run: 29827696569.
- Final observation job: 88624752189.
- Final artifact: 8493912964.
- Observed category snapshots: 291.
- Expected category snapshots: 290.
- Coverage ratio: 1.0.
- Collector errors: 0.
- Provider leakage: 0.
- Projected 90-day size: 378.59 MB.
- Provider headroom: 71.41 MB.
- Account-wide headroom: 626.08 MB.

## Track A — Kick permanent capture

### Accepted implementation and release packages

- Implementation package PR: #637.
- Implementation merge SHA: \`b4012ebddb9ec33c50b6298c882f0f1a4ee16be0\`.
- Dormant release package PR: #641.
- Dormant release merge SHA: \`${RELEASE_PACKAGE_MERGE}\`.
- Release validation run: ${RELEASE_WORKFLOW_RUN}.
- Release verify job: ${RELEASE_VERIFY_JOB}.
- Fresh production preflight job: ${RELEASE_PREFLIGHT_JOB}.
- Permanent config: \`workers/collector-kick/wrangler.category-permanent.toml\`.
- Normal rollback config: \`workers/collector-kick/wrangler.toml\`.
- Fresh read-only preflight: passed.
- Production publish from package or acceptance PR: no.
- Remote D1 mutation from package or acceptance PR: no.
- Kick production runtime active: no.
- Twitch changed: no.

### Immediate work order

1. Create a separate exact one-file trigger using accepted merge \`${RELEASE_PACKAGE_MERGE}\` and a start time no more than three hours ahead.
2. Re-run the fresh read-only preflight immediately before publish.
3. Publish only the accepted Kick permanent config.
4. Verify two consecutive real, non-empty, fresh, category-bearing Kick snapshots.
5. Observe for at least 24 hours, extend to 48 hours on warning, or roll back on a hard stop.
6. Freeze final evidence and retire temporary paths.

### Hard boundary

No Twitch configuration, binding, row, API, runtime, or public UI change is permitted from the Kick track.

## Track B — hidden Twitch Heatmap filter

### Accepted API and hidden control packages

- Hidden API package PR: #638.
- Hidden API merge SHA: \`5b466e3e440324bbd6b19d60aa3acaed0d1d95e8\`.
- Hidden controls package PR: #640.
- Hidden controls merge SHA: \`${CONTROLS_PACKAGE_MERGE}\`.
- Hidden controls validation run: ${CONTROLS_WORKFLOW_RUN}.
- Hidden controls validation job: ${CONTROLS_WORKFLOW_JOB}.
- \`categoryPreview=1\` exact Twitch-only entry retained.
- \`All categories\` default and Top 20/50/100 implemented.
- Category filtering occurs before Top N.
- URL restoration, truthful states, mobile behavior, focus-visible behavior, and aria-live status accepted.
- Public category control or navigation added: no.
- Collector or Kick change: no.

### Immediate work order

1. Keep the accepted controls hidden and preserve the unfiltered fallback.
2. Run the seven-day accumulation audit at or after \`2026-07-27T11:40:00.000Z\` / 2026-07-27 20:40 JST.
3. Verify seven stable Twitch days, category and dictionary continuity, collector errors, provider leakage, freshness, real/non-empty state, bounded growth, and storage headroom.
4. Use a separate public cutover PR only after the audit passes.

### Public gate

The audit must pass while public exposure remains disabled. Twitch evidence cannot authorize Kick category UI.

## Shared boundaries

- Existing Twitch and Kick Worker cadence remains \`*/5 * * * *\`.
- No new Worker cron.
- No backfill.
- No retention expansion.
- No cross-provider category identity, mapping, totals, or rankings.
- Provider data, route state, options, and results remain separate.
- Every PR must cite the current specification, plan, roadmap, schedule, canonical gate, this WIP, relevant decision and package contracts, and development policy.

## Mandatory source documents

- \`docs/product/category-capture-permanent-rollout-spec.md\`
- \`docs/product/category-capture-permanent-rollout-plan.md\`
- \`docs/product/current-roadmap.md\`
- \`docs/product/current-schedule.md\`
- \`docs/audits/12a2-current-gate-state.json\`
- \`docs/audits/12a4-kick-permanent-category-decision-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-capture-package-contract.json\`
- \`docs/audits/12a4-kick-permanent-category-release-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json\`
- \`docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json\`
- \`docs/audits/12a4-twitch-permanent-category-final-acceptance.json\`
- \`docs/operations/development-and-deployment-policy.md\`
`)

let policy = read('scripts/verify-category-rollout-policy.mjs')
policy = replaceOnce(policy,
  "  kickPackage: 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json',\n",
  "  kickPackage: 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json',\n  kickRelease: 'docs/audits/12a4-kick-permanent-category-release-contract.json',\n",
  'policy file map kick release')
policy = replaceOnce(policy,
  "  hiddenTwitchPackage: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',\n",
  "  hiddenTwitchPackage: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',\n  hiddenTwitchControls: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',\n",
  'policy file map hidden controls')
policy = replaceOnce(policy,
  'const kickPackage = json(files.kickPackage)\n',
  'const kickPackage = json(files.kickPackage)\nconst kickRelease = json(files.kickRelease)\n',
  'policy parse kick release')
policy = replaceOnce(policy,
  'const hiddenTwitchPackage = json(files.hiddenTwitchPackage)\n',
  'const hiddenTwitchPackage = json(files.hiddenTwitchPackage)\nconst hiddenTwitchControls = json(files.hiddenTwitchControls)\n',
  'policy parse hidden controls')
policy = replaceOnce(policy,
  "  'Prepare and accept a dormant release package',\n  'Implement hidden or feature-flagged category controls',\n",
  "  'Kick dormant release package accepted in PR #641',\n  'Hidden Twitch Heatmap category controls accepted from PR #640',\n",
  'policy roadmap fragments')
policy = replaceOnce(policy,
  "  'Kick permanent release package accepted no',\n",
  "  'Kick permanent release package accepted yes',\n",
  'policy schedule kick release')
policy = replaceOnce(policy,
  "  'Twitch Heatmap hidden control package accepted no',\n",
  "  'Twitch Heatmap hidden control package accepted yes',\n",
  'policy schedule hidden controls')
policy = replaceOnce(policy,
  "  'Implementation package PR: #637.',\n  'Hidden API package PR: #638.',\n",
  "  'Dormant release package PR: #641.',\n  'Hidden controls package PR: #640.',\n",
  'policy WIP fragments')
policy = replaceOnce(policy, "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')", 'policy gate schema')
policy = replaceOnce(policy, "assert.equal(gate.status, '12a4_parallel_implementation_packages_accepted')", "assert.equal(gate.status, '12a4_release_and_hidden_controls_packages_accepted')", 'policy gate status')
policy = replaceOnce(policy, 'assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, false)', 'assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, true)', 'policy kick release gate')
policy = replaceOnce(policy, 'assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, false)', 'assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, true)', 'policy hidden control gate')
policy = replaceOnce(policy, 'assert.equal(gate.categoryCapture.twitchHeatmapCategoryHiddenControlsAccepted, false)', 'assert.equal(gate.categoryCapture.twitchHeatmapCategoryHiddenControlsAccepted, true)\nassert.equal(gate.categoryCapture.kickReleasePackageAccepted, true)', 'policy category capture package gates')
policy = replaceOnce(policy,
  "assert.deepEqual(gate.openBlockers, [\n  'kick_permanent_category_capture_release_package_not_accepted',\n  'kick_permanent_category_capture_not_deployed',\n  'kick_permanent_category_capture_observation_not_accepted',\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_hidden_controls_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])",
  "assert.ok(gate.closedBlockers.includes('kick_permanent_category_capture_release_package_not_accepted'))\nassert.ok(gate.closedBlockers.includes('twitch_heatmap_category_filter_hidden_controls_not_accepted'))\nassert.deepEqual(gate.openBlockers, [\n  'kick_permanent_category_capture_not_deployed',\n  'kick_permanent_category_capture_observation_not_accepted',\n  'twitch_category_ui_seven_day_accumulation_not_accepted',\n  'twitch_heatmap_category_filter_public_exposure_not_authorized',\n])",
  'policy blockers')
policy = replaceOnce(policy, 'assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, false)', "assert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.runtimeActive, false)\nassert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.releasePackageAccepted, true)\nassert.equal(gate.categoryParallelExecutionDecision.tracks.kickPermanentCapture.releasePackagePr, 641)", 'policy decision kick release')
policy = replaceOnce(policy, 'assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenControlsAccepted, false)', 'assert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenControlsAccepted, true)\nassert.equal(gate.categoryParallelExecutionDecision.tracks.twitchHeatmapCategoryFilter.hiddenControlsPr, 640)', 'policy decision hidden controls')
policy = replaceOnce(policy, 'assert.equal(gate.categoryParallelPackageAcceptance.kick.runtimeActive, false)', 'assert.equal(gate.categoryParallelPackageAcceptance.kick.runtimeActive, false)\nassert.equal(gate.categoryParallelPackageAcceptance.kick.releasePackageAccepted, true)\nassert.equal(gate.categoryParallelPackageAcceptance.kick.releasePackagePr, 641)', 'policy package acceptance kick')
policy = replaceOnce(policy, 'assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.hiddenControlsAccepted, false)', 'assert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.hiddenControlsAccepted, true)\nassert.equal(gate.categoryParallelPackageAcceptance.twitchHiddenApi.hiddenControlsPr, 640)\nassert.equal(gate.categoryParallelPackageAcceptance.canonicalAcceptance.acceptancePr, 642)', 'policy package acceptance controls')
policy = replaceOnce(policy,
  "assert.equal(hiddenTwitchPackage.acceptance.kickChanged, false)\n",
  "assert.equal(hiddenTwitchPackage.acceptance.kickChanged, false)\n\nassert.equal(kickRelease.status, 'accepted')\nassert.equal(kickRelease.acceptance.pr, 642)\nassert.equal(kickRelease.acceptance.mergeSha, '${RELEASE_PACKAGE_MERGE}')\nassert.equal(kickRelease.acceptance.freshReadOnlyPreflightPass, true)\nassert.equal(kickRelease.acceptance.productionWorkerPublished, false)\nassert.equal(hiddenTwitchControls.status, 'accepted')\nassert.equal(hiddenTwitchControls.acceptance.canonicalAcceptancePr, 642)\nassert.equal(hiddenTwitchControls.acceptance.packagePr, 640)\nassert.equal(hiddenTwitchControls.acceptance.packageMergeSha, '${CONTROLS_PACKAGE_MERGE}')\nassert.equal(hiddenTwitchControls.acceptance.publicExposureEnabled, false)\n",
  'policy accepted package assertions')
policy = replaceOnce(policy,
  'for (const path of [files.kickDecision, files.kickPackage, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.activeWip]) {',
  'for (const path of [files.kickDecision, files.kickPackage, files.kickRelease, files.hiddenTwitchDecision, files.hiddenTwitchPackage, files.hiddenTwitchControls, files.activeWip]) {',
  'policy workflow paths')
policy = replaceOnce(policy, '  twitchHiddenControlsAccepted: false,', '  twitchHiddenControlsAccepted: true,\n  kickReleasePackageAccepted: true,', 'policy output package gates')
policy = replaceOnce(policy, "  nextAction: 'kick-release-preflight-and-hidden-twitch-controls',", "  nextAction: 'kick-exact-release-and-twitch-seven-day-audit',", 'policy output next action')
write('scripts/verify-category-rollout-policy.mjs', policy)

let kickVerifier = read('scripts/verify-12a4-kick-permanent-category-package.mjs')
kickVerifier = replaceOnce(kickVerifier, "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')", 'kick package verifier gate')
kickVerifier = replaceOnce(kickVerifier, "nextAction: contract.status === 'accepted' ? 'prepare-release-package-and-fresh-preflight'", "nextAction: contract.status === 'accepted' ? 'release-package-accepted-await-exact-trigger'", 'kick package verifier next action')
write('scripts/verify-12a4-kick-permanent-category-package.mjs', kickVerifier)

let apiVerifier = read('scripts/verify-12a5-twitch-heatmap-category-api-package.mjs')
apiVerifier = replaceOnce(apiVerifier, "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')", 'hidden API verifier gate')
apiVerifier = replaceOnce(apiVerifier, "nextAction: contract.status === 'accepted' ? 'implement-hidden-controls'", "nextAction: contract.status === 'accepted' ? 'hidden-controls-accepted-await-seven-day-audit'", 'hidden API verifier next action')
write('scripts/verify-12a5-twitch-heatmap-category-api-package.mjs', apiVerifier)

let releaseVerifier = read('scripts/verify-12a4-kick-permanent-category-release-package.mjs')
releaseVerifier = replaceOnce(releaseVerifier, "assert.equal(contract.status, 'prepared')", "assert.equal(contract.status, 'accepted')", 'release verifier status')
releaseVerifier = replaceOnce(releaseVerifier, "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')\nassert.equal(contract.acceptedPackage.requiredGateSchemaVersion, gate.schemaVersion)", 'release verifier gate')
releaseVerifier = replaceOnce(releaseVerifier, 'assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, false)', 'assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, true)', 'release verifier accepted gate')
releaseVerifier = replaceOnce(releaseVerifier,
  'assert.equal(contract.acceptance, null)',
  `assert.equal(contract.acceptance.pr, 642)\nassert.equal(contract.acceptance.mergeSha, '${RELEASE_PACKAGE_MERGE}')\nassert.equal(contract.acceptance.packagePr, 641)\nassert.equal(contract.acceptance.workflowRunId, ${RELEASE_WORKFLOW_RUN})\nassert.equal(contract.acceptance.verifyPackageJobId, ${RELEASE_VERIFY_JOB})\nassert.equal(contract.acceptance.inspectProductionJobId, ${RELEASE_PREFLIGHT_JOB})\nassert.equal(contract.acceptance.packageVerificationPass, true)\nassert.equal(contract.acceptance.freshReadOnlyPreflightPass, true)\nassert.equal(contract.acceptance.collectorHealthProxyPass, true)\nassert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)\nassert.equal(contract.acceptance.productionWorkerPublished, false)\nassert.equal(contract.acceptance.remoteD1OperationPerformed, false)\nassert.equal(contract.acceptance.twitchChanged, false)`,
  'release verifier acceptance')
releaseVerifier = replaceOnce(releaseVerifier, "requireText(wip, 'Prepare a dormant Kick release package', 'active WIP')\nrequireText(wip, 'Run a fresh read-only Kick production preflight', 'active WIP')\nrequireText(roadmap, 'Prepare and accept a dormant release package', 'roadmap')\nrequireText(schedule, 'Kick permanent release package accepted no', 'schedule')\nrequireText(schedule, 'Create an exact one-file trigger on main only after the fresh preflight passes', 'schedule')", "requireText(wip, 'Dormant release package PR: #641.', 'active WIP')\nrequireText(wip, 'Create a separate exact one-file trigger', 'active WIP')\nrequireText(roadmap, 'Kick dormant release package accepted in PR #641', 'roadmap')\nrequireText(schedule, 'Kick permanent release package accepted yes', 'schedule')\nrequireText(schedule, 'Create an exact one-file trigger on main using accepted release merge', 'schedule')", 'release verifier docs')
write('scripts/verify-12a4-kick-permanent-category-release-package.mjs', releaseVerifier)

let controlsVerifier = read('scripts/verify-12a5-twitch-heatmap-category-controls-package.mjs')
controlsVerifier = replaceOnce(controlsVerifier, "assert.equal(contract.status, 'candidate')", "assert.equal(contract.status, 'accepted')", 'controls verifier status')
controlsVerifier = replaceOnce(controlsVerifier, 'assert.equal(gate.schemaVersion, contract.acceptedInputs.requiredGateSchemaVersion)', "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v30')", 'controls verifier gate')
controlsVerifier = replaceOnce(controlsVerifier, 'assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, false)', 'assert.equal(gate.currentWorkstream.twitchHeatmapCategoryHiddenControlsAccepted, true)', 'controls verifier accepted gate')
controlsVerifier = replaceOnce(controlsVerifier,
  'assert.equal(apiPackage.acceptance.packageMergeSha, contract.acceptedInputs.apiPackageMergeSha)\n',
  `assert.equal(apiPackage.acceptance.packageMergeSha, contract.acceptedInputs.apiPackageMergeSha)\nassert.equal(contract.acceptance.canonicalAcceptancePr, 642)\nassert.equal(contract.acceptance.packagePr, 640)\nassert.equal(contract.acceptance.packageCandidateHeadSha, '${CONTROLS_PACKAGE_HEAD}')\nassert.equal(contract.acceptance.packageMergeSha, '${CONTROLS_PACKAGE_MERGE}')\nassert.equal(contract.acceptance.workflowRunId, ${CONTROLS_WORKFLOW_RUN})\nassert.equal(contract.acceptance.workflowJobId, ${CONTROLS_WORKFLOW_JOB})\nassert.equal(contract.acceptance.publicExposureEnabled, false)\nassert.equal(contract.acceptance.collectorChanged, false)\nassert.equal(contract.acceptance.kickChanged, false)\n`,
  'controls verifier acceptance')
controlsVerifier = replaceOnce(controlsVerifier, "  nextAction: 'accept-hidden-controls-before-seven-day-audit',", "  nextAction: 'run-seven-day-audit-before-public-cutover',", 'controls verifier next action')
write('scripts/verify-12a5-twitch-heatmap-category-controls-package.mjs', controlsVerifier)

let workflow = read('.github/workflows/category-rollout-policy.yml')
workflow = replaceAllRequired(workflow,
  "      - 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json'\n",
  "      - 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json'\n      - 'docs/audits/12a4-kick-permanent-category-release-contract.json'\n",
  2,
  'policy workflow Kick release path')
workflow = replaceAllRequired(workflow,
  "      - 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json'\n",
  "      - 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json'\n      - 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json'\n",
  2,
  'policy workflow controls path')
write('.github/workflows/category-rollout-policy.yml', workflow)

console.log(JSON.stringify({
  ok: true,
  gate: gate.schemaVersion,
  acceptancePr: ACCEPTANCE_PR,
  kickReleasePackageAccepted: true,
  hiddenTwitchControlsAccepted: true,
  kickRuntimeActive: false,
  publicTwitchExposureAuthorized: false,
}, null, 2))
