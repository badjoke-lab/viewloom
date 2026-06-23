import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const origin = (process.env.CHANNEL_C0_ORIGIN ?? 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = resolve(process.env.CHANNEL_C0_ARTIFACT_DIR ?? 'artifacts/channel-c0-production')
mkdirSync(out, { recursive: true })

const assert = (condition, message) => { if (!condition) throw new Error(message) }

async function fetchCandidate(path, provider, period) {
  const response = await fetch(`${origin}${path}?period=${period}&metric=viewer_minutes&qa=${Date.now()}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })
  const text = await response.text()
  assert(response.ok, `${provider} History API returned ${response.status}: ${text.slice(0, 500)}`)
  let payload
  try { payload = JSON.parse(text) } catch { throw new Error(`${provider} History API did not return JSON.`) }
  const candidate = Array.isArray(payload.topStreamers)
    ? payload.topStreamers.find((row) => typeof row?.streamerId === 'string' && row.streamerId.trim())
    : undefined
  assert(candidate, `${provider} History API has no retained Top streamer with an id.`)
  return {
    provider,
    period,
    source: payload.source,
    state: payload.state,
    observedDays: Array.isArray(payload.daily) ? payload.daily.filter((day) => day?.coverageState !== 'missing').length : 0,
    streamerId: candidate.streamerId,
    displayName: candidate.displayName || candidate.streamerId,
  }
}

async function waitForReady(page) {
  await page.waitForFunction(() => {
    const state = document.querySelector('[data-channel-state]')?.textContent?.trim()
    return Boolean(state && state !== 'Loading')
  }, undefined, { timeout: 30000 })
}

async function assertNoOverflow(page, label) {
  const size = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(size.scrollWidth <= size.innerWidth + 1, `${label}: horizontal overflow (${size.scrollWidth} > ${size.innerWidth}).`)
}

async function inspect(browser, candidate, viewport, filename) {
  const context = await browser.newContext({ viewport, isMobile: viewport.width <= 420 })
  const page = await context.newPage()
  const params = new URLSearchParams({
    id: candidate.streamerId,
    name: candidate.displayName,
    period: candidate.period,
    qa: String(Date.now()),
  })
  await page.goto(`${origin}/${candidate.provider}/channel/?${params}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await waitForReady(page)

  const state = (await page.locator('[data-channel-state]').textContent())?.trim() ?? ''
  assert(!['Error', 'Missing channel', 'Loading'].includes(state), `${candidate.provider} Channel state is ${state}.`)
  assert((await page.locator('[data-channel-summary] > *').count()) >= 5, `${candidate.provider} Channel summary is incomplete.`)
  assert((await page.locator('.channel-trend-column').count()) > 0, `${candidate.provider} Channel retained-day footprint is missing.`)
  const external = await page.locator('[data-channel-external]').getAttribute('href')
  const expectedHost = candidate.provider === 'twitch' ? 'https://www.twitch.tv/' : 'https://kick.com/'
  assert(external?.startsWith(expectedHost), `${candidate.provider} external channel link is wrong.`)
  const scope = (await page.locator('[data-channel-scope]').textContent()) ?? ''
  assert(scope.includes('not confirmed offline'), `${candidate.provider} absence limitation is missing.`)
  assert(scope.includes('Session start/end history is not available'), `${candidate.provider} session limitation is missing.`)
  await assertNoOverflow(page, `${candidate.provider} ${viewport.width}px`)
  await page.screenshot({ path: resolve(out, filename), fullPage: true })

  const result = {
    ...candidate,
    renderedState: state,
    summaryCards: await page.locator('[data-channel-summary] > *').count(),
    trendDays: await page.locator('.channel-trend-column').count(),
    retainedDayCards: await page.locator('.channel-day-card').count(),
    rivalryCards: await page.locator('.channel-rival-card').count(),
    external,
    viewport,
  }
  await context.close()
  return result
}

try {
  const twitch = await fetchCandidate('/api/history', 'twitch', '7d')
  const kick = await fetchCandidate('/api/kick-history', 'kick', '30d')
  const browser = await chromium.launch({ headless: true })
  let results
  try {
    results = [
      await inspect(browser, twitch, { width: 1440, height: 1100 }, 'twitch-desktop-production.png'),
      await inspect(browser, kick, { width: 390, height: 844 }, 'kick-mobile-production.png'),
    ]
  } finally {
    await browser.close()
  }
  writeFileSync(resolve(out, 'channel-c0-production.json'), JSON.stringify({ origin, results }, null, 2))
  console.log('Channel C0 production baseline passed for Twitch desktop and Kick 390px mobile.')
} catch (error) {
  const message = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error)
  writeFileSync(resolve(out, 'failure.txt'), message)
  console.error(message)
  process.exitCode = 1
}
