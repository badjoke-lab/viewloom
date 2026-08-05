import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { chromium } from 'playwright'
import { historyPayload } from './history-battle-archive-fixture.mjs'

const baseUrl = (process.env.HISTORY_PRODUCTION_BASE_URL ?? 'https://www.viewloom.net').replace(/\/$/, '')
const artifactDir = resolve(process.env.HISTORY_PRODUCTION_ARTIFACT_DIR ?? 'artifacts/history-production-acceptance')
const maxAttempts = positiveInteger(process.env.HISTORY_PRODUCTION_MAX_ATTEMPTS, 20)
const retryMs = positiveInteger(process.env.HISTORY_PRODUCTION_RETRY_MS, 15_000)
const expectedMainSha = process.env.HISTORY_PRODUCTION_EXPECTED_MAIN_SHA ?? process.env.GITHUB_SHA ?? null

mkdirSync(artifactDir, { recursive: true })

const evidence = {
  schema: 'viewloom-history-production-acceptance-v1',
  baseUrl,
  expectedMainSha,
  startedAt: new Date().toISOString(),
  maxAttempts,
  retryMs,
  attempts: [],
  result: 'running',
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function saveEvidence() {
  writeFileSync(
    resolve(artifactDir, 'history-production-acceptance.json'),
    `${JSON.stringify(evidence, null, 2)}\n`,
  )
}

async function installFixtureRoutes(context, calls) {
  const fulfill = async (route, provider) => {
    calls[provider] += 1
    const url = new URL(route.request().url())
    const payload = historyPayload(provider)
    payload.metric = url.searchParams.get('metric') === 'peak_viewers'
      ? 'peak_viewers'
      : 'viewer_minutes'
    payload.period = {
      ...payload.period,
      to: '2026-06-18',
      days: 13,
      label: 'Production acceptance fixture range',
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    })
  }

  await context.route('**/api/kick-history*', (route) => fulfill(route, 'kick'))
  await context.route('**/api/history*', (route) => fulfill(route, 'twitch'))
}

async function installBrowserFakes(context) {
  await context.addInitScript(() => {
    window.__viewloomCopiedText = ''
    window.__viewloomSharedData = null

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__viewloomCopiedText = String(text)
        },
      },
    })

    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data) => {
        window.__viewloomSharedData = {
          title: typeof data?.title === 'string' ? data.title : '',
          text: typeof data?.text === 'string' ? data.text : '',
          url: typeof data?.url === 'string' ? data.url : '',
        }
      },
    })
  })
}

async function waitForWorkspace(page) {
  await page.waitForFunction(() => {
    const pageRoot = document.querySelector('.history-page')
    const workspace = document.querySelector('[data-history-report][data-history-share][data-history-export]')
    const copy = document.querySelector('[data-history-report-copy]')
    const nativeShare = document.querySelector('[data-history-report-share-native]')
    const png = document.querySelector('[data-history-share-download]')
    const csv = document.querySelector('[data-history-export-csv]')
    const json = document.querySelector('[data-history-export-json]')
    return pageRoot?.getAttribute('data-history-view') === 'report'
      && workspace
      && copy instanceof HTMLButtonElement && !copy.disabled
      && nativeShare instanceof HTMLButtonElement && !nativeShare.hidden && !nativeShare.disabled
      && png instanceof HTMLButtonElement && !png.disabled
      && csv instanceof HTMLButtonElement && !csv.disabled
      && json instanceof HTMLButtonElement && !json.disabled
  }, null, { timeout: 20_000 })
}

async function waitForModeAndFocus(page, mode) {
  await page.waitForFunction((expectedMode) => {
    const button = document.querySelector(`[data-history-report-mode="${expectedMode}"]`)
    return button?.getAttribute('aria-pressed') === 'true'
      && document.activeElement === button
      && document.querySelector('[data-history-report]')?.getAttribute('data-history-report-active-mode') === expectedMode
  }, mode, { timeout: 10_000 })
}

