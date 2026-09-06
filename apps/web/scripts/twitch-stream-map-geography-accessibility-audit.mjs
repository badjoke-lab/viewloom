import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.PUBLIC_CURRENT_LOCAL_ORIGIN || 'http://127.0.0.1:4173').replace(/\/$/, '')
const outputRoot = '/tmp/public-current-browser-audit'
const outputPath = `${outputRoot}/twitch-stream-map-geography-accessibility.json`
const viewports = [
  { id: 'desktop-1440', width: 1440, height: 1000 },
  { id: 'mobile-390', width: 390, height: 844 },
]
const startModes = ['country', 'city']

await mkdir(outputRoot, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-twitch-stream-map-geography-accessibility-v2',
  origin,
  result: 'running',
  scenarios: [],
  violations: [],
}

try {
  for (const viewport of viewports) {
    for (const startMode of startModes) {
      const scenario = await auditScenario(browser, viewport, startMode)
      evidence.scenarios.push(scenario)
      for (const violation of scenario.violations) {
        evidence.violations.push({ scenario: scenario.id, violation })
      }
    }
  }
  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
} finally {
  await browser.close()
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
}

assert.equal(evidence.scenarios.length, 4, 'expected 2 viewports x 2 geography modes')
assert.equal(evidence.violations.length, 0, JSON.stringify(evidence.violations))
assert.equal(evidence.result, 'pass')
console.log(JSON.stringify({ result: evidence.result, scenarios: evidence.scenarios.length, violations: evidence.violations.length }, null, 2))

async function auditScenario(browser, viewport, startMode) {
  const id = `${startMode}--${viewport.id}`
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  const violations = []

  await page.route('**/api/twitch-stream-map**', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'not_ready', fixture: true }),
    })
  })

  try {
    const initialUrl = startMode === 'city'
      ? `${origin}/twitch/map/?geography=city&accessibility-audit=${encodeURIComponent(id)}`
      : `${origin}/twitch/map/?accessibility-audit=${encodeURIComponent(id)}`
    await page.goto(initialUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await waitForModeEnhancements(page, startMode)

    const initial = await readGeographyState(page)
    expect(initial.country.height >= 44, `${id}: Country target height ${initial.country.height}px`, violations)
    expect(initial.city.height >= 44, `${id}: City target height ${initial.city.height}px`, violations)
    expect(initial.current.height >= 44, `${id}: Current / IRL target height ${initial.current.height}px`, violations)
    expect(initial.current.disabled, `${id}: Current / IRL must remain disabled`, violations)
    expect(initial.current.ariaDisabled === 'true', `${id}: Current / IRL must remain aria-disabled`, violations)
    expect(initial.country.ariaPressed === String(startMode === 'country'), `${id}: Country aria-pressed mismatch`, violations)
    expect(initial.city.ariaPressed === String(startMode === 'city'), `${id}: City aria-pressed mismatch`, violations)
    if (viewport.width === 390) expect(initial.overflow <= 2, `${id}: horizontal overflow ${initial.overflow}px`, violations)
    if (startMode === 'city') {
      expect(initial.currentLocationInputDisabled, `${id}: City current_location filter must remain disabled`, violations)
    }

    let initialCountryUi = null
    let mobileTargets = []
    let metricKeyboard = null
    if (startMode === 'country') {
      initialCountryUi = await readCountryUiState(page)
      verifyCountryUiState(initialCountryUi, id, violations)
      metricKeyboard = await exerciseMetricKeyboard(page, id, violations)
      if (viewport.width === 390) {
        mobileTargets = await readMobileCountryTargets(page)
        for (const target of mobileTargets.filter((item) => item.height < 44)) {
          violations.push(`${id}: mobile target below 44px: ${target.name} ${target.height}px`)
        }
      }
    }

    const switchLabel = startMode === 'country' ? 'City' : 'Country'
    const focus = await keyboardFocusButton(page, switchLabel)
    expect(focus.reached, `${id}: keyboard focus did not reach ${switchLabel}`, violations)
    expect(focus.focusVisible, `${id}: ${switchLabel} is not :focus-visible under keyboard focus`, violations)
    expect(focus.visualIndicator, `${id}: ${switchLabel} has no visible focus indicator`, violations)

    if (focus.reached) {
      await Promise.all([
        page.waitForURL((next) => startMode === 'country'
          ? next.searchParams.get('geography') === 'city'
          : !next.searchParams.has('geography'), { timeout: 15_000 }),
        page.keyboard.press('Enter'),
      ])
    }

    const expectedMode = startMode === 'country' ? 'city' : 'country'
    await waitForModeEnhancements(page, expectedMode)
    const switched = await readGeographyState(page)
    expect(switched.country.ariaPressed === String(expectedMode === 'country'), `${id}: switched Country aria-pressed mismatch`, violations)
    expect(switched.city.ariaPressed === String(expectedMode === 'city'), `${id}: switched City aria-pressed mismatch`, violations)
    expect(switched.current.disabled, `${id}: switched Current / IRL must remain disabled`, violations)
    if (viewport.width === 390) expect(switched.overflow <= 2, `${id}: switched horizontal overflow ${switched.overflow}px`, violations)

    let switchedCountryUi = null
    if (expectedMode === 'country') {
      switchedCountryUi = await readCountryUiState(page)
      verifyCountryUiState(switchedCountryUi, `${id}: switched`, violations)
    }

    await page.screenshot({ path: `${outputRoot}/twitch-stream-map-geography-${id}.png`, fullPage: true })

    return { id, viewport, startMode, initial, initialCountryUi, mobileTargets, metricKeyboard, focus, switched, switchedCountryUi, violations }
  } catch (error) {
    violations.push(error instanceof Error ? error.message : String(error))
    await page.screenshot({ path: `${outputRoot}/twitch-stream-map-geography-${id}-failure.png`, fullPage: true }).catch(() => {})
    return { id, viewport, startMode, violations }
  } finally {
    await context.close()
  }
}

