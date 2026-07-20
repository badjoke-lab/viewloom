import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const write = (file, value) => fs.writeFileSync(file, value.endsWith('\n') ? value : `${value}\n`)
const replace = (source, before, after, label) => {
  assert.ok(source.includes(before), `${label}: missing source fragment`)
  return source.replace(before, after)
}

const specPath = 'docs/product/category-capture-permanent-rollout-spec.md'
const planPath = 'docs/product/category-capture-permanent-rollout-plan.md'
const wipPath = 'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md'

let spec = read(specPath)
spec = spec.replace('Decision PR: pending', 'Decision PR: #624')
write(specPath, spec)

let policy = read('docs/operations/development-and-deployment-policy.md')
if (!policy.includes('## 2.1 Feature-specific source-of-truth requirement')) {
  policy = replace(
    policy,
    'When duplicated wording conflicts, this document wins.\n',
    `When duplicated wording conflicts, this document wins.\n\n## 2.1 Feature-specific source-of-truth requirement\n\nBefore starting category capture work, every human contributor, AI agent, script, and automation must read the current category specification, rollout plan, roadmap, schedule, canonical gate, and active WIP file listed in \`docs/README.md\`.\n\nEach category pull request must state which canonical phase it satisfies and cite those current documents. Historical canary contracts and evidence may support a decision, but they do not grant current runtime authorization.\n\nA category change must not widen provider scope beyond the canonical gate. Twitch authorization never implicitly authorizes Kick. Implementation, deployment, observation, acceptance, rollback, and UI phases remain separate unless the current rollout plan explicitly states otherwise.\n`,
    'policy source hierarchy',
  )
}
write('docs/operations/development-and-deployment-policy.md', policy)

let workflow = read('.github/workflows/development-policy.yml')
if (!workflow.includes("      - 'workers/collector-twitch/**'")) {
  workflow = workflow.replaceAll(
    "      - 'docs/**'\n",
    "      - 'docs/**'\n      - 'workers/collector-twitch/**'\n      - 'workers/collector-kick/**'\n      - 'db/d1/**'\n",
  )
}
write('.github/workflows/development-policy.yml', workflow)

let verifier = read('scripts/verify-development-policy.mjs')
verifier = replace(
  verifier,
  "  'docs/product/current-schedule.md',\n",
  `  'docs/product/current-schedule.md',\n  '${specPath}',\n  '${planPath}',\n  '${wipPath}',\n`,
  'required category sources',
)
verifier = replace(
  verifier,
  "  'production deployment deliberate and observable',\n",
  "  'production deployment deliberate and observable',\n  'Feature-specific source-of-truth requirement',\n  'Twitch authorization never implicitly authorizes Kick',\n",
  'policy fragments',
)
verifier = replace(
  verifier,
  `for (const fragment of [\n  'canonical gate 12A-4-18 provider canaries accepted and retired',\n  'Twitch category payload after expiry grace: 0 rows',\n  'Twitch bounded category capture active no',\n  'permanent runtime category capture authorized no',\n]) assert.ok(docsIndex.includes(fragment), \`docs index missing: \${fragment}\`)`,
  `for (const fragment of [\n  'canonical gate 12A-4-19 Twitch permanent capture authorized; implementation pending',\n  'Twitch permanent implementation authorized yes',\n  'Twitch permanent category capture active no',\n  'Kick permanent implementation authorized no',\n  'new Worker cron authorized no',\n  'category UI authorized no',\n]) assert.ok(docsIndex.includes(fragment), \`docs index missing: \${fragment}\`)`,
  'docs index fragments',
)
verifier = verifier.replace("assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v22')", "assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v23')")
verifier = verifier.replace("assert.equal(gate.status, '12a4_provider_canaries_accepted_and_retired')", "assert.equal(gate.status, '12a4_twitch_permanent_category_capture_authorized_pending_implementation')")
verifier = verifier.replace("assert.equal(gate.currentWorkstream.phase, '12A-4-18')", "assert.equal(gate.currentWorkstream.phase, '12A-4-19')")
verifier = verifier.replace("assert.equal(gate.currentWorkstream.name, 'Provider-separated category canaries accepted and retired')", "assert.equal(gate.currentWorkstream.name, 'Twitch permanent category capture authorized; implementation pending')")
verifier = verifier.replace('assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)', 'assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, true)')
verifier = verifier.replace(
  "assert.deepEqual(gate.openBlockers, ['runtime_category_capture_not_authorized'])",
  `assert.deepEqual(gate.openBlockers, [\n  'twitch_permanent_category_capture_not_implemented',\n  'twitch_permanent_category_capture_not_deployed',\n  'twitch_permanent_category_capture_observation_not_accepted',\n  'kick_permanent_category_capture_not_authorized',\n])\nassert.ok(gate.closedBlockers.includes('runtime_category_capture_not_authorized'))`,
)
verifier = verifier.replace('assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)', 'assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, true)')