async function checkScenario(browser, attempt, scenario) {
  const { provider, viewport, isMobile = false, hasTouch = false } = scenario
  const providerLabel = provider === 'kick' ? 'Kick' : 'Twitch'
  const other = provider === 'kick' ? 'twitch' : 'kick'
  const calls = { twitch: 0, kick: 0 }
  const context = await browser.newContext({
    viewport,
    isMobile,
    hasTouch,
    extraHTTPHeaders: {
      'cache-control': 'no-cache',
      pragma: 'no-cache',
    },
  })
  await installBrowserFakes(context)
  await installFixtureRoutes(context, calls)

  const page = await context.newPage()
  const cacheBuster = `${Date.now()}-${attempt}-${provider}`
  const url = `${baseUrl}/${provider}/history/?view=report&period=30d&metric=viewer_minutes&production_acceptance=${cacheBuster}`
  const result = {
    provider,
    viewport,
    url,
    calls,
    checkpoints: [],
    result: 'running',
  }

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    assert(response, `${provider}: production navigation returned no response.`)
    assert.equal(response.status(), 200, `${provider}: production History returned HTTP ${response.status()}.`)
    result.checkpoints.push({ name: 'navigation', status: response.status() })

    await waitForWorkspace(page)
    const initialCalls = calls[provider]
    assert.equal(initialCalls, 1, `${provider}: expected exactly one initial provider History request, got ${initialCalls}.`)
    assert.equal(calls[other], 0, `${provider}: production page called the other provider endpoint.`)

    const semantics = await page.evaluate(() => {
      const statusSelectors = [
        '[data-history-report-status]',
        '[data-history-share-status]',
        '[data-history-export-status]',
      ]
      const descriptionChecks = [
        ['[data-history-report-copy]', 'history-report-status'],
        ['[data-history-report-share-native]', 'history-report-status'],
        ['[data-history-share-toggle]', 'history-share-status'],
        ['[data-history-share-download]', 'history-share-status'],
        ['[data-history-export-csv]', 'history-export-status'],
        ['[data-history-export-json]', 'history-export-status'],
      ]
      return {
        statuses: statusSelectors.map((selector) => {
          const node = document.querySelector(selector)
          return {
            selector,
            role: node?.getAttribute('role'),
            live: node?.getAttribute('aria-live'),
            atomic: node?.getAttribute('aria-atomic'),
          }
        }),
        descriptions: descriptionChecks.map(([selector, expected]) => ({
          selector,
          expected,
          actual: document.querySelector(selector)?.getAttribute('aria-describedby'),
        })),
        modes: Array.from(document.querySelectorAll('[data-history-report-mode]')).map((node) => ({
          mode: node.getAttribute('data-history-report-mode'),
          controls: node.getAttribute('aria-controls'),
        })),
        previewLabel: document.querySelector('[data-history-report-preview]')?.getAttribute('aria-label'),
      }
    })
    assert(
      semantics.statuses.every(({ role, live, atomic }) => role === 'status' && live === 'polite' && atomic === 'true'),
      `${provider}: production status live-region semantics are incomplete: ${JSON.stringify(semantics.statuses)}.`,
    )
    assert(
      semantics.descriptions.every(({ expected, actual }) => expected === actual),
      `${provider}: production action/status associations are incomplete: ${JSON.stringify(semantics.descriptions)}.`,
    )
    assert(
      semantics.modes.length === 2 && semantics.modes.every(({ controls }) => controls === 'history-report-preview'),
      `${provider}: production report modes do not control the preview.`,
    )
    assert.equal(semantics.previewLabel, 'Full report preview', `${provider}: production preview did not start in Full report mode.`)
    result.checkpoints.push({ name: 'semantics', value: semantics })

    const fullMode = page.locator('[data-history-report-mode="report"]')
    await fullMode.focus()
    await page.keyboard.press('ArrowRight')
    await waitForModeAndFocus(page, 'post')

    const postState = await page.evaluate(() => ({
      previewLabel: document.querySelector('[data-history-report-preview]')?.getAttribute('aria-label'),
      copyLabel: document.querySelector('[data-history-report-copy]')?.textContent?.trim(),
      shareLabel: document.querySelector('[data-history-report-share-native]')?.textContent?.trim(),
      previewText: document.querySelector('[data-history-report-preview]')?.textContent ?? '',
    }))
    assert.equal(postState.previewLabel, 'Short post preview', `${provider}: production keyboard mode switch did not rename the preview.`)
    assert.equal(postState.copyLabel, 'Copy short post', `${provider}: production Copy label did not follow Short post mode.`)
    assert.equal(postState.shareLabel, 'Share short post', `${provider}: production native Share label did not follow Short post mode.`)
    assert(postState.previewText.startsWith(`ViewLoom | ${providerLabel} History snapshot`), `${provider}: production Short post text is incorrect.`)
    result.checkpoints.push({ name: 'short-post-mode', value: postState })

    await page.locator('[data-history-report-copy]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Short post copied.')
    const copied = await page.evaluate(() => window.__viewloomCopiedText)
    assert.equal(copied, postState.previewText, `${provider}: production copied text differs from the visible Short post.`)

    await page.locator('[data-history-report-share-native]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-report-status]')?.textContent === 'Share completed.')
    const shared = await page.evaluate(() => window.__viewloomSharedData)
    assert.equal(shared?.title, `ViewLoom — ${providerLabel} History & Trends`, `${provider}: production native-share title is incorrect.`)
    assert.equal(shared?.text, postState.previewText, `${provider}: production native-share text differs from the visible Short post.`)
    result.checkpoints.push({ name: 'copy-share', copiedLength: copied.length, shared })

    await page.locator('[data-history-report-mode="report"]').click()
    await page.waitForFunction(() => document.querySelector('[data-history-report-preview]')?.getAttribute('aria-label') === 'Full report preview')

    const shareToggle = page.locator('[data-history-share-toggle]')
    await shareToggle.click()
    await page.waitForFunction(() => document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered') === 'true')
    const card = await page.evaluate(() => {
      const canvas = document.querySelector('[data-history-share-card]')
      return {
        role: canvas?.getAttribute('role'),
        tabIndex: canvas instanceof HTMLElement ? canvas.tabIndex : null,
        label: canvas?.getAttribute('aria-label') ?? '',
        fallback: canvas?.textContent ?? '',
      }
    })
    assert.equal(card.role, 'img', `${provider}: production share card does not expose image semantics.`)
    assert.equal(card.tabIndex, 0, `${provider}: production share card is not keyboard-focusable.`)
    assert(card.label.includes(`ViewLoom ${providerLabel} History share card.`), `${provider}: production share-card provider description is missing.`)
    assert(card.label.includes('Coverage 12 of 13 days'), `${provider}: production share-card coverage description is missing.`)
    assert(card.label.includes('Observed ViewLoom data, not provider-wide.'), `${provider}: production share-card limitation is missing.`)
    assert.equal(card.fallback, card.label, `${provider}: production share-card fallback differs from its accessible label.`)

    await page.locator('[data-history-share-card]').focus()
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.querySelector('[data-history-share-toggle]')?.getAttribute('aria-expanded') === 'false'
      && document.activeElement?.hasAttribute('data-history-share-toggle'))
    result.checkpoints.push({ name: 'share-card', value: card })

    assert.equal(calls[provider], initialCalls, `${provider}: output actions added a production History API request.`)
    assert.equal(calls[other], 0, `${provider}: output actions crossed provider endpoints.`)

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    assert(dimensions.scrollWidth <= dimensions.innerWidth + 1, `${provider}: production History introduced horizontal overflow: ${JSON.stringify(dimensions)}.`)
    result.checkpoints.push({ name: 'dimensions', value: dimensions })

    await page.screenshot({
      path: resolve(artifactDir, `history-production-${provider}-attempt-${attempt}.png`),
      fullPage: true,
    })
    result.result = 'pass'
    return result
  } catch (error) {
    result.result = 'fail'
    result.error = error instanceof Error ? error.message : String(error)
    try {
      result.failureDom = await page.evaluate(() => ({
        pathname: location.pathname,
        title: document.title,
        activeMode: document.querySelector('[data-history-report]')?.getAttribute('data-history-report-active-mode'),
        previewLabel: document.querySelector('[data-history-report-preview]')?.getAttribute('aria-label'),
        copyLabel: document.querySelector('[data-history-report-copy]')?.textContent?.trim(),
        shareLabel: document.querySelector('[data-history-report-share-native]')?.textContent?.trim(),
        reportStatus: document.querySelector('[data-history-report-status]')?.textContent,
        shareStatus: document.querySelector('[data-history-share-status]')?.textContent,
        exportStatus: document.querySelector('[data-history-export-status]')?.textContent,
        shareRendered: document.querySelector('[data-history-share-card]')?.getAttribute('data-share-rendered'),
      }))
      await page.screenshot({
        path: resolve(artifactDir, `history-production-${provider}-attempt-${attempt}-failure.png`),
        fullPage: true,
      })
    } catch {
      // Preserve the primary failure even when the browser page is no longer readable.
    }
    throw Object.assign(error instanceof Error ? error : new Error(String(error)), { scenarioResult: result })
  } finally {
    await context.close()
  }
}

