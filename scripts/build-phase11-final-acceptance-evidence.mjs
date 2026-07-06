import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const outputPath = process.argv[2] || 'artifacts/phase11-final-acceptance/evidence.json'
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const strict = readJson('docs/audits/phase11-strict-null-baseline.json')
const ci = readJson('docs/audits/phase11-ci-ownership-baseline.json')
const overlap = readJson('docs/audits/phase11-ci-overlap-classification.json')
const monitoring = readJson('docs/audits/phase11-monitoring-contract.json')
const ownership = readJson('docs/audits/phase11-public-acceptance-ownership.json')
const webPackage = readJson('apps/web/package.json')

const overridePresent = ['typecheck', 'typecheck:app', 'typecheck:functions']
  .some((name) => String(webPackage.scripts?.[name] ?? '').includes('--strictNullChecks false'))

const checks = {
  p11aStrictNullComplete:
    strict.status === 'remediation-complete' &&
    strict.result?.app_strict_null_clean === true &&
    strict.result?.functions_strict_null_clean === true &&
    strict.result?.command_line_overrides_remaining === 0 &&
    strict.result?.total_errors_remaining === 0 &&
    overridePresent === false,
  p11bCancellationComplete:
    ci.status === 'cancellation-remediation-complete' &&
    ci.remediation?.counts?.workflows_missing_latest_head_cancellation === 0,
  p11bOverlapClassified:
    overlap.status === 'classified' &&
    overlap.decision?.workflows_retired_by_named_step_overlap === 0 &&
    overlap.decision?.workflow_retirement_requires_named_replacement_assertions === true,
  p11cMonitoringContractComplete:
    monitoring.contract_evidence?.result === 'pass' &&
    monitoring.monitoring_owner?.new_application_cron_added === false &&
    monitoring.monitoring_owner?.new_collector_cron_added === false,
  p11dRunbookPresent: existsSync('docs/operations/phase11-monitoring-and-escalation.md'),
  p11eCadencePresent: existsSync('docs/operations/phase11-maintenance-cadence.md'),
  p11fOwnershipComplete:
    ownership.status === 'complete' &&
    ownership.counts?.routes === 20 &&
    ownership.requirements?.provider_binding_crossing_failures === 0 &&
    ownership.requirements?.route_duplicates === 0,
  temporaryP11aApplyToolingRemoved:
    !existsSync('scripts/apply-phase11-p11a-app-fixes.mjs') &&
    !existsSync('.github/workflows/phase11-p11a-app-apply.yml'),
}

const allPreMergeChecksPass = Object.values(checks).every(Boolean)
const evidence = {
  schema: 'viewloom-phase11-final-acceptance-v1',
  phase: 'Phase 11',
  workstream: 'P11G',
  generatedAt: new Date().toISOString(),
  state: allPreMergeChecksPass ? 'pre-merge-pass' : 'pre-merge-fail',
  checks,
  boundaries: {
    providerSeparationRequired: true,
    providerCombinationAuthorized: false,
    newApiAuthorized: false,
    newD1SchemaAuthorized: false,
    newCollectorAuthorized: false,
    newApplicationCronAuthorized: false,
    newCollectorCronAuthorized: false,
    retentionChangeAuthorized: false,
  },
  hostedProductionCloseout: {
    required: true,
    status: 'pending-main-merge',
    owner: '.github/workflows/production-smoke.yml',
    requiredEvidenceSchema: 'viewloom-phase11-monitoring-evidence-v1',
  },
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
console.log(JSON.stringify({ state: evidence.state, checks: evidence.checks }, null, 2))
