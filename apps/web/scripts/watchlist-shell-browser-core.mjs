import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  clearApiCalls,
  countCalls,
  installNetworkGuards,
  readStoredDocument,
  setStoredDocument,
  waitDataIdle,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { api: [], analytics: 0, failLatest: false, failHistory: false }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)

  check(await page.title() === 'Twitch Local Watchlist — ViewLoom', 'Twitch Watchlist title is wrong.')
  check(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,follow', 'Twitch Watchlist robots metadata is wrong.')
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === 'https://vl.badjoke-lab.com/twitch/watchlist/', 'Twitch Watchlist canonical is wrong.')
  check(await page.locator('.feature-tabs a').allTextContents().then((values) => values.join('|')) === 'Heatmap|Day Flow|Battle Lines|History|Status', 'Primary feature tabs changed.')
  check(await page.locator('[data-watchlist-empty]').isVisible(), 'Empty Watchlist state is not visible.')
  check((await page.locator('[data-watchlist-empty]').innerText()).includes('No channels saved in this browser.'), 'Required empty-state wording is missing.')
  check(calls.api.length === 0, `Empty Watchlist issued API requests: ${JSON.stringify(calls.api)}`)

  const input = page.getByLabel('Twitch channel id or Twitch URL')
  await input.fill('Alpha')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator('[data-watchlist-entry="alpha"]').waitFor()
  check(await page.locator('[data-watchlist-entry]').count() === 1, 'First saved Twitch entry did not render.')
  check((await readStoredDocument(page, 'twitch')).entries[0].channelId === 'alpha', 'First Twitch entry was not persisted.')
  check(await page.locator('[data-watchlist-entry="alpha"] h2').evaluate((node) => node === document.activeElement), 'Focus did not move to the new saved entry.')
  check(calls.api.length === 0, 'Adding from an empty page made a feature-data request.')

  await input.fill('alpha')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Already saved.'), 'Duplicate feedback is wrong.')
  check(await page.locator('[data-watchlist-entry]').count() === 1, 'Duplicate add changed the list.')

  await input.fill('https://kick.com/not_twitch')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Kick URL'), 'Cross-provider Twitch feedback is not specific.')

  await input.fill('https://www.twitch.tv/Beta_Channel?ref=watchlist#saved')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check(await page.locator('[data-watchlist-entry]').count() === 2, 'Same-provider Twitch URL was not added.')
  let stored = await readStoredDocument(page, 'twitch')
  check(stored.entries.map((entry) => entry.channelId).join('|') === 'beta_channel|alpha', 'New Twitch entry was not inserted at the top.')
  check(calls.api.length === 0, 'Task-local adds made feature-data requests.')

  await page.locator('[data-watchlist-entry="beta_channel"] [data-watchlist-action="move-down"]').click()
  stored = await readStoredDocument(page, 'twitch')
  check(stored.entries.map((entry) => entry.channelId).join('|') === 'alpha|beta_channel', 'Move down did not persist the Twitch order.')
  await page.waitForFunction(() => document.activeElement?.matches('[data-watchlist-entry="beta_channel"] h2') ?? false)
  check(calls.api.length === 0, 'Task-local reorder made a feature-data request.')

  clearApiCalls(calls)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  check(countCalls(calls, '/api/twitch-heatmap') === 1, `Nonempty initial load did not make exactly one Twitch Heatmap request: ${JSON.stringify(calls.api)}`)
  check(countCalls(calls, '/api/history') === 1, `Nonempty initial load did not make exactly one Twitch History request: ${JSON.stringify(calls.api)}`)
  check(await page.locator('[data-watchlist-entry="alpha"]').getAttribute('data-latest-evidence') === 'present_fresh', 'Fresh latest evidence did not render for alpha.')
  check(await page.locator('[data-watchlist-entry="alpha"]').getAttribute('data-history-evidence') === 'present_retained', 'Retained evidence did not render for alpha.')
  const alphaText = await page.locator('[data-watchlist-entry="alpha"]').innerText()
  check(alphaText.includes('In latest observed set'), 'Required latest-present label is missing.')
  check(alphaText.includes('Present in retained History result'), 'Required retained-present label is missing.')
  check(alphaText.includes('1,200'), 'Latest viewers were not rendered.')
  check(alphaText.includes('100,000'), 'Retained viewer-minutes were not rendered.')
  const betaText = await page.locator('[data-watchlist-entry="beta_channel"]').innerText()
  check(betaText.includes('Not in latest observed set') && betaText.includes('Not confirmed offline'), 'Latest absence wording is incomplete.')
  check(betaText.includes('Not in retained History result') && betaText.includes('No complete history is implied'), 'History absence wording is incomplete.')

  await page.getByRole('button', { name: 'Last 7 days' }).click()
  await waitDataIdle(page)
  check(new URL(page.url()).searchParams.get('period') === '7d', '7d period was not serialized.')
  check(countCalls(calls, '/api/twitch-heatmap') === 1, 'Period change re-requested latest data.')
  check(countCalls(calls, '/api/history') === 2, 'Period change did not make exactly one additional History request.')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  await waitDataIdle(page)
  check(new URL(page.url()).searchParams.has('period') === false, 'Default 30d period was not restored to the clean URL.')
  check(countCalls(calls, '/api/twitch-heatmap') === 1 && countCalls(calls, '/api/history') === 2, 'Cached Back navigation made a request.')

  const beforeFilter = calls.api.length
  await page.getByLabel('Filter saved channels').fill('alpha')
  check(await page.locator('[data-watchlist-entry]').count() === 1, 'Local filter did not filter the complete saved list.')
  await page.getByLabel('Filter saved channels').fill('')
  check(calls.api.length === beforeFilter, 'Local filter made a feature-data request.')

  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  check(countCalls(calls, '/api/twitch-heatmap') === 2, 'Combined refresh did not make exactly one additional latest request.')
  check(countCalls(calls, '/api/history') === 3, 'Combined refresh did not make exactly one additional History request.')

  calls.failLatest = true
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  check(await page.getByRole('button', { name: 'Retry latest' }).isVisible(), 'Latest retry control is missing after latest failure.')
  check((await page.locator('[data-watchlist-entry="alpha"]').innerText()).includes('Latest observation unavailable'), 'Latest failure did not render unavailable evidence.')
  check((await page.locator('[data-watchlist-entry="alpha"]').innerText()).includes('Present in retained History result'), 'Latest failure removed retained evidence.')
  const historyBeforeLatestRetry = countCalls(calls, '/api/history')
  calls.failLatest = false
  await page.getByRole('button', { name: 'Retry latest' }).click()
  await waitDataIdle(page)
  check(countCalls(calls, '/api/history') === historyBeforeLatestRetry, 'Retry latest requested History.')
  check(await page.locator('[data-watchlist-entry="alpha"]').getAttribute('data-latest-evidence') === 'present_fresh', 'Retry latest did not restore latest evidence.')

  calls.failHistory = true
  await page.getByRole('button', { name: 'Refresh data' }).click()
  await waitDataIdle(page)
  check(await page.getByRole('button', { name: 'Retry History' }).isVisible(), 'History retry control is missing after History failure.')
  check((await page.locator('[data-watchlist-entry="alpha"]').innerText()).includes('Retained History unavailable'), 'History failure did not render unavailable evidence.')
  check((await page.locator('[data-watchlist-entry="alpha"]').innerText()).includes('In latest observed set'), 'History failure removed latest evidence.')
  const latestBeforeHistoryRetry = countCalls(calls, '/api/twitch-heatmap')
  calls.failHistory = false
  await page.getByRole('button', { name: 'Retry History' }).click()
  await waitDataIdle(page)
  check(countCalls(calls, '/api/twitch-heatmap') === latestBeforeHistoryRetry, 'Retry History requested latest data.')
  check(await page.locator('[data-watchlist-entry="alpha"]').getAttribute('data-history-evidence') === 'present_retained', 'Retry History did not restore retained evidence.')

  const secondPage = await context.newPage()
  const beforeSecondPage = calls.api.length
  await secondPage.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(secondPage)
  await waitDataIdle(secondPage)
  check(calls.api.length === beforeSecondPage + 2, 'A second nonempty page did not make exactly two initial requests.')
  const beforeCrossTab = calls.api.length
  await input.fill('gamma_channel')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await secondPage.waitForFunction(() => document.querySelectorAll('[data-watchlist-entry]').length === 3)
  check((await secondPage.locator('[data-watchlist-storage-feedback]').innerText()).includes('another tab'), 'Cross-tab storage feedback is missing.')
  check(calls.api.length === beforeCrossTab, 'Cross-tab storage refresh made a data request.')

  await secondPage.screenshot({ path: '/tmp/watchlist-twitch-desktop.png', fullPage: true })

  await setStoredDocument(page, 'twitch', Array.from({ length: 50 }, (_, index) => ({
    channelId: `channel_${index}`,
    displayName: `Channel ${index}`,
  })))
  clearApiCalls(calls)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  await waitDataIdle(page)
  check(countCalls(calls, '/api/twitch-heatmap') === 1 && countCalls(calls, '/api/history') === 1, 'Fifty entries changed initial request counts.')
  check(await page.locator('[data-watchlist-entry]').count() === 12, 'Default first render is not bounded to twelve entries.')
  await page.getByRole('button', { name: 'Show all' }).click()
  check(await page.locator('[data-watchlist-entry]').count() === 50, 'Show all did not reveal all fifty entries.')
  const beforeFiftyFirst = calls.api.length
  await page.getByLabel('Twitch channel id or Twitch URL').fill('overflow_channel')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Watchlist limit reached.'), 'Fifty-first entry limit feedback is wrong.')
  check((await readStoredDocument(page, 'twitch')).entries.length === 50, 'Fifty-first entry changed storage.')
  check(calls.api.length === beforeFiftyFirst, 'Fifty-first entry attempt made a data request.')

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear Watchlist' }).click()
  await page.locator('[data-watchlist-empty]').waitFor({ state: 'visible' })
  check(await readStoredDocument(page, 'twitch') === null, 'Clear Watchlist did not remove the Twitch key.')

  clearApiCalls(calls)
  await page.goto(`${baseUrl}/twitch/channel/?id=alpha`, { waitUntil: 'domcontentloaded' })
  await page.locator('[data-channel-watchlist-action]').waitFor()
  await page.waitForFunction(() => document.body.dataset.channelWatchlist === 'available')
  await page.waitForFunction(() => document.querySelector('[data-channel-state]')?.textContent !== 'Loading')
  const channelRequestsBeforeSave = calls.api.length
  await page.getByRole('button', { name: 'Save to Watchlist' }).click()
  const savedLink = page.locator('[data-channel-watchlist-action] a')
  await savedLink.waitFor()
  check((await savedLink.innerText()) === 'Saved in Watchlist', 'Channel save did not become the management link.')
  check(calls.api.length === channelRequestsBeforeSave, 'Channel save made a feature-data request.')
  check((await readStoredDocument(page, 'twitch')).entries[0].channelId === 'alpha', 'Channel save did not write the Twitch Watchlist key.')
  check((await page.locator('[data-channel-watchlist-feedback]').innerText()).includes('No data request was made.'), 'Channel save feedback does not state the no-request contract.')

  const diagnostics = {
    apiCalls: calls.api,
    analyticsLoads: calls.analytics,
    finalUrl: page.url(),
  }
  console.log(JSON.stringify(diagnostics))
  await appendFile('/tmp/watchlist-shell-preview.log', `\nW3B_DESKTOP ${JSON.stringify(diagnostics)}\n`)

  await secondPage.close()
  await context.close()
  console.log('Watchlist W3B desktop evidence and Channel-save gate passed.')
} finally {
  await browser.close()
}
