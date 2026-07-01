import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const base = process.env.QUALITY_U10F_BASE_URL ?? 'http://127.0.0.1:4173'
const out = resolve(process.env.QUALITY_U10F_ARTIFACT_DIR ?? 'artifacts/quality-u10f')
mkdirSync(out, { recursive: true })

const evidence = {
  schema: 'viewloom-quality-u10f-readiness-browser-v1',
  phase: 'U10F',
  candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null,
  checkpoint: 'start',
  scenarios: [],
  result: 'running',
}

const viewports = [
  { width: 1440, height: 1000, touch: false },
  { width: 820, height: 1000, touch: false },
  { width: 390, height: 844, touch: true },
  { width: 360, height: 800, touch: true },
]

async function installRoutes(context, calls) {
  await context.route('**/api/history?**', (route) => {
    calls.twitchHistory += 1
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"message":"unexpected Twitch History request"}}' })
  })
  await context.route('**/api/kick-history?**', (route) => {
    calls.kickHistory += 1
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":{"message":"unexpected Kick History request"}}' })
  })
  await context.route('**/api/twitch-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
  await context.route('**/api/kick-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
}

async function runScenario(browser, provider, viewport) {
  const id = `${provider}-${viewport.width}`
  const calls = { twitchHistory: 0, kickHistory: 0 }
  evidence.checkpoint = `${id}:context`
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.touch,
    hasTouch: viewport.touch,
  })
  await installRoutes(context, calls)
  const page = await context.newPage()
  evidence.checkpoint = `${id}:navigate`
  await page.goto(`${base}/${provider}/channel/?period=90d&view=invalid&day=June-20`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.dataset.channelEntry === 'missing-id'
    && document.querySelector('[data-channel-state]')?.textContent?.trim() === 'Missing Channel')

  evidence.checkpoint = `${id}:snapshot`
  const state = await page.evaluate(() => {
    const isVisible = (node) => {
      if (!(node instanceof HTMLElement || node instanceof SVGElement)) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0
    }
    const entry = document.querySelector('[data-channel-missing-entry]')
    const action = document.querySelector('[data-channel-missing-action]')
    if (action instanceof HTMLElement) action.focus()
    const actionStyle = action ? getComputedStyle(action) : null
    const actionRect = action?.getBoundingClientRect()
    const requiresId = [...document.querySelectorAll('[data-channel-requires-id]')]
    const nestedControls = [...document.querySelectorAll('[data-channel-requires-id] a, [data-channel-requires-id] button, [data-channel-requires-id] input, [data-channel-requires-id] select, [data-channel-requires-id] textarea')]
    return {
      url: `${location.pathname}${location.search}${location.hash}`,
      entryMode: document.body.dataset.channelEntry ?? '',
      h1: document.querySelector('[data-channel-name]')?.textContent?.trim() ?? '',
      feedback: document.querySelector('[data-channel-feedback]')?.textContent?.trim() ?? '',
      missingVisible: entry ? isVisible(entry) : false,
      missingActionCount: entry?.querySelectorAll('a, button, input, select, textarea').length ?? 0,
      actionHref: action?.getAttribute('href') ?? '',
      actionName: action?.textContent?.trim() ?? '',
      actionHeight: actionRect?.height ?? 0,
      actionFocused: document.activeElement === action,
      actionOutlineStyle: actionStyle?.outlineStyle ?? '',
      actionOutlineWidth: actionStyle?.outlineWidth ?? '',
      visibleRequiresId: requiresId.filter(isVisible).length,
      focusableRequiresId: nestedControls.filter(isVisible).length,
      inertRequiresId: requiresId.filter((node) => node.hasAttribute('inert')).length,
      requiresIdCount: requiresId.length,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: innerWidth,
    }
  })

  const expectedHref = `/${provider}/history/`
  const providerName = provider === 'kick' ? 'Kick' : 'Twitch'
  assert.equal(calls.twitchHistory, 0, `${id}: Twitch History request occurred`)
  assert.equal(calls.kickHistory, 0, `${id}: Kick History request occurred`)
  assert.equal(state.entryMode, 'missing-id', `${id}: missing-id mode not owned`)
  assert.equal(state.h1, 'Channel not selected', `${id}: missing-id heading changed`)
  assert.ok(state.feedback.includes(providerName), `${id}: provider-safe feedback missing`)
  assert.equal(state.missingVisible, true, `${id}: missing-id task is not visible`)
  assert.equal(state.missingActionCount, 1, `${id}: missing-id task must expose one action`)
  assert.equal(state.actionHref, expectedHref, `${id}: missing-id action crossed provider or route`)
  assert.equal(state.actionName, `Open ${providerName} History`, `${id}: missing-id action name changed`)
  assert.ok(state.actionHeight >= 48, `${id}: primary action is ${state.actionHeight}px`)
  assert.equal(state.actionFocused, true, `${id}: primary action could not receive focus`)
  assert.notEqual(state.actionOutlineStyle, 'none', `${id}: primary action focus outline missing`)
  assert.notEqual(state.actionOutlineWidth, '0px', `${id}: primary action focus outline width is zero`)
  assert.equal(state.visibleRequiresId, 0, `${id}: irrelevant Channel regions remain visible`)
  assert.equal(state.focusableRequiresId, 0, `${id}: irrelevant Channel controls remain focusable`)
  assert.equal(state.inertRequiresId, state.requiresIdCount, `${id}: hidden Channel regions are not inert`)
  assert.ok(state.horizontalOverflow <= 2, `${id}: page horizontal overflow ${state.horizontalOverflow}px`)
  const url = new URL(`${base}${state.url}`)
  for (const key of ['period', 'view', 'day', 'id', 'name']) assert.equal(url.searchParams.has(key), false, `${id}: invalid ${key} state remained in URL`)

  evidence.checkpoint = `${id}:screenshot`
  await page.screenshot({ path: resolve(out, `${id}.png`), fullPage: true })
  evidence.scenarios.push({ id, provider, ...viewport, calls, state })
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  for (const provider of ['twitch', 'kick']) {
    for (const viewport of viewports) await runScenario(browser, provider, viewport)
  }
  assert.equal(evidence.scenarios.length, 8)
  evidence.result = 'pass'
  evidence.checkpoint = 'complete'
  writeFileSync(resolve(out, 'quality-u10f-readiness-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  console.log('U10F readiness browser acceptance passed: 8 provider and viewport scenarios.')
} catch (error) {
  evidence.result = 'fail'
  evidence.error = `${evidence.checkpoint}: ${error instanceof Error ? error.message : String(error)}`
  writeFileSync(resolve(out, 'quality-u10f-readiness-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
