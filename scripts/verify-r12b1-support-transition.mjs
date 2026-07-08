import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/r12b1-support-transition/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-r12b1-support-transition-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12B-1')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.paymentLink, 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03')
assert.equal(evidence.scenarios.length, 2)
assert.equal(evidence.violations.length, 0)

for (const id of ['desktop-1440', 'mobile-390']) {
  const scenario = evidence.scenarios.find((item) => item.id === id)
  assert.ok(scenario, `missing scenario ${id}`)
  assert.equal(scenario.status, 200)
  assert.equal(scenario.violations.length, 0)
  assert.equal(scenario.facts.ctaPresent, true)
  assert.equal(scenario.facts.ctaName, 'Open Stripe payment page')
  assert.equal(scenario.facts.ctaHref, evidence.paymentLink)
  assert.equal(scenario.facts.ctaTarget, '_blank')
  assert.ok(scenario.facts.ctaRel.includes('noreferrer'))
  assert.equal(scenario.facts.stripeHostedExplanation, true)
  assert.equal(scenario.facts.leavesViewLoomExplanation, true)
  assert.equal(scenario.facts.oneTimeSupportWording, true)
  assert.equal(scenario.facts.noAccountWording, true)
  assert.equal(scenario.facts.noProductTierWording, true)
  assert.equal(scenario.facts.refundLinkPresent, true)
  assert.equal(scenario.facts.disclosureLinkPresent, true)
  assert.equal(scenario.facts.contactLinkPresent, true)
  assert.ok(scenario.facts.bodyOverflow <= 2)
  assert.equal(scenario.facts.secretLikeTokens.length, 0)
}

const mobile = evidence.scenarios.find((item) => item.id === 'mobile-390')
assert.ok(mobile.facts.ctaHeight >= 44, `mobile CTA height ${mobile.facts.ctaHeight}px is below 44px`)

console.log('R12B-1 Support transition browser evidence verification passed.')
console.log('- desktop and mobile Support flow pass')
console.log('- Stripe-hosted transition is explained before the external link is used')
console.log('- external destination attributes and accessible CTA name are preserved')
console.log('- mobile CTA meets the 44px target rule')
console.log('- Refund Policy, Commercial Disclosure, and Contact links are available')
console.log('- no secret-like payment token is exposed in public DOM text')
