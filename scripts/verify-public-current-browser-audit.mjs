import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || '/tmp/public-current-browser-audit/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
const routeFiles = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
]
const expectedRoutes = routeFiles
  .flatMap((file) => JSON.parse(readFileSync(file, 'utf8')).routes)
  .filter((route) => route.route !== '*')
const twitchFeatureRoutes = expectedRoutes.filter((route) => route.provider === 'twitch' && route.profile !== 'provider_home')
const kickFeatureRoutes = expectedRoutes.filter((route) => route.provider === 'kick' && route.profile !== 'provider_home')

assert.equal(evidence.schema, 'viewloom-public-current-browser-audit-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12A')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.counts.routes, expectedRoutes.length)
assert.equal(evidence.counts.routes, 26)
assert.equal(evidence.counts.viewports, 4)
assert.equal(evidence.counts.scenarios, expectedRoutes.length * 4)
assert.equal(evidence.counts.scenarios, 104)
assert.equal(evidence.counts.violations, 0)
assert.equal(evidence.counts.providerCrossingScenarios, 0)
assert.equal(evidence.counts.providerNeutralApiRequestScenarios, 0)
assert.equal(evidence.counts.overflowScenarios, 0)
assert.equal(evidence.counts.focusFailures, 0)
assert.equal(evidence.counts.unlabeledControlScenarios, 0)
assert.equal(evidence.counts.legalMobileTargetFailures, 0)
assert.equal(evidence.counts.twitchHomeStreamMapLinkScenarios, 4)
assert.equal(evidence.counts.kickHomeStreamMapLinkScenarios, 0)
assert.equal(evidence.counts.twitchFeatureTabStreamMapLinkScenarios, twitchFeatureRoutes.length * 4)
assert.equal(evidence.counts.kickFeatureTabStreamMapLinkScenarios, 0)
assert.equal(evidence.scenarios.length, 104)

for (const route of expectedRoutes) {
  const scenarios = evidence.scenarios.filter((item) => item.route === route.route)
  assert.equal(scenarios.length, 4, `${route.route}: expected four viewport scenarios`)
  for (const scenario of scenarios) {
    assert.equal(scenario.status, 200, `${scenario.id}: status`)
    assert.equal(scenario.violations.length, 0, `${scenario.id}: violations`)
    assert.equal(scenario.canonical, route.canonical, `${scenario.id}: canonical`)
    if (route.provider === 'portal' && (route.apis ?? []).length === 0) {
      assert.equal(scenario.apiRequests.length, 0, `${scenario.id}: provider-neutral API requests`)
    }
  }
}

const twitchHomeScenarios = evidence.scenarios.filter((item) => item.route === '/twitch/')
assert.equal(twitchHomeScenarios.length, 4)
for (const scenario of twitchHomeScenarios) {
  const streamMapLink = scenario.providerHomeStreamMapLinks.find((link) => link.href === '/twitch/map/')
  assert.ok(streamMapLink, `${scenario.id}: Twitch Home Stream Map link missing`)
  assert.equal(streamMapLink.visible, true, `${scenario.id}: Twitch Home Stream Map link hidden`)
  assert.match(streamMapLink.text, /Stream Map/i, `${scenario.id}: Twitch Home Stream Map label`)
}

const kickHomeScenarios = evidence.scenarios.filter((item) => item.route === '/kick/')
assert.equal(kickHomeScenarios.length, 4)
for (const scenario of kickHomeScenarios) {
  assert.equal(
    scenario.providerHomeStreamMapLinks.some((link) => link.href === '/kick/map/'),
    false,
    `${scenario.id}: Kick Home must not expose /kick/map/ before K4`,
  )
}

for (const route of twitchFeatureRoutes) {
  const scenarios = evidence.scenarios.filter((item) => item.route === route.route)
  assert.equal(scenarios.length, 4, `${route.route}: expected four Twitch feature scenarios`)
  for (const scenario of scenarios) {
    const links = scenario.featureTabStreamMapLinks.filter((link) => link.href === '/twitch/map/')
    assert.equal(links.length, 1, `${scenario.id}: expected one Twitch Stream Map feature-tab link`)
    assert.equal(links[0].visible, true, `${scenario.id}: Twitch Stream Map feature-tab link hidden`)
    assert.match(links[0].text, /Stream Map/i, `${scenario.id}: Twitch Stream Map feature-tab label`)
    if (route.route === '/twitch/map/') {
      assert.equal(links[0].active, true, `${scenario.id}: Twitch Stream Map tab active state`)
      assert.equal(links[0].current, 'page', `${scenario.id}: Twitch Stream Map tab aria-current`)
    }
  }
}

for (const route of kickFeatureRoutes) {
  const scenarios = evidence.scenarios.filter((item) => item.route === route.route)
  assert.equal(scenarios.length, 4, `${route.route}: expected four Kick feature scenarios`)
  for (const scenario of scenarios) {
    assert.equal(
      scenario.featureTabStreamMapLinks.some((link) => link.href === '/kick/map/'),
      false,
      `${scenario.id}: Kick feature tabs must not expose /kick/map/ before K4`,
    )
  }
}

console.log('Current public browser audit verification passed.')
console.log(`- routes: ${evidence.counts.routes}`)
console.log(`- scenarios: ${evidence.counts.scenarios}`)
console.log('- provider crossing: 0')
console.log('- provider-neutral API requests: 0')
console.log('- overflow/focus/unlabeled/legal mobile target failures: 0')
console.log('- Twitch Home Stream Map link scenarios: 4/4')
console.log(`- Twitch feature-tab Stream Map link scenarios: ${twitchFeatureRoutes.length * 4}/${twitchFeatureRoutes.length * 4}`)
console.log('- Kick Home unauthorized Stream Map link scenarios: 0/4')
console.log(`- Kick feature-tab unauthorized Stream Map link scenarios: 0/${kickFeatureRoutes.length * 4}`)
