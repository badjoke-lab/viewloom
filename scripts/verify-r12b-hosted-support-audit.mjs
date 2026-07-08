import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/r12b-hosted-support-audit/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-r12b-hosted-support-audit-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12B-0')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.expected_payment_link, 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03')
assert.equal(evidence.scenarios.length, 2)

for (const route of ['/support/', '/refund-policy/', '/commercial-disclosure/', '/contact/']) {
  const page = evidence.pages[route]
  assert.ok(page, `missing hosted page evidence: ${route}`)
  assert.equal(page.status, 200, `${route}: expected HTTP 200`)
  assert.ok(page.title?.includes('ViewLoom'), `${route}: ViewLoom title missing`)
  assert.ok(page.h1, `${route}: h1 missing`)
  assert.equal(page.canonical, `https://vl.badjoke-lab.com${route}`, `${route}: canonical mismatch`)
}

for (const scenario of evidence.scenarios) {
  assert.equal(scenario.support.status, 200, `${scenario.id}: Support page did not return 200`)
  assert.equal(scenario.support.cta_href, evidence.expected_payment_link, `${scenario.id}: unexpected Payment Link href`)
  assert.equal(scenario.support.cta_target, '_blank', `${scenario.id}: external payment link must open a new tab/window`)
  assert.ok(scenario.support.cta_rel.includes('noreferrer'), `${scenario.id}: noreferrer missing`)
  assert.equal(scenario.support.refund_link_present, true, `${scenario.id}: Refund Policy link missing before transition`)
  assert.equal(scenario.support.disclosure_link_present, true, `${scenario.id}: Commercial Disclosure link missing before transition`)
  assert.equal(scenario.support.contact_link_present, true, `${scenario.id}: Contact link missing`)
  assert.equal(scenario.support.page_one_time_wording_present, true, `${scenario.id}: Support page one-time wording missing`)
  assert.ok(scenario.stripe.hostname.endsWith('stripe.com'), `${scenario.id}: final hosted payment destination is not Stripe`)
  assert.ok(scenario.stripe.final_url.startsWith('https://'), `${scenario.id}: Stripe destination must be HTTPS`)
  assert.ok(scenario.stripe.title, `${scenario.id}: Stripe-hosted page title missing`)
}

assert.ok(Array.isArray(evidence.limitations) && evidence.limitations.length >= 3, 'audit limitations must be explicit')

console.log('R12B hosted support-flow audit verification passed.')
console.log('- public Support, Refund Policy, Commercial Disclosure, and Contact routes returned 200')
console.log('- desktop and mobile Support CTA ownership matches the repository Payment Link')
console.log('- final public payment destination is Stripe-hosted')
console.log('- legal/refund/contact links remain available before payment transition')
console.log('- dashboard/account configuration remains outside this public browser evidence')
