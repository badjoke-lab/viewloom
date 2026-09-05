import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

import { kickMapKui3aScenarios } from '../src/features/kick-stream-map/kui3a-fixtures.mjs'

const origin = (process.env.KICK_MAP_PREVIEW_ORIGIN || 'http://127.0.0.1:4174').replace(/\/$/, '')
const outputRoot = '/tmp/kick-stream-map-preview-browser-audit'
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-kick-stream-map-kui3a-browser-audit-v1',
  origin,
  result: 'running',
  scenarios: [],
  violations: [],
}

try {
  for (const fixture of kickMapKui3aScenarios) {
    for (const viewport of viewports) {
      const scenario = await auditScenario(browser, fixture, viewport)
      evidence.scenarios.push(scenario)
      for (const violation of scenario.violations) {
        evidence.violations.push({ scenario: scenario.id, violation })
      }
    }
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  evidence.counts = {
    fixtures: kickMapKui3aScenarios.length,
    viewports: viewports.length,
    scenarios: evidence.scenarios.length,
    violations: evidence.violations.length,
  }
  await writeFile(`${outputRoot}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, counts: evidence.counts, violations: evidence.violations }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} finally {
  await browser.close()
}

async function auditScenario(browser, fixture, viewport) {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } })
  const page = await context.newPage()
  const apiRequests = []
  const consoleErrors = []
  const pageErrors = []

  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) apiRequests.push(`${url.pathname}${url.search}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.route('**/api/kick-stream-map*', async (route) => {
    await route.fulfill({
      status: fixture.httpStatus,
      contentType: 'application/json',
      body: JSON.stringify(fixture.payload),
    })
  })

  const response = await page.goto(`${origin}/preview/kick-stream-map/`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  })
  await page.waitForFunction(() => {
    const value = document.querySelector('[data-kick-preview-state]')?.textContent?.trim()
    return value && value !== 'Loading'
  }, { timeout: 20_000 })

  if (fixture.id === 'ready-mixed') {
    await page.locator('[data-kick-preview-map] .maplibregl-canvas').waitFor({ state: 'visible', timeout: 20_000 })
  }

  const facts = await readFacts(page)
  const violations = []

  if (response?.status() !== 200) violations.push(`preview route returned ${response?.status() ?? 'null'}`)
  if (facts.title !== 'Kick Stream Map Preview — ViewLoom') violations.push(`unexpected title: ${facts.title}`)
  if (facts.h1 !== 'Stream Map') violations.push(`unexpected h1: ${facts.h1}`)
  if (facts.robots !== 'noindex,nofollow') violations.push(`robots mismatch: ${facts.robots}`)
  if (facts.canonical !== null) violations.push(`preview canonical must be absent: ${facts.canonical}`)
  if (facts.publicKickMapLinks !== 0) violations.push(`public /kick/map/ link count ${facts.publicKickMapLinks}`)
  if (facts.overflow > 2) violations.push(`horizontal overflow ${facts.overflow}px`)
  if (facts.state !== fixture.expect.state) violations.push(`state ${facts.state} != ${fixture.expect.state}`)
  if (fixture.expect.gateHeading && facts.gateHeading !== fixture.expect.gateHeading) {
    violations.push(`gate heading ${facts.gateHeading} != ${fixture.expect.gateHeading}`)
  }
  if (facts.mapVisible !== fixture.expect.mapVisible) violations.push(`mapVisible ${facts.mapVisible} != ${fixture.expect.mapVisible}`)
  if (facts.resultsVisible !== fixture.expect.resultsVisible) violations.push(`resultsVisible ${facts.resultsVisible} != ${fixture.expect.resultsVisible}`)
  if (facts.markerCount !== 0) violations.push(`marker semantics present: ${facts.markerCount}`)
  if (apiRequests.some((request) => /twitch/i.test(request))) violations.push(`Twitch API request from Kick preview: ${apiRequests.join(', ')}`)
  if (pageErrors.length) violations.push(`page errors: ${pageErrors.join(' | ')}`)
  if (consoleErrors.length) violations.push(`console errors: ${consoleErrors.join(' | ')}`)

  if (fixture.id === 'ready-mixed') {
    if (facts.canvasCount !== 1) violations.push(`ready map canvas count ${facts.canvasCount}`)
    if (facts.metricDisabled) violations.push('ready metric remains disabled')
    if (facts.mappedCount !== fixture.expect.mappedStreams) violations.push(`mapped count ${facts.mappedCount}`)
    if (facts.excludedCount !== fixture.expect.excludedStreams) violations.push(`excluded count ${facts.excludedCount}`)
    if (facts.conflictCount !== fixture.expect.conflictStreams) violations.push(`conflict count ${facts.conflictCount}`)
    if (JSON.stringify(facts.countryCodes) !== JSON.stringify(fixture.expect.countryCodes)) {
      violations.push(`country codes ${JSON.stringify(facts.countryCodes)}`)
    }
    for (const target of facts.previewActionTargets) {
      if (target.height < 44) violations.push(`preview action target below 44px: ${target.name} ${target.height}px`)
    }

    const interaction = await exerciseReadyInteractions(page)
    if (!interaction.metricFocusVisible) violations.push('metric focus-visible treatment missing')
    if (!interaction.countryFocusVisible) violations.push('Country row focus-visible treatment missing')
    if (!interaction.worldFocusVisible) violations.push('World view focus-visible treatment missing')
    if (interaction.usHeading !== 'US mapped streams') violations.push(`US keyboard selection failed: ${interaction.usHeading}`)
    if (interaction.usStreamCount !== 2) violations.push(`US stream count ${interaction.usStreamCount}`)
    if (interaction.selectedMetric !== 'streams') violations.push(`metric change failed: ${interaction.selectedMetric}`)
    if (interaction.worldHeading !== 'Mapped streams') violations.push(`World reset failed: ${interaction.worldHeading}`)
    if (interaction.worldStreamCount !== 3) violations.push(`World stream count ${interaction.worldStreamCount}`)
  } else {
    if (!facts.metricDisabled) violations.push(`${fixture.id}: metric must remain disabled`)
    if (facts.canvasCount !== 0) violations.push(`${fixture.id}: hidden state must not create a map canvas`)
  }

  const screenshot = `${fixture.id}--${viewport.id}.png`
  await page.screenshot({ path: `${outputRoot}/${screenshot}`, fullPage: true })
  await context.close()

  return {
    id: `${fixture.id}--${viewport.id}`,
    fixture: fixture.id,
    viewport,
    status: response?.status() ?? null,
    facts,
    apiRequests,
    consoleErrors,
    pageErrors,
    violations,
    screenshot,
  }
}

async function readFacts(page) {
  return page.evaluate(() => {
    const visible = (selector) => {
      const node = document.querySelector(selector)
      if (!(node instanceof HTMLElement)) return false
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
    }
    const text = (selector) => document.querySelector(selector)?.textContent?.trim() ?? ''
    const count = (selector) => Number(text(selector).replace(/,/g, '')) || 0
    const targetRows = Array.from(document.querySelectorAll('[data-kick-preview-metric], [data-kick-preview-world], .kick-map-preview__country-row'))
      .filter((node) => node instanceof HTMLElement && !node.hidden && getComputedStyle(node).display !== 'none')
      .map((node) => {
        const rect = node.getBoundingClientRect()
        return {
          name: node.getAttribute('aria-label') || node.textContent?.trim() || node.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      })
    return {
      title: document.title,
      h1: text('h1'),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      publicKickMapLinks: document.querySelectorAll('a[href="/kick/map/"]').length,
      overflow: Math.max(0, document.body.scrollWidth - document.body.clientWidth),
      state: text('[data-kick-preview-state]'),
      gateHeading: text('[data-kick-preview-gate-heading]'),
      mapVisible: visible('[data-kick-preview-map]'),
      resultsVisible: visible('[data-kick-preview-country-results]'),
      metricDisabled: document.querySelector('[data-kick-preview-metric]')?.disabled ?? true,
      mappedCount: count('[data-kick-preview-mapped]'),
      excludedCount: count('[data-kick-preview-excluded]'),
      conflictCount: count('[data-kick-preview-conflicts]'),
      countryCodes: Array.from(document.querySelectorAll('.kick-map-preview__country-row[data-country-code]')).map((node) => node.getAttribute('data-country-code')),
      canvasCount: document.querySelectorAll('[data-kick-preview-map] .maplibregl-canvas').length,
      markerCount: document.querySelectorAll('[data-kick-preview-map] .maplibregl-marker').length,
      previewActionTargets: targetRows,
    }
  })
}

async function exerciseReadyInteractions(page) {
  const metric = page.locator('[data-kick-preview-metric]')
  await metric.focus()
  const metricFocusVisible = await hasVisibleFocus(page, '[data-kick-preview-metric]')
  await metric.selectOption('streams')
  const selectedMetric = await metric.inputValue()

  const us = page.locator('.kick-map-preview__country-row[data-country-code="US"]')
  await us.focus()
  const countryFocusVisible = await hasVisibleFocus(page, '.kick-map-preview__country-row[data-country-code="US"]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('[data-kick-preview-stream-heading]')?.textContent?.trim() === 'US mapped streams')
  const usHeading = await page.locator('[data-kick-preview-stream-heading]').textContent().then((value) => value?.trim() ?? '')
  const usStreamCount = await page.locator('[data-kick-preview-streams] .kick-map-preview__stream-row').count()

  const world = page.locator('[data-kick-preview-world]')
  await world.focus()
  const worldFocusVisible = await hasVisibleFocus(page, '[data-kick-preview-world]')
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('[data-kick-preview-stream-heading]')?.textContent?.trim() === 'Mapped streams')
  const worldHeading = await page.locator('[data-kick-preview-stream-heading]').textContent().then((value) => value?.trim() ?? '')
  const worldStreamCount = await page.locator('[data-kick-preview-streams] .kick-map-preview__stream-row').count()

  return {
    metricFocusVisible,
    countryFocusVisible,
    worldFocusVisible,
    selectedMetric,
    usHeading,
    usStreamCount,
    worldHeading,
    worldStreamCount,
  }
}

async function hasVisibleFocus(page, selector) {
  return page.locator(selector).evaluate((node) => {
    const style = getComputedStyle(node)
    const outlineWidth = Number.parseFloat(style.outlineWidth || '0')
    return document.activeElement === node && style.outlineStyle !== 'none' && outlineWidth > 0
  })
}
