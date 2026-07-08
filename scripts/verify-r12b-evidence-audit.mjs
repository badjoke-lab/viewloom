import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const auditPath = 'docs/audits/r12b-evidence-and-configuration-audit.json'
const operationPath = 'docs/operations/r12b0-evidence-audit-2026-07-09.md'
const notesPath = 'docs/audits/r12b-repository-consistency-notes.md'

for (const path of [auditPath, operationPath, notesPath]) {
  assert.equal(existsSync(path), true, `missing R12B-0 evidence file: ${path}`)
}

const audit = JSON.parse(readFileSync(auditPath, 'utf8'))
assert.equal(audit.schema, 'viewloom-r12b-evidence-and-configuration-audit-v1')
assert.equal(audit.phase, 'Phase 12')
assert.equal(audit.workstream, 'R12B-0')
assert.equal(audit.status, 'complete')

const repository = audit.evidence_classes.repository_facts
assert.equal(repository.status, 'confirmed')
assert.equal(repository.facts.support_route, '/support/')
assert.equal(repository.facts.payment_link_url, 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03')
assert.equal(repository.facts.support_cta_label, 'Open Stripe payment page')
assert.equal(repository.facts.support_cta_target, '_blank')
assert.ok(repository.facts.support_cta_rel.includes('noreferrer'))
assert.equal(repository.facts.refund_route, '/refund-policy/')
assert.equal(repository.facts.commercial_disclosure_route, '/commercial-disclosure/')

const hosted = audit.evidence_classes.hosted_public_behavior
assert.equal(hosted.status, 'confirmed')
assert.equal(hosted.workflow_run, 28962351393)
assert.equal(hosted.artifact_id, 8176591285)
assert.equal(hosted.artifact_digest, 'sha256:e419abdc27d24b1628c5a35cab55712146f1b6e0523094ad3df48fdf182395ad')
assert.equal(hosted.head_sha, 'e77ab5b24aa2b7df7bc400294ef01512c76a90e0')
for (const route of ['/support/', '/refund-policy/', '/commercial-disclosure/', '/contact/']) {
  assert.equal(hosted.pages[route], 200, `${route}: hosted status mismatch`)
}
for (const id of ['desktop_1440', 'mobile_390']) {
  const scenario = hosted.scenarios[id]
  assert.ok(scenario, `missing hosted scenario ${id}`)
  assert.equal(scenario.support_status, 200)
  assert.equal(scenario.payment_link_match, true)
  assert.equal(scenario.cta_target_blank, true)
  assert.equal(scenario.noreferrer_present, true)
  assert.equal(scenario.refund_link_present, true)
  assert.equal(scenario.commercial_disclosure_link_present, true)
  assert.equal(scenario.contact_link_present, true)
  assert.equal(scenario.final_hostname, 'buy.stripe.com')
  assert.equal(scenario.stripe_visible_product_label, 'Support ViewLoom')
  assert.equal(scenario.stripe_visible_amount, 'US$10.00')
  assert.equal(scenario.stripe_change_amount_visible, true)
  assert.equal(scenario.stripe_recurring_language_detected, false)
}

const prior = audit.evidence_classes.prior_external_correspondence
assert.equal(prior.status, 'historical_confirmed_project_record')
assert.equal(prior.recorded_date, '2026-06-09')
assert.equal(prior.current_state_claim, false)

const dashboard = audit.evidence_classes.current_external_dashboard_state
assert.equal(dashboard.status, 'pending_external_evidence')
assert.ok(dashboard.facts_not_inferable_from_repository_or_public_browser.length >= 5)

assert.equal(audit.consistency_review.repository_support_refund_disclosure, 'aligned_with_hosted_public_evidence')
assert.equal(audit.consistency_review.unsupported_dashboard_state_claims_detected, false)
assert.equal(audit.consistency_review.charitable_donation_wording_detected, false)
assert.equal(audit.consistency_review.public_stripe_page_conflicts_with_site_one_time_wording, false)
assert.equal(audit.consistency_review.public_stripe_page_independently_proves_one_time_dashboard_configuration, false)

assert.equal(audit.completion_gate.permanent_audit_distinguishes_repository_and_external_facts, true)
assert.equal(audit.completion_gate.missing_external_evidence_explicitly_pending, true)
assert.equal(audit.completion_gate.hosted_public_evidence_complete, true)
assert.equal(audit.completion_gate.r12b_0_complete, true)
assert.equal(audit.next_workstream, 'R12B-1 Support page and payment transition')

const operation = readFileSync(operationPath, 'utf8')
for (const fragment of [
  'Status: complete',
  'Workstream: R12B-0',
  'Hosted workflow run: `28962351393`',
  'Hosted artifact id: `8176591285`',
  'Final public hostname: buy.stripe.com',
  'current registered business website/domain value in Stripe Dashboard',
  'The next workstream is R12B-1 Support page and payment transition acceptance.',
]) assert.ok(operation.includes(fragment), `${operationPath}: missing ${fragment}`)

const notes = readFileSync(notesPath, 'utf8')
for (const fragment of [
  'Status: complete',
  'Hosted workflow run: `28962351393`',
  'final public hostname: buy.stripe.com',
  'R12B-0 is complete.',
]) assert.ok(notes.includes(fragment), `${notesPath}: missing ${fragment}`)

console.log('R12B-0 permanent evidence audit verification passed.')
console.log('- repository facts are separated from hosted public behavior')
console.log('- hosted desktop and mobile Support-to-Stripe transitions are recorded')
console.log('- prior correspondence is historical evidence only')
console.log('- current Stripe Dashboard/account facts remain explicitly pending external evidence')
console.log('- R12B-0 completion gate is closed and R12B-1 is next')
