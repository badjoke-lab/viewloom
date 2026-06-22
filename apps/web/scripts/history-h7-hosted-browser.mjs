import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = (process.env.HISTORY_H7_PREVIEW_URL ?? 'https://work-history-h7.viewloom.pages.dev').replace(/\/$/, '')
const out = resolve(process.env.HISTORY_H7_ARTIFACT_DIR ?? 'artifacts/history-h7-hosted')
mkdirSync(out, { recursive: true })

const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function probeApi(path, provider) {
  const url = `${base}${path}?period=30d&metric=viewer_minutes&qa=${Date.now()}`
  const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
  const text = await response.text()
  assert(response.ok, `${provider} Preview API returned ${response.status}: ${text.slice(0, 500)}`)
  let payload
  try { payload = JSON.parse(text) } catch { throw new Error(`${provider} Preview API did not return JSON.`) }
  assert(payload.platform === provider, `${provider} Preview API platform mismatch.`)
  assert(payload.source === 'real', `${provider} Preview API source is ${payload.source ?? 'missing'}, expected real.`)
  assert(['fresh', 'partial'].includes(payload.state), `${provider} Preview API state is ${payload.state ?? 'missing'}.`)
  const observedDays = Array.isArray(payload.daily)
    ? payload.daily.filter((day) => day && day.coverageState !== 'missing').length
    : 0
  assert(observedDays > 0, `${provider} Preview API has no retained observed day.`)
  assert(Array.isArray(payload.topStreamers) && payload.topStreamers.length > 0, `${provider} Preview API has no retained top streamers.`)
  console.log(`${provider} Preview API passed: source=${payload.source} state=${payload.state} observedDays=${observedDays} topStreamers=${payload.topStreamers.length}`)
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
  const page = await context.newPage()
  await page.goto(`${base}/twitch/history/?period=30d&qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
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
  const page = await context.newPage()
  await page.goto(`${base}/kick/history/?period=30d&qa=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
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
  await probeApi('/api/history', 'twitch')
  await probeApi('/api/kick-history', 'kick')
  const browser = await chromium.launch({ headless: true })
  try {
    await runDesktop(browser)
    await runMobile(browser)
  } finally {
    await browser.close()
  }
  console.log(`History H7 hosted Preview gate passed: ${base}`)
} catch (error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error)
  writeFileSync(resolve(out, 'failure.txt'), message)
  console.error(message)
  process.exitCode = 1
}
