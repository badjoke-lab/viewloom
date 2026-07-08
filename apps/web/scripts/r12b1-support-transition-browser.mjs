import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.R12B1_ORIGIN || 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = process.env.R12B1_ARTIFACT_DIR || 'artifacts/r12b1-support-transition'
const paymentLink = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'
const scenarios = [
  { id: 'desktop-1440', width: 1440, height: 1000, isMobile: false },
  { id: 'mobile-390', width: 390, height: 844, isMobile: true },
]

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-r12b1-support-transition-v1',
  phase: 'Phase 12',
  workstream: 'R12B-1',
  origin,
  paymentLink,
  checked_at: new Date().toISOString(),
  result: 'running',
  scenarios: [],
  violations: [],
}

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      isMobile: scenario.isMobile,
      hasTouch: scenario.isMobile,
    })
    const page = await context.newPage()
    const response = await page.goto(`${origin}/support/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForTimeout(800)

    const facts = await page.evaluate((expected) => {
      const cta = [...document.querySelectorAll('a')].find((node) => node.getAttribute('href') === expected)
      const rect = cta?.getBoundingClientRect()
      const bodyText = document.body?.innerText || ''
      const supportSection = cta?.closest('.support-option')
      const supportText = supportSection?.textContent?.replace(/\s+/g, ' ').trim() || ''
      const suspicious = [...document.querySelectorAll('body *')]
        .map((node) => node.textContent || '')
        .filter((text) => /(sk_live_|sk_test_|rk_live_|pk_live_)/.test(text))
        .slice(0, 5)
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() || null,
        bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        ctaPresent: Boolean(cta),
        ctaName: cta?.textContent?.replace(/\s+/g, ' ').trim() || null,
        ctaHref: cta?.getAttribute('href') || null,
        ctaTarget: cta?.getAttribute('target') || null,
        ctaRel: cta?.getAttribute('rel')?.split(/\s+/).filter(Boolean) || [],
        ctaWidth: rect ? Math.round(rect.width) : 0,
        ctaHeight: rect ? Math.round(rect.height) : 0,
        stripeHostedExplanation: /Stripe-hosted ViewLoom payment page/i.test(supportText),
        leavesViewLoomExplanation: /payment processing takes place on a Stripe-hosted page/i.test(bodyText),
        oneTimeSupportWording: /one[- ]time support/i.test(bodyText),
        noAccountWording: /No ViewLoom account is created/i.test(bodyText),
        noProductTierWording: /no product tier is unlocked/i.test(bodyText),
        refundLinkPresent: Boolean(document.querySelector('a[href="/refund-policy/"]')),
        disclosureLinkPresent: Boolean(document.querySelector('a[href="/commercial-disclosure/"]')),
        contactLinkPresent: Boolean(document.querySelector('a[href="/contact/"]')),
        secretLikeTokens: suspicious,
      }
    }, paymentLink)

    const violations = []
    if (response?.status() !== 200) violations.push(`Support returned ${response?.status()}`)
    if (!facts.ctaPresent) violations.push('payment CTA missing')
    if (facts.ctaName !== 'Open Stripe payment page') violations.push(`unexpected CTA name: ${facts.ctaName}`)
    if (facts.ctaHref !== paymentLink) violations.push('Payment Link mismatch')
    if (facts.ctaTarget !== '_blank') violations.push('external payment destination is not target=_blank')
    if (!facts.ctaRel.includes('noreferrer')) violations.push('noreferrer missing')
    if (!facts.stripeHostedExplanation) violations.push('Stripe-hosted transition explanation missing near CTA')
    if (!facts.leavesViewLoomExplanation) violations.push('payment processing destination explanation missing')
    if (!facts.oneTimeSupportWording) violations.push('bounded one-time support wording missing')
    if (!facts.noAccountWording) violations.push('no-account explanation missing')
    if (!facts.noProductTierWording) violations.push('no-product-tier explanation missing')
    if (!facts.refundLinkPresent) violations.push('Refund Policy link missing')
    if (!facts.disclosureLinkPresent) violations.push('Commercial Disclosure link missing')
    if (!facts.contactLinkPresent) violations.push('Contact link missing')
    if (facts.bodyOverflow > 2) violations.push(`horizontal overflow ${facts.bodyOverflow}px`)
    if (scenario.isMobile && facts.ctaHeight < 44) violations.push(`mobile CTA height ${facts.ctaHeight}px is below 44px`)
    if (facts.secretLikeTokens.length) violations.push('secret-like token exposed in public DOM text')

    const scenarioEvidence = {
      id: scenario.id,
      viewport: { width: scenario.width, height: scenario.height },
      isMobile: scenario.isMobile,
      status: response?.status() ?? null,
      facts,
      violations,
      screenshot: `${scenario.id}-support.png`,
    }
    evidence.scenarios.push(scenarioEvidence)
    evidence.violations.push(...violations.map((violation) => ({ scenario: scenario.id, violation })))
    await page.screenshot({ path: `${out}/${scenario.id}-support.png`, fullPage: true })
    await context.close()
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.length, violations: evidence.violations.length }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
