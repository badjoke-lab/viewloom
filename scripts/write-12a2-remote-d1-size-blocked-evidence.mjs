#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const outputPath = resolve(process.argv[2] || 'artifacts/12a2-remote-d1-size/evidence.json')
const evidence = {
  schemaVersion: 'viewloom-12a2-remote-d1-size-gate-v1',
  workstream: '12A-2 compact intraday rollup design and migration',
  generatedAt: new Date().toISOString(),
  status: 'blocked',
  evidenceMode: 'wrangler-d1-info-json',
  blocker: {
    code: 'cloudflare_credentials_missing',
    requiredRepositorySecrets: [
      'CLOUDFLARE_API_TOKEN',
      'CLOUDFLARE_ACCOUNT_ID',
    ],
    secretValuesIncluded: false,
  },
  sourceCommandContract: {
    providerInfo: 'wrangler d1 info [NAME] --json',
    accountList: 'wrangler d1 list --json',
    rawAccountDatabaseNamesPersisted: false,
  },
  gate: {
    twitchPass: false,
    kickPass: false,
    accountPass: false,
    migrationStorageGatePass: false,
    migrationAuthorizedByThisEvidenceAlone: false,
  },
  privacy: {
    unrelatedDatabaseNamesIncluded: false,
    secretsIncluded: false,
    accountIdIncluded: false,
  },
  limitations: [
    'Remote D1 size observations were not collected because the required repository credentials were unavailable to the workflow.',
    'No current database size, projected utilization, or storage headroom claim is made by this blocked evidence.',
    'Migration remains blocked until observed remote D1 size evidence passes the storage gate.',
  ],
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')
console.log(`Blocked 12A-2 remote size evidence written to ${outputPath}`)
console.log('blocker=cloudflare_credentials_missing')
console.log('migrationStorageGatePass=false')
