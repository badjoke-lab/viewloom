import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.R12B2_ORIGIN || 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const canonicalOrigin = (process.env.R12B2_CANONICAL_ORIGIN || 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = process.env.R12B2_ARTIFACT_DIR || 'artifacts/r12b2-refund-disclosure'
const routes = ['/support/', '/refund-policy/', '/commercial-disclosure/', '/contact/']
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000, mobile: false },
  { id: 'mobile-390', width: 390, height: 844, mobile: true },
]

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-r12b2-refund-disclosure-consistency-v1',
  phase: 'Phase 12',
  workstream: 'R12B-2',
  origin,
  canonicalOrigin,
  checked_at: new Date().toISOString(),
  result: 'running',
  pages: [],
  navigation: [],
  violations: [],
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile,
    })
    const page = await context.newPage()

    for (const route of routes) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      await page.waitForTimeout(600)
      const facts = await page.evaluate(() => {
        const text = document.body?.innerText?.replace(/\s+/g, ' ').trim() || ''
        const links = [...document.querySelectorAll('a[href]')].map((node) => ({
          href: node.getAttribute('href'),
          text: node.textContent?.replace(/\s+/g, ' ').trim() || '',
          target: node.getAttribute('target'),
          rel: node.getAttribute('rel')?.split(/\s+/).filter(Boolean) || [],
        }))
        return {
          title: document.title,
          h1: document.querySelector('h1')?.textContent?.trim() || null,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
          bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          text,
          links,
          donationWordDetected: /\bdonation\b/i.test(text),
          dashboardStateClaimDetected: /(Stripe Dashboard.*(?:confirmed|current|configured|approved)|registered business website.*(?:confirmed|current))/i.test(text),
          secretLikeTokens: [...text.matchAll(/(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9_]+/g)].map((match) => match[0]),
        }
      })

      const violations = []
      if (response?.status() !== 200) violations.push(`HTTP ${response?.status()}`)
      if (!facts.h1) violations.push('H1 missing')
      if (facts.canonical !== `${canonicalOrigin}${route}`) violations.push(`canonical mismatch: ${facts.canonical}`)
      if (facts.bodyOverflow > 2) violations.push(`horizontal overflow ${facts.bodyOverflow}px`)
      if (facts.donationWordDetected) violations.push('charitable donation wording detected')
      if (facts.dashboardStateClaimDetected) violations.push('unsupported Stripe Dashboard state claim detected')
      if (facts.secretLikeTokens.length) violations.push('secret-like token detected')

      if (route === '/support/') {
        if (!/one[- ]time support/i.test(facts.text)) violations.push('Support one-time wording missing')
        if (!/Stripe-hosted/i.test(facts.text)) violations.push('Support Stripe-hosted wording missing')
        if (!facts.links.some((link) => link.href === '/refund-policy/')) violations.push('Support Refund Policy link missing')
        if (!facts.links.some((link) => link.href === '/commercial-disclosure/')) violations.push('Support Commercial Disclosure link missing')
      }
      if (route === '/refund-policy/') {
        if (!/voluntary one[- ]time payment/i.test(facts.text)) violations.push('Refund voluntary one-time wording missing')
        if (!/generally final/i.test(facts.text)) violations.push('Refund generally-final boundary missing')
        if (!/not automatically approved/i.test(facts.text)) violations.push('Refund review boundary missing')
        if (!facts.links.some((link) => link.href === '/contact/')) violations.push('Refund Contact link missing')
        if (!facts.links.some((link) => link.href === '/commercial-disclosure/')) violations.push('Refund Disclosure link missing')
      }
      if (route === '/commercial-disclosure/') {
        if (!/one[- ]time ViewLoom support-payment flow/i.test(facts.text)) violations.push('Disclosure one-time support wording missing')
        if (!/Stripe-hosted payment page/i.test(facts.text)) violations.push('Disclosure Stripe-hosted wording missing')
        if (!/No ViewLoom account, product tier/i.test(facts.text)) violations.push('Disclosure no-tier delivery boundary missing')
        if (!facts.links.some((link) => link.href === '/refund-policy/')) violations.push('Disclosure Refund link missing')
        if (!facts.links.some((link) => link.href === '/contact/')) violations.push('Disclosure Contact link missing')
      }
      if (route === '/contact/') {
        if (!/payment-support questions/i.test(facts.text)) violations.push('Contact payment-support scope missing')
        if (!/external Google Form/i.test(facts.text)) violations.push('Contact external form explanation missing')
        if (!/Never send complete card numbers/i.test(facts.text)) violations.push('Contact sensitive-payment warning missing')
        const form = facts.links.find((link) => link.href?.startsWith('https://docs.google.com/forms/'))
        if (!form) violations.push('Google Form link missing')
        else {
          if (form.target !== '_blank') violations.push('Google Form target is not _blank')
          if (!form.rel.includes('noreferrer')) violations.push('Google Form noreferrer missing')
        }
      }

      evidence.pages.push({
        id: `${viewport.id}:${route}`,
        viewport,
        route,
        status: response?.status() ?? null,
        facts: {
          title: facts.title,
          h1: facts.h1,
          canonical: facts.canonical,
          bodyOverflow: facts.bodyOverflow,
          donationWordDetected: facts.donationWordDetected,
          dashboardStateClaimDetected: facts.dashboardStateClaimDetected,
          secretLikeTokenCount: facts.secretLikeTokens.length,
        },
        violations,
        screenshot: `${viewport.id}-${route.replaceAll('/', '-') || 'root'}.png`,
      })
      evidence.violations.push(...violations.map((violation) => ({ viewport: viewport.id, route, violation })))
      await page.screenshot({ path: `${out}/${viewport.id}-${route.replaceAll('/', '-') || 'root'}.png`, fullPage: true })
    }

    if (viewport.mobile) {
      await page.goto(`${origin}/support/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      for (const target of ['/refund-policy/', '/commercial-disclosure/']) {
        await page.locator(`a[href="${target}"]`).first().click()
        await page.waitForURL(`**${target}`)
        const landed = new URL(page.url()).pathname
        await page.goBack({ waitUntil: 'domcontentloaded' })
        const returned = new URL(page.url()).pathname
        const pass = landed === target && returned === '/support/'
        evidence.navigation.push({ from: '/support/', target, landed, returned, pass })
        if (!pass) evidence.violations.push({ viewport: viewport.id, route: target, violation: 'Back/return flow failed' })
      }
    }

    await context.close()
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, pages: evidence.pages.length, navigation: evidence.navigation.length, violations: evidence.violations.length }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
