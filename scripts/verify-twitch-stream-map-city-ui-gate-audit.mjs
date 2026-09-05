import assert from 'node:assert/strict'
import fs from 'node:fs'

const historical = JSON.parse(fs.readFileSync('docs/audits/twitch-stream-map-city-ui-gate-2026-08-26.json', 'utf8'))
assert.equal(historical.schemaVersion, 'viewloom-twitch-stream-map-city-ui-gate-v0.1')
assert.equal(historical.issue, 1060)
assert.equal(historical.countryDefault, true)
assert.equal(historical.cityExplicitQuery, 'geography=city')
assert.equal(historical.currentIrlUiActive, false)
assert.equal(historical.populationFiltersOrthogonal, true)
assert.equal(historical.evidenceFiltersOrthogonal, true)
assert.equal(historical.preciseLocationPublished, false)
assert.equal(historical.stableTwitchUserIdAvailableInMinuteSnapshot, false)
assert.equal(historical.productionDeployAuthorized, false)
assert.equal(historical.d1MutationAuthorized, false)
assert.equal(historical.collectorCadenceChangeAuthorized, false)

const current = JSON.parse(fs.readFileSync('docs/audits/twitch-stream-map-city-public-acceptance-2026-09-05.json', 'utf8'))
assert.equal(current.schemaVersion, 'viewloom-twitch-stream-map-city-public-acceptance-v0.2')
assert.equal(current.auditDate, '2026-09-05')
assert.equal(current.baselineIssue, 1060)
assert.match(current.mainSha, /^[0-9a-f]{40}$/)
assert.equal(current.countryDefault, true)
assert.equal(current.cityExplicitQuery, 'geography=city')
assert.equal(current.publicCityUiActivated, true)
assert.equal(current.currentLocationActivated, false)
assert.equal(current.currentIrlUiActive, false)
assert.deepEqual(current.cityPlacementLocationTypes, ['home_base', 'declared_location'])
assert.equal(current.currentLocationFilterEnabledInCity, false)
assert.equal(current.countryOnlyPromotedToCity, false)
assert.equal(current.creatorCoordinatesPublished, false)
assert.equal(current.cityReferenceRole, 'city_aggregate_reference')
assert.equal(current.noGeometryFallback, 'list_only')
assert.equal(current.mappedResultsBeforeUnmapped, true)
assert.equal(current.cityResultsFullWidth, true)
assert.equal(current.populationFiltersOrthogonal, true)
assert.equal(current.evidenceFiltersOrthogonal, true)
assert.equal(current.loginIsStableIdentity, false)
assert.equal(current.stableIdentityStateExposed, true)
assert.equal(current.productionBrowserSmoke?.runId, 33959062990)
assert.equal(current.productionBrowserSmoke?.conclusion, 'success')
assert.equal(current.productionBrowserSmoke?.mainSha, current.mainSha)
assert.equal(current.productionBrowserSmoke?.pageErrors, 0)
assert.equal(current.productionBrowserSmoke?.consoleErrors, 0)
assert.equal(current.productionMutationPerformedByAudit, false)
assert.equal(current.d1MutationPerformedByAudit, false)
assert.equal(current.collectorCadenceChangedByAudit, false)
assert.equal(current.collectorChangedByAudit, false)
assert.equal(current.retentionChangedByAudit, false)

console.log(JSON.stringify({
  ok: true,
  historicalIssue: historical.issue,
  historicalAuditPreserved: true,
  currentAuditDate: current.auditDate,
  publicCityUiActivated: current.publicCityUiActivated,
  currentIrlUiActive: current.currentIrlUiActive,
  productionBrowserSmokeRunId: current.productionBrowserSmoke.runId,
}, null, 2))
