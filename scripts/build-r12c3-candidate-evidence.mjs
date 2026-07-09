import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const browserPath = process.argv[2] || '/tmp/public-current-browser-audit/evidence.json'
const outputPath = process.argv[3] || 'artifacts/r12c3-candidate/evidence.json'
const browser = JSON.parse(readFileSync(browserPath, 'utf8'))
const manifest = JSON.parse(readFileSync('docs/audits/r12c2-launch-asset-manifest.json', 'utf8'))
const inventory = JSON.parse(readFileSync('docs/audits/public-surface-inventory.json', 'utf8'))

if (browser.result !== 'pass' || browser.counts?.scenarios !== 100 || browser.counts?.violations !== 0) {
  throw new Error('current browser evidence is not a passing 100-scenario matrix')
}
if (manifest.packageVerification?.result !== 'pass' || manifest.assetCount !== 6) {
  throw new Error('R12C-2 launch asset package is not verified')
}

const evidence = {
  schema: 'viewloom-r12c3-candidate-acceptance-v1',
  phase: 'Phase 12',
  workstream: 'R12C-3',
  status: 'candidate_pass',
  candidateHeadSha: process.env.R12C3_HEAD_SHA || process.env.GITHUB_SHA || null,
  workflowRunId: process.env.GITHUB_RUN_ID || null,
  checkedAt: new Date().toISOString(),
  completedChecks: [
    'development policy',
    'R12C-3 candidate contract',
    'R12C-0 message inventory',
    'R12C-1 launch copy package',
    'R12C-2 launch asset package',
    'full web typecheck',
    'production build',
    'content QA',
    'SEO QA',
    'public-surface inventory',
    'current public-state handoff',
    'public readiness audit',
    '100-scenario public browser matrix',
  ],
  publicSurface: {
    htmlRoutes: inventory.counts.vite_html_inputs,
    inventoryEntries: inventory.counts.inventory_entries,
    publicReadinessPages: inventory.counts.public_readiness_configured_pages,
    productionSmokeRoutes: inventory.counts.production_smoke_page_routes,
  },
  browser: {
    routes: browser.counts.routes,
    viewports: browser.counts.viewports,
    scenarios: browser.counts.scenarios,
    violations: browser.counts.violations,
    providerCrossingScenarios: browser.counts.providerCrossingScenarios,
    providerNeutralApiRequestScenarios: browser.counts.providerNeutralApiRequestScenarios,
    overflowScenarios: browser.counts.overflowScenarios,
    focusFailures: browser.counts.focusFailures,
    unlabeledControlScenarios: browser.counts.unlabeledControlScenarios,
    legalMobileTargetFailures: browser.counts.legalMobileTargetFailures,
  },
  providerSeparation: {
    twitchBinding: inventory.provider_invariants.twitch_binding,
    kickBinding: inventory.provider_invariants.kick_binding,
    combinedTotalsAllowed: inventory.provider_invariants.combined_totals_allowed,
    combinedRankingsAllowed: inventory.provider_invariants.combined_rankings_allowed,
  },
  launchAssets: {
    count: manifest.assetCount,
    captureResult: manifest.capture.result,
    packageVerificationResult: manifest.packageVerification.result,
  },
  remainingGate: 'exact production SHA smoke after merge and permanent Phase 12 closeout evidence',
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify(evidence, null, 2))
