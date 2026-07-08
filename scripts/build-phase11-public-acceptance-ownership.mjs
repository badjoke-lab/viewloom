import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const outputPath = process.argv[2] || 'artifacts/phase11-public-acceptance-ownership/ownership.json'
const sources = [
  'docs/audits/public-surface-routes-portal.json',
  'docs/audits/public-surface-routes-twitch.json',
  'docs/audits/public-surface-routes-kick.json',
]

const profileOwner = {
  portal: 'public-surface-inventory',
  static_content: 'public-surface-inventory',
  static_legal: 'release-r12a-legal-support',
  changelog: 'public-surface-inventory',
  provider_home: 'public-browser-audit',
  heatmap: 'heatmap-release-contract',
  day_flow: 'quality-u10g-architecture',
  battle_lines: 'quality-u10g-architecture',
  history: 'history-p9h7-acceptance',
  channel: 'channel-candidate-acceptance',
  watchlist: 'watchlist-browser-acceptance',
  status: 'data-status-browser',
}

const commonOwners = {
  readiness: '.github/workflows/public-readiness-audit.yml',
  browser: '.github/workflows/public-browser-audit.yml',
  production: '.github/workflows/production-smoke.yml',
}

const routes = sources.flatMap((path) => JSON.parse(readFileSync(path, 'utf8')).routes)
  .filter((entry) => entry.route !== '*')
  .map((entry) => ({
    id: entry.id,
    route: entry.route,
    provider: entry.provider,
    profile: entry.profile,
    source: entry.source,
    apis: entry.apis,
    owners: {
      ...commonOwners,
      featureContract: profileOwner[entry.profile] ?? 'public-browser-audit',
    },
  }))

const evidence = {
  schema: 'viewloom-phase11-public-acceptance-ownership-v1',
  phase: 'Phase 11',
  workstream: 'P11F-retained-current-ownership',
  generatedAt: new Date().toISOString(),
  sources,
  commonOwners,
  counts: {
    routes: routes.length,
    portal: routes.filter((entry) => entry.provider === 'portal').length,
    twitch: routes.filter((entry) => entry.provider === 'twitch').length,
    kick: routes.filter((entry) => entry.provider === 'kick').length,
  },
  routes,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify(evidence.counts, null, 2))
