import assert from 'node:assert/strict'
import fs from 'node:fs'

const audit = JSON.parse(fs.readFileSync('docs/audits/twitch-stream-map-city-ui-gate-2026-08-26.json', 'utf8'))
assert.equal(audit.schemaVersion, 'viewloom-twitch-stream-map-city-ui-gate-v0.1')
assert.equal(audit.issue, 1060)
assert.equal(audit.countryDefault, true)
assert.equal(audit.cityExplicitQuery, 'geography=city')
assert.equal(audit.currentIrlUiActive, false)
assert.equal(audit.populationFiltersOrthogonal, true)
assert.equal(audit.evidenceFiltersOrthogonal, true)
assert.equal(audit.preciseLocationPublished, false)
assert.equal(audit.stableTwitchUserIdAvailableInMinuteSnapshot, false)
assert.equal(audit.productionDeployAuthorized, false)
assert.equal(audit.d1MutationAuthorized, false)
assert.equal(audit.collectorCadenceChangeAuthorized, false)
console.log(JSON.stringify({ ok: true, issue: audit.issue }, null, 2))