async function runAttempt(browser, attempt) {
  const record = {
    attempt,
    startedAt: new Date().toISOString(),
    scenarios: [],
    result: 'running',
  }
  evidence.attempts.push(record)
  saveEvidence()

  try {
    record.scenarios.push(await checkScenario(browser, attempt, {
      provider: 'twitch',
      viewport: { width: 1440, height: 1100 },
    }))
    record.scenarios.push(await checkScenario(browser, attempt, {
      provider: 'kick',
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }))
    record.result = 'pass'
    record.finishedAt = new Date().toISOString()
    saveEvidence()
    return true
  } catch (error) {
    if (error?.scenarioResult) record.scenarios.push(error.scenarioResult)
    record.result = 'fail'
    record.error = error instanceof Error ? error.message : String(error)
    record.finishedAt = new Date().toISOString()
    saveEvidence()
    return false
  }
}

const browser = await chromium.launch({ headless: true })
try {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (await runAttempt(browser, attempt)) {
      evidence.result = 'pass'
      evidence.finishedAt = new Date().toISOString()
      saveEvidence()
      console.log(`History production acceptance passed on attempt ${attempt}.`)
      process.exitCode = 0
      break
    }

    if (attempt < maxAttempts) {
      console.log(`History production acceptance attempt ${attempt} failed; retrying after ${retryMs}ms.`)
      await sleep(retryMs)
    } else {
      evidence.result = 'fail'
      evidence.finishedAt = new Date().toISOString()
      saveEvidence()
      throw new Error(`History production acceptance failed after ${maxAttempts} attempts.`)
    }
  }
} finally {
  await browser.close()
}