async function waitForModeEnhancements(page, mode) {
  await page.locator('[data-stream-map-geography-panel]').waitFor({ timeout: 15_000 })
  if (mode === 'country') {
    await page.locator('html.stream-map-country-ui-v2').waitFor({ state: 'attached', timeout: 15_000 })
    await page.locator('[data-stream-map-region-controls][data-country-ui-v2="true"]').waitFor({ timeout: 15_000 })
    await page.locator('.stream-map-country-legend[role="img"]').waitFor({ timeout: 15_000 })
  } else {
    await page.locator('html.stream-map-city-mode').waitFor({ state: 'attached', timeout: 15_000 }).catch(() => {})
  }
}

async function readGeographyState(page) {
  return page.evaluate(() => {
    const byMode = (mode) => document.querySelector(`[data-geography-mode="${mode}"]`)
    const current = [...document.querySelectorAll('.stream-map-geography-options button')]
      .find((button) => (button.textContent || '').trim() === 'Current / IRL')
    const measure = (button) => {
      const rect = button?.getBoundingClientRect()
      return {
        height: rect ? Math.round(rect.height) : 0,
        width: rect ? Math.round(rect.width) : 0,
        ariaPressed: button?.getAttribute('aria-pressed') ?? null,
        ariaDisabled: button?.getAttribute('aria-disabled') ?? null,
        disabled: Boolean(button?.disabled),
      }
    }
    const body = document.body
    return {
      country: measure(byMode('country')),
      city: measure(byMode('city')),
      current: measure(current),
      currentLocationInputDisabled: Boolean(document.querySelector('[data-location-type][value="current_location"]')?.disabled),
      overflow: Math.max(0, body.scrollWidth - body.clientWidth),
      href: location.href,
      countryUiV2: document.documentElement.classList.contains('stream-map-country-ui-v2'),
    }
  })
}

async function readCountryUiState(page) {
  return page.evaluate(() => {
    const controls = document.querySelector('[data-stream-map-region-controls]')
    const select = controls?.querySelector('.stream-map-region-controls__native-select')
    const legend = controls?.querySelector('.stream-map-country-legend')
    const metricButtons = [...(controls?.querySelectorAll('.stream-map-metric-toggle button') ?? [])].map((button) => {
      const rect = button.getBoundingClientRect()
      return {
        name: (button.textContent || '').trim(),
        height: Math.round(rect.height),
        ariaPressed: button.getAttribute('aria-pressed'),
      }
    })
    const world = controls?.querySelector('.stream-map-world-view')
    const worldRect = world?.getBoundingClientRect()
    return {
      controlsRole: controls?.getAttribute('role') ?? null,
      controlsLabel: controls?.getAttribute('aria-label') ?? null,
      nativeSelectHidden: Boolean(select?.hidden),
      nativeSelectTabIndex: select instanceof HTMLElement ? select.tabIndex : null,
      legendRole: legend?.getAttribute('role') ?? null,
      legendLabel: legend?.getAttribute('aria-label') ?? null,
      legendSwatches: legend?.querySelectorAll('i').length ?? 0,
      metricButtons,
      worldHeight: worldRect ? Math.round(worldRect.height) : 0,
    }
  })
}