const anchor = "assert.equal(gate.currentWorkstream.crossProviderAnalyticsAllowed, false)\n"
const rolloutChecks = `\nconst rollout = gate.permanentCategoryCaptureRolloutDecision\nassert.equal(rollout.status, 'accepted')\nassert.equal(rollout.trackingIssue, 623)\nassert.equal(rollout.decisionPr, 624)\nassert.equal(rollout.specification, '${specPath}')\nassert.equal(rollout.implementationPlan, '${planPath}')\nassert.equal(rollout.activeWip, '${wipPath}')\nassert.equal(rollout.authorizationScope, 'twitch_only')\nassert.equal(rollout.twitchPermanentCaptureAuthorized, true)\nassert.equal(rollout.twitchRuntimeCaptureActive, false)\nassert.equal(rollout.kickPermanentCaptureAuthorized, false)\nassert.equal(rollout.kickAutomaticStartAuthorized, false)\nassert.equal(rollout.existingCollectorCronRequired, '*/5 * * * *')\nassert.equal(rollout.newWorkerCronAuthorized, false)\nassert.equal(rollout.backfillAuthorized, false)\nassert.equal(rollout.retentionExpansionAuthorized, false)\nassert.equal(rollout.categoryUiAuthorized, false)\nassert.equal(rollout.crossProviderIdentityAllowed, false)\nassert.equal(rollout.combinedProviderRankingAllowed, false)\nassert.equal(rollout.freshReadOnlyPreflightRequired, true)\nassert.equal(rollout.twitchMinimumObservationHours, 24)\nassert.equal(rollout.twitchWarningObservationHours, 48)\nassert.equal(rollout.stableAccumulationDaysBeforeUi, 7)\nassert.equal(rollout.rollbackRequiredOnHardStop, true)\nassert.equal(gate.categoryCapture.authorizationScope, 'twitch_only')\nassert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureAuthorized, true)\nassert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)\nassert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, false)\nassert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, false)\nassert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)\nassert.equal(gate.categoryCapture.categoryUiAuthorized, false)\nassert.equal(gate.currentWorkstream.decisionPr, 624)\nassert.equal(gate.currentWorkstream.implementationSpecAccepted, true)\nassert.equal(gate.currentWorkstream.implementationPlanAccepted, true)\nassert.equal(gate.currentWorkstream.authorizationScope, 'twitch_only')\nassert.equal(gate.currentWorkstream.twitchPermanentCaptureAuthorized, true)\nassert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)\nassert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)\nassert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)\nassert.equal(gate.currentWorkstream.categoryUiAuthorized, false)\n`
verifier = replace(verifier, anchor, `${anchor}${rolloutChecks}`, 'rollout assertions')
verifier = verifier.replace('  permanentRuntimeCaptureAuthorized: false,', '  permanentRuntimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,')
write('scripts/verify-development-policy.mjs', verifier)

console.log(JSON.stringify({ ok: true, phase: '12A-4-19', decisionPr: 624 }, null, 2))
