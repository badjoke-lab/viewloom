import { channelHistoryPayload } from './channel-profile-fixture.mjs'

export const baseUrl = process.env.CHANNEL_BASE_URL ?? 'http://127.0.0.1:4173'
export const assert = (condition, message) => { if (!condition) throw new Error(message) }

export function candidatePayload(provider) {
  const payload = structuredClone(channelHistoryPayload(provider))
  const extraDays = Array.from({ length: 9 }, (_, index) => {
    const day = `2026-06-${String(index + 1).padStart(2, '0')}`
    return {
      day,
      coverageState: index === 3 ? 'partial' : 'good',
      topStreamers: [{
        streamerId: 'alpha',
        displayName: 'Alpha Channel',
        viewerMinutes: 330000 + index * 23000,
        peakViewers: 7200 + index * 130,
        avgViewers: 5400 + index * 80,
        observedMinutes: 60,
        rankByViewerMinutes: (index % 4) + 1,
      }],
    }
  })
  payload.daily = [...extraDays, ...(payload.daily ?? [])]
  payload.period = { ...(payload.period ?? {}), label: 'Last 30 days', days: 30 }
  payload.coverage = { ...(payload.coverage ?? {}), observedDays: payload.daily.length }
  return payload
}

export function longNamePayload(provider) {
  const payload = structuredClone(channelHistoryPayload(provider))
  const name = 'A very long 日本語 channel name that must wrap safely without widening the mobile page'
  payload.topStreamers = (payload.topStreamers ?? []).map((row) => row.streamerId === 'alpha' ? { ...row, displayName: name } : row)
  payload.daily = (payload.daily ?? []).map((day) => ({
    ...day,
    topStreamers: (day.topStreamers ?? []).map((row) => row.streamerId === 'alpha' ? { ...row, displayName: name } : row),
  }))
  return payload
}

export async function installRoutes(context, calls, overrides = {}) {
  await context.route('**/api/history?**', (route) => {
    calls.twitch += 1
    const period = new URL(route.request().url()).searchParams.get('period')
    const payload = overrides.twitch ?? (period === '30d' ? candidatePayload('twitch') : channelHistoryPayload('twitch'))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await context.route('**/api/kick-history?**', (route) => {
    calls.kick += 1
    const period = new URL(route.request().url()).searchParams.get('period')
    const payload = overrides.kick ?? (period === '30d' ? candidatePayload('kick') : channelHistoryPayload('kick'))
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })
  })
  await context.route('**/api/twitch-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
  await context.route('**/api/kick-status', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"state":"fresh"}' }))
}

export async function waitReady(page) {
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
}

export async function noOverflow(page, label) {
  const result = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth }))
  assert(result.scrollWidth <= result.innerWidth + 1, `${label}: horizontal overflow (${result.scrollWidth} > ${result.innerWidth}).`)
}

export async function assertDarkSurface(page, selector, label) {
  const color = await page.locator(selector).first().evaluate((node) => getComputedStyle(node).backgroundColor)
  const values = color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? []
  assert(values.length === 3 && Math.max(...values) < 90, `${label}: expected a dark surface, got ${color}.`)
}
