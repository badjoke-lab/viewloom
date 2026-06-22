import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { assert, assertNoRefetch, assertShared, installRoutes, waitForVisual } from './history-visual-responsive-browser-support.mjs'

const base = process.env.HISTORY_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.HISTORY_VISUAL_ARTIFACT_DIR ?? 'artifacts/history-visual-responsive')
mkdirSync(out, { recursive: true })

async function run(browser, test) {
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({
    viewport: test.size,
    isMobile: test.viewport === 'mobile',
    reducedMotion: test.reduce ? 'reduce' : 'no-preference',
  })
  await installRoutes(context, calls)
  const page = await context.newPage()
  await page.goto(`${base}/${test.provider}/history/${test.query}`, { waitUntil: 'domcontentloaded' })
  await waitForVisual(page)
  assert(calls[test.provider] > 0, `${test.label}: provider endpoint not requested.`)
  await test.wait(page)
  await assertShared(page, test.label, test.viewport, test.viewport === 'mobile' ? 14 : 13)
  const before = calls[test.provider]
  await test.interact(page)
  assertNoRefetch(calls, test.provider, before, test.label)
  await assertShared(page, test.label, test.viewport, test.viewport === 'mobile' ? 14 : 13)
  await page.screenshot({ path: resolve(out, test.file), fullPage: true })
  await context.close()
}

const tests = [
  {
    label: 'Twitch desktop Overview', provider: 'twitch', viewport: 'desktop',
    size: { width: 1440, height: 1100 }, query: '?period=30d', file: 'twitch-desktop-overview.png',
    wait: (page) => page.waitForSelector('#history-view-overview .history-trend-card'),
    interact: async (page) => {
      const widths = await page.evaluate(() => ({
        chart: document.querySelector('#history-view-overview .history-trend-card')?.getBoundingClientRect().width ?? 0,
        inspector: document.querySelector('#history-view-overview .history-selected-day')?.getBoundingClientRect().width ?? 1,
      }))
      assert(widths.chart > widths.inspector * 1.8, 'Twitch desktop Overview: chart is not dominant.')
    },
  },
  {
    label: 'Kick desktop Archives', provider: 'kick', viewport: 'desktop',
    size: { width: 1280, height: 960 }, query: '?view=archives&archive=battles&period=30d', file: 'kick-desktop-archives.png',
    wait: (page) => page.waitForFunction(() => document.querySelectorAll('[data-history-battle-day]').length === 10),
    interact: async (page) => {
      await page.locator('button[data-history-archive-view="peaks"]').click()
      await page.locator('button[data-history-archive-view="battles"]').click()
      assert(await page.locator('[data-history-battle-featured="true"]').count() === 1, 'Kick desktop Archives: featured Battle missing.')
    },
  },
  {
    label: 'Twitch tablet Report', provider: 'twitch', viewport: 'tablet', reduce: true,
    size: { width: 900, height: 1100 }, query: '?view=report&period=30d', file: 'twitch-tablet-report.png',
    wait: (page) => page.waitForFunction(() => {
      const button = document.querySelector('[data-history-report-copy]')
      return button && !button.hasAttribute('disabled')
    }),
    interact: async (page) => {
      const columns = await page.locator('.history-publish-actions').evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)
      assert(columns === 2, 'Twitch tablet Report: expected two action columns.')
      const duration = await page.locator('[data-history-report-mode="post"]').evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration) || 0)
      assert(duration <= .001, 'Twitch tablet Report: reduced motion failed.')
      await page.locator('[data-history-share-toggle]').click()
      await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.dataset.shareRendered === 'true')
    },
  },
  {
    label: 'Kick mobile cross-view', provider: 'kick', viewport: 'mobile',
    size: { width: 390, height: 844 }, query: '?period=30d', file: 'kick-mobile-cross-view.png',
    wait: (page) => page.waitForSelector('#history-view-overview .history-trend-card'),
    interact: async (page) => {
      await page.locator('button[data-history-view="archives"]').click()
      await page.locator('button[data-history-archive-view="daily"]').click()
      await page.locator('button[data-history-view="report"]').click()
      await page.waitForFunction(() => {
        const button = document.querySelector('[data-history-report-copy]')
        return button && !button.hasAttribute('disabled')
      })
      const heights = await page.locator('.history-publish-actions button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height))
      assert(heights.every((height) => height >= 48), 'Kick mobile cross-view: touch target below 48px.')
      await page.locator('button[data-history-view="overview"]').click()
    },
  },
]

const browser = await chromium.launch({ headless: true })
try {
  for (const test of tests) await run(browser, test)
  console.log('History H5 browser gate passed: Twitch desktop Overview, Kick desktop Archives, Twitch tablet Report, Kick mobile cross-view, focus ring, reduced motion, no repeated History API request, and no horizontal overflow.')
} finally {
  await browser.close()
}
