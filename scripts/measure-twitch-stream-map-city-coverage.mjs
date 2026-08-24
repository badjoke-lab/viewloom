import fs from 'node:fs'
import { measureCityCoverage } from '../tools/twitch-stream-map-coverage-expansion/city-coverage.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const artifactPath = process.argv[2]
if (!artifactPath) throw new Error('usage: node scripts/measure-twitch-stream-map-city-coverage.mjs <top300-artifact.json>')

const populationArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
const result = measureCityCoverage({
  populationArtifact,
  reviewedRecords: TWITCH_REVIEWED_LOCATION_RECORDS,
})

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
