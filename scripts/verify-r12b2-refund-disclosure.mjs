import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2] || 'artifacts/r12b2-refund-disclosure/evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-r12b2-refund-disclosure-consistency-v1')
assert.equal(evidence.phase, 'Phase 12')
assert.equal(evidence.workstream, 'R12B-2')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.pages.length, 8)
assert.equal(evidence.navigation.length, 2)
assert.equal(evidence.violations.length, 0)

for (const viewport of ['desktop-1440', 'mobile-390']) {
  for (const route of ['/support/', '/refund-policy/', '/commercial-disclosure/', '/contact/']) {
    const page = evidence.pages.find((item) => item.viewport.id === viewport && item.route === route)
    assert.ok(page, `missing ${viewport} ${route}`)
    assert.equal(page.status, 200)
    assert.equal(page.violations.length, 0)
    assert.ok(page.facts.h1)
    assert.equal(page.facts.canonical, `${evidence.origin}${route}`)
    assert.ok(page.facts.bodyOverflow <= 2)
    assert.equal(page.facts.donationWordDetected, false)
    assert.equal(page.facts.dashboardStateClaimDetected, false)
    assert.equal(page.facts.secretLikeTokenCount, 0)
  }
}

for (const nav of evidence.navigation) {
  assert.equal(nav.from, '/support/')
  assert.ok(['/refund-policy/', '/commercial-disclosure/'].includes(nav.target))
  assert.equal(nav.landed, nav.target)
  assert.equal(nav.returned, '/support/')
  assert.equal(nav.pass, true)
}

console.log('R12B-2 refund/disclosure consistency evidence verification passed.')
console.log('- Support, Refund Policy, Commercial Disclosure, and Contact passed desktop/mobile checks')
console.log('- no charitable donation wording was detected')
console.log('- no unsupported current Stripe Dashboard state claim was detected')
console.log('- no secret-like payment token was detected')
console.log('- mobile Support -> legal page -> Back return flow passed')
