import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const required = [
  '.github/workflows/production-smoke.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/phase11-monitoring-contract.yml',
  'scripts/build-phase11-monitoring-evidence.mjs',
  'scripts/verify-phase11-monitoring-evidence.mjs',
  'docs/operations/phase11-monitoring-and-escalation.md',
  'docs/operations/phase11-maintenance-cadence.md',
]
for (const path of required) assert.equal(existsSync(path), true, `missing file: ${path}`)

const production = read('.github/workflows/production-smoke.yml')
for (const fragment of [
  "cron: '17 3 * * *'",
  'Wait for the matching production deployment',
  'Verify all repository-owned production pages',
  'Verify Twitch production status',
  'Verify Kick production status',
  'Build Phase 11 monitoring evidence',
  'Verify Phase 11 monitoring evidence',
  'Verify explicit not-found behavior',
  'scripts/build-phase11-monitoring-evidence.mjs',
  'scripts/verify-phase11-monitoring-evidence.mjs',
]) assert.ok(production.includes(fragment), `Production Smoke missing ${fragment}`)

const readiness = read('.github/workflows/public-readiness-audit.yml')
for (const fragment of [
  "cron: '23 2 * * 1'",
  'Audit built public pages',
  'Verify linked changelog data',
  'Verify explicit not-found page',
  'Verify deployment metadata',
]) assert.ok(readiness.includes(fragment), `Public Readiness Audit missing ${fragment}`)

const runbook = read('docs/operations/phase11-monitoring-and-escalation.md')
for (const fragment of [
  'Daily Production Smoke',
  'Weekly Public Readiness Audit',
  'Twitch binding: DB_TWITCH_HOT',
  'Kick binding: DB_KICK_HOT',
  'viewloom-phase11-monitoring-evidence-v1',
  'within-window',
  'near-window-limit',
  'at-or-over-window',
  '### Critical',
  '### High',
  '### Watch',
  '## 6. Escalation ownership',
]) assert.ok(runbook.includes(fragment), `monitoring runbook missing ${fragment}`)

const cadence = read('docs/operations/phase11-maintenance-cadence.md')
for (const fragment of [
  '## Daily automated evidence',
  '## Weekly automated evidence',
  '## Monthly operator review',
  '## Quarterly review',
  'workflowsMissingLatestHeadCancellation == 0',
  'verify no combined viewer total or combined ranking exists',
  'retire a workflow only when replacement assertions are named and passing',
]) assert.ok(cadence.includes(fragment), `maintenance cadence missing ${fragment}`)

const monitorContract = read('.github/workflows/phase11-monitoring-contract.yml')
for (const fragment of [
  'name: Phase 11 Monitoring Contract',
  'Build monitoring evidence',
  'Verify monitoring evidence',
  'Verify fixture capacity classifications',
  'cancel-in-progress: true',
]) assert.ok(monitorContract.includes(fragment), `monitoring contract workflow missing ${fragment}`)

console.log('Phase 11 operations contract verification passed.')
console.log('- existing daily Production Smoke owns hosted monitoring evidence')
console.log('- existing weekly Public Readiness Audit owns built-surface readiness')
console.log('- escalation and maintenance cadence are documented and machine-checked')
console.log('- no new application or collector cron is required')
