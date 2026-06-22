import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const previewBase = (process.env.HISTORY_H7_PREVIEW_URL ?? 'https://fix-history-usability-pass.viewloom.pages.dev').replace(/\/$/, '')
const productionBase = (process.env.HISTORY_H7_PRODUCTION_URL ?? 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = resolve(process.env.HISTORY_H7_ARTIFACT_DIR ?? 'artifacts/history-h7-hosted')
mkdirSync(out, { recursive: true })

const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function readJson(url, label) {
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
  const text = await response.text()
  let payload
  try { payload = JSON.parse(text) } catch { throw new Error(`${label} did not return JSON (HTTP ${response.status}).`) }
  return { response, payload, text }
}

async function probePreviewFunction(path, provider) {
  const url = `${previewBase}${path}?period=30d&metric=viewer_minutes&qa=${Date.now()}`
  const { response, payload, text } = await readJson(url, `${provider} Preview Function`)
  assert(payload.platform === provider, `${provider} Preview Function platform mismatch.`)
  assert(response.status !== 404, `${provider} Preview Function route was not deployed.`)
  if (response.ok) {
    assert(payload.source === 'real', `${provider} Preview Function source is ${payload.source ?? 'missing'}.`)
    console.log(`${provider} Preview Function executed with state=${payload.state}.`)
    return
  }
  const structuredBindingError = response.status === 500
    && payload.source === 'real'
    && payload.state === 'error'
    && payload.error?.code === 'history_api_error'
  assert(structuredBindingError, `${provider} Preview Function returned ${response.status}: ${text.slice(0, 500)}`)
  console.log(`${provider} Preview Function executed; Preview D1 binding is unavailable and returned a structured history_api_error.`)
}

async function probeProductionApi(path, provider) {
  const url = `${productionBase}${path}?period=30d&metric=viewer_minutes&qa=${Date.now()}`
  const { response, payload, text } = await readJson(url, `${provider} production API`)
  assert(response.ok, `${provider} production API returned ${response.status}: ${text.slice(0, 500)}`)
  assert(payload.platform === provider, `${provider} production API platform mismatch.`)
  assert(payload.source === 'real', `${provider} production API source is ${payload.source ?? 'missing'}, expected real.`)
  assert(['fresh', 'partial'].includes(payload.state), `${provider} production API state is ${payload.state ?? 'missing'}.`)
  const observedDays = Array.isArray(payload.daily)
    ? payload.daily.filter((day) => day && day.coverageState !== 'missing').length
    : 0
  assert(observedDays > 0, `${provider} production API has no retained observed day.`)
  assert(Array.isArray(payload.topStreamers) && payload.topStreamers.length > 0, `${provider} production API has no retained top streamers.`)
  console.log(`${provider} production API passed: state=${payload.state} observedDays=${observedDays} topStreamers=${payload.topStreamers.length}`)
}

async function proxyProductionHistory(context) {
  const routes = [
    ['**/api/history?**', '/api/history'],
    ['**/api/kick-history?**', '/api/kick-history'],
  ]
  for (const [pattern, pathname] of routes) {
    await context.route(pattern, async (route) => {
      const requested = new URL(route.request().url())
      const sourceUrl = `${productionBase}${pathname}${requested.search}`
      const response = await fetch(sourceUrl, { headers: { accept: 'application/json' }, cache: 'no-store' })
      await route.fulfill({
        status: response.status,
        contentType: response.headers.get('content-type') ?? 'application/json',
        body: await response.text(),
      })
    })
  }
}

async function waitForVisual(page) {
  await page.waitForFunction(() => document.querySelector('.history-page')?.dataset.historyVisualReady === 'true')
  await page.waitForSelector('#history-view-overview .history-trend-card')
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(size.scrollWidth <= size.innerWidth + 1, `${label}: horizontal overflow (${size.scrollWidth} > ${size.innerWidth}).`)
}

async function runDesktop(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } })
  await proxyProductionHistory(context)
  const page = await context.newPage()
  await page.goto(`${previewBase}/twitch/history/?period=30d&qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForVisual(page)
  assert(await page.locator('.history-streamer-card').count() > 0, 'Twitch desktop: Top streamers missing.')
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator('button[data-history-archive-view="daily"]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-history-day-card]').length > 0)
  assert(await page.locator('[data-history-day-card]').count() <= 9, 'Twitch desktop: Daily archive is not bounded.')
  await page.locator('button[data-history-view="report"]').click()
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-history-report-copy]')
    return button && !button.hasAttribute('disabled')
  })
  await assertNoOverflow(page, 'Twitch desktop')
  await page.screenshot({ path: resolve(out, 'twitch-desktop-hosted.png'), fullPage: true })
  await context.close()
}

async function runMobile(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await proxyProductionHistory(context)
  const page = await context.newPage()
  await page.goto(`${previewBase}/kick/history/?period=30d&qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForVisual(page)
  await page.locator('button[data-history-view="archives"]').click()
  await page.locator('button[data-history-archive-view="battles"]').click()
  await page.waitForFunction(() => document.querySelectorAll('[data-history-battle-day]').length > 0)
  assert(await page.locator('[data-history-battle-day]').count() <= 10, 'Kick mobile: Battle archive is not bounded.')
  await page.locator('button[data-history-view="report"]').click()
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-history-report-copy]')
    return button && !button.hasAttribute('disabled')
  })
  const actionHeights = await page.locator('.history-publish-actions button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
  assert(actionHeights.length > 0 && actionHeights.every((height) => height >= 48), 'Kick mobile: publishing touch target below 48px.')
  await assertNoOverflow(page, 'Kick mobile')
  await page.screenshot({ path: resolve(out, 'kick-mobile-hosted.png'), fullPage: true })
  await context.close()
}

try {
  await probePreviewFunction('/api/history', 'twitch')
  await probePreviewFunction('/api/kick-history', 'kick')
  await probeProductionApi('/api/history', 'twitch')
  await probeProductionApi('/api/kick-history', 'kick')
  const browser = await chromium.launch({ headless: true })
  try {
    await runDesktop(browser)
    await runMobile(browser)
  } finally {
    await browser.close()
  }
  console.log(`History H7 hosted Preview gate passed: frontend=${previewBase} retained-data=${productionBase}`)
} catch (error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error)
  writeFileSync(resolve(out, 'failure.txt'), message)
  console.error(message)
  process.exitCode = 1
}