function verifyCountryUiState(state, id, violations) {
  expect(state.controlsRole === 'group', `${id}: Country region controls must expose role=group`, violations)
  expect(state.controlsLabel === 'Country region controls', `${id}: Country region controls label mismatch`, violations)
  expect(state.nativeSelectHidden, `${id}: replaced native intensity select must be hidden from duplicate interaction`, violations)
  expect(state.legendRole === 'img', `${id}: intensity legend must expose role=img`, violations)
  expect(/Streams intensity legend: five log-scaled steps from Low to High/.test(state.legendLabel || ''), `${id}: Streams legend accessible label mismatch: ${state.legendLabel}`, violations)
  expect(state.legendSwatches === 5, `${id}: expected five intensity legend swatches, got ${state.legendSwatches}`, violations)
  expect(state.metricButtons.length === 2, `${id}: expected two intensity metric buttons`, violations)
  for (const button of state.metricButtons) expect(button.height >= 44, `${id}: ${button.name} metric target ${button.height}px`, violations)
  expect(state.worldHeight >= 44, `${id}: World view target ${state.worldHeight}px`, violations)
}

async function exerciseMetricKeyboard(page, id, violations) {
  const focus = await keyboardFocusButton(page, 'Viewers')
  expect(focus.reached, `${id}: keyboard focus did not reach Viewers intensity button`, violations)
  expect(focus.focusVisible, `${id}: Viewers intensity button is not :focus-visible`, violations)
  expect(focus.visualIndicator, `${id}: Viewers intensity button has no visible focus indicator`, violations)
  if (!focus.reached) return { focus, activated: false }

  await page.keyboard.press('Enter')
  const activated = await page.evaluate(() => {
    const viewers = document.querySelector('[data-country-metric="viewers"]')
    const streams = document.querySelector('[data-country-metric="streams"]')
    const legend = document.querySelector('.stream-map-country-legend')
    return {
      viewersPressed: viewers?.getAttribute('aria-pressed'),
      streamsPressed: streams?.getAttribute('aria-pressed'),
      legendLabel: legend?.getAttribute('aria-label') ?? null,
    }
  })
  expect(activated.viewersPressed === 'true', `${id}: Viewers metric did not activate from keyboard`, violations)
  expect(activated.streamsPressed === 'false', `${id}: Streams metric remained active after Viewers keyboard activation`, violations)
  expect(/Viewers intensity legend: five log-scaled steps from Low to High/.test(activated.legendLabel || ''), `${id}: legend did not update to Viewers metric`, violations)
  return { focus, activated }
}

async function readMobileCountryTargets(page) {
  const filterToggle = page.locator('[data-stream-map-filter-toggle]')
  if (await filterToggle.count()) {
    await filterToggle.click()
    await page.locator('html.stream-map-filters-open').waitFor({ state: 'attached', timeout: 5_000 })
  }

  return page.evaluate(() => {
    const selectors = [
      '[data-stream-map-filter-toggle]',
      '.stream-map-geography-options button',
      '.stream-map-population-control select',
      '.stream-map-filter-clear',
      '.stream-map-filter-option',
      '.stream-map-metric-toggle button',
      '.stream-map-world-view',
      '.stream-map-country-row',
      '.stream-map-evidence-details > summary',
      '.stream-map-canvas .maplibregl-ctrl-group button',
    ]
    const seen = new Set()
    return selectors.flatMap((selector) => [...document.querySelectorAll(selector)]).flatMap((node) => {
      if (!(node instanceof HTMLElement) || seen.has(node)) return []
      seen.add(node)
      const style = getComputedStyle(node)
      const rect = node.getBoundingClientRect()
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0 && rect.width > 0 && rect.height > 0
      if (!visible || node.hasAttribute('disabled')) return []
      const name = node.getAttribute('aria-label') || (node.textContent || '').trim() || node.tagName.toLowerCase()
      return [{ name, height: Math.round(rect.height), width: Math.round(rect.width) }]
    })
  })
}

async function keyboardFocusButton(page, label) {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    document.body.focus()
  })

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await page.keyboard.press('Tab')
    const state = await page.evaluate((targetLabel) => {
      const active = document.activeElement
      const name = active instanceof HTMLElement ? (active.textContent || active.getAttribute('aria-label') || '').trim() : ''
      if (name !== targetLabel) return { reached: false, name }
      const style = getComputedStyle(active)
      const outlineWidth = Number.parseFloat(style.outlineWidth || '0') || 0
      const visualIndicator = (style.outlineStyle !== 'none' && outlineWidth >= 2)
        || (style.boxShadow !== 'none' && style.boxShadow !== '')
      return {
        reached: true,
        name,
        focusVisible: active.matches(':focus-visible'),
        outlineStyle: style.outlineStyle,
        outlineWidth,
        outlineOffset: style.outlineOffset,
        boxShadow: style.boxShadow,
        visualIndicator,
      }
    }, label)
    if (state.reached) return state
  }
  return { reached: false, focusVisible: false, visualIndicator: false }
}

function expect(condition, message, violations) {
  if (!condition) violations.push(message)
}
