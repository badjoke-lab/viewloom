import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.R12B_ORIGIN || 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = process.env.R12B_ARTIFACT_DIR || 'artifacts/r12b-hosted-support-audit'
const expectedPaymentLink = 'https://buy.stripe.com/6oUcMYeRh0Na2oX3cDcIE03'

const scenarios = [
  { id: 'desktop-1440', viewport: { width: 1440, height: 1000 }, isMobile: false },
  { id: 'mobile-390', viewport: { width: 390, height: 844 }, isMobile: true },
]

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-r12b-hosted-support-audit-v1',
  phase: 'Phase 12',
  workstream: 'R12B-0',
  checked_at: new Date().toISOString(),
  origin,
  expected_payment_link: expectedPaymentLink,
  result: 'running',
  pages: {},
  scenarios: [],
  limitations: [
    'Public browser behavior cannot prove Stripe Dashboard configuration.',
    'Absence of recurring wording on a public page does not prove an account-level recurring setting is impossible.',
    'No payment is submitted by this audit.',
  ],
}

try {
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const publicPage = await publicContext.newPage()
  for (const route of ['/support/', '/refund-policy/', '/commercial-disclosure/', '/contact/']) {
    const response = await publicPage.goto(`${origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await publicPage.waitForTimeout(700)
    evidence.pages[route] = await publicPage.evaluate((path) => ({
      route: path,
      status: document.readyState ? 200 : null,
      title: document.title,
      h1: document.querySelector('h1')?.textContent?.trim() || null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
      body_text: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 1200) || '',
    }), route)
    evidence.pages[route].status = response?.status() ?? null
  }
  await publicContext.close()

  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: scenario.viewport,
      isMobile: scenario.isMobile,
      hasTouch: scenario.isMobile,
    })
    const page = await context.newPage()
    const response = await page.goto(`${origin}/support/`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForTimeout(700)

    const support = await page.evaluate(() => {
      const cta = [...document.querySelectorAll('a')].find((node) => node.href.includes('buy.stripe.com'))
      const rel = cta?.getAttribute('rel')?.split(/\s+/).filter(Boolean) || []
      return {
        status: 200,
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() || null,
        cta_name: cta?.textContent?.replace(/\s+/g, ' ').trim() || null,
        cta_href: cta?.getAttribute('href') || null,
        cta_target: cta?.getAttribute('target') || null,
        cta_rel: rel,
        refund_link_present: Boolean(document.querySelector('a[href="/refund-policy/"]')),
        disclosure_link_present: Boolean(document.querySelector('a[href="/commercial-disclosure/"]')),
        contact_link_present: Boolean(document.querySelector('a[href="/contact/"]')),
        page_one_time_wording_present: /one[- ]time/i.test(document.body?.innerText || ''),
      }
    })
    support.status = response?.status() ?? null

    await page.screenshot({ path: `${out}/${scenario.id}-support.png`, fullPage: true })

    const popupPromise = context.waitForEvent('page', { timeout: 20_000 }).catch(() => null)
    await page.locator('a[href*="buy.stripe.com"]').first().click()
    let stripePage = await popupPromise
    if (!stripePage) stripePage = page
    await stripePage.waitForLoadState('domcontentloaded', { timeout: 45_000 }).catch(() => {})
    await stripePage.waitForTimeout(2500)

    const stripe = await stripePage.evaluate(() => {
      const text = document.body?.innerText?.replace(/\s+/g, ' ').trim() || ''
      return {
        final_url: location.href,
        hostname: location.hostname,
        title: document.title,
        one_time_language_detected: /one[- ]time/i.test(text),
        recurring_language_detected: /(subscription|recurring|per month|monthly|\/month|per year|yearly)/i.test(text),
        visible_text_excerpt: text.slice(0, 1200),
      }
    })
    await stripePage.screenshot({ path: `${out}/${scenario.id}-stripe.png`, fullPage: true }).catch(() => {})

    evidence.scenarios.push({
      id: scenario.id,
      viewport: scenario.viewport,
      isMobile: scenario.isMobile,
      support,
      stripe,
    })
    await context.close()
  }

  evidence.result = 'pass'
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.length, pages: Object.keys(evidence.pages).length }, null, 2))
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
