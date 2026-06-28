import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const origin = process.env.HISTORY_H7_ORIGIN || 'https://vl.badjoke-lab.com'
const out = resolve(process.env.HISTORY_H7_DIAGNOSTIC_DIR || 'artifacts/history-ui-h7-keyboard-diagnostic')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-history-ui-h7-keyboard-diagnostic-v1',
  origin,
  steps: [],
  result: 'running',
}

const record = async (page, step) => {
  const state = await page.evaluate(() => ({
    url: `${location.pathname}${location.search}${location.hash}`,
    activeTag: document.activeElement?.tagName ?? '',
    activeId: document.activeElement?.id ?? '',
    activeText: document.activeElement?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) ?? '',
    activeSkip: document.activeElement?.hasAttribute('data-history-skip-link') ?? false,
    selectedDay: document.querySelector('[data-history-day][aria-current="date"]')?.getAttribute('data-history-day') ?? '',
    keyboardDay: document.querySelector('[data-history-chart-keyboard-target]')?.getAttribute('data-history-keyboard-day') ?? '',
    keyboardConnected: Boolean(document.querySelector('[data-history-chart-keyboard-target]')),
    days: [...document.querySelectorAll('[data-history-day]')].slice(0, 3).map((node) => ({
      day: node.getAttribute('data-history-day'),
      hit: Boolean(node.querySelector('.history-bar-hit')),
    })),
  }))
  evidence.steps.push({ step, ...state })
  console.log(JSON.stringify({ step, ...state }))
}

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()
  await page.goto(`${origin}/twitch/history/?period=30d&metric=viewer_minutes&diagnostic=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  })
  await page.waitForFunction(() => {
    const root = document.querySelector('.history-page')
    return root?.getAttribute('data-history-p9h5-ready') === 'true'
      && document.querySelector('.history-stage')?.getAttribute('data-history-chart-ready') === 'true'
      && document.querySelector('[data-history-chart-keyboard-target]')
  }, null, { timeout: 30_000 })
  await record(page, 'ready')

  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1')
    document.body.focus()
  })
  await record(page, 'body-focus')
  await page.keyboard.press('Tab')
  await record(page, 'first-tab')
  await page.evaluate(() => document.body.removeAttribute('tabindex'))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await record(page, 'skip-enter')

  await page.locator('[data-history-chart-keyboard-target]').focus()
  await page.waitForTimeout(100)
  await record(page, 'chart-focus')
  await page.keyboard.press('Home')
  await page.waitForTimeout(1000)
  await record(page, 'chart-home')
  await page.locator('[data-history-chart-keyboard-target]').focus()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1000)
  await record(page, 'chart-arrow-right')

  await page.screenshot({ path: resolve(out, 'keyboard-diagnostic.png'), fullPage: true })
  evidence.result = 'pass'
  await context.close()
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.stack ?? error.message : String(error)
  throw error
} finally {
  writeFileSync(resolve(out, 'keyboard-diagnostic.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  await browser.close()
}
