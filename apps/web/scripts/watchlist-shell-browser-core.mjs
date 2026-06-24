import { appendFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import {
  baseUrl,
  check,
  installNetworkGuards,
  readStoredDocument,
  setStoredDocument,
  waitReady,
} from './watchlist-shell-browser-fixture.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const calls = { api: [], analytics: 0 }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  await installNetworkGuards(context, calls)
  const page = await context.newPage()
  await page.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(page)

  check(await page.title() === 'Twitch Local Watchlist — ViewLoom', 'Twitch Watchlist title is wrong.')
  check(await page.locator('meta[name="robots"]').getAttribute('content') === 'noindex,follow', 'Twitch Watchlist robots metadata is wrong.')
  check(await page.locator('link[rel="canonical"]').getAttribute('href') === 'https://vl.badjoke-lab.com/twitch/watchlist/', 'Twitch Watchlist canonical is wrong.')
  check(await page.locator('.feature-tabs a').allTextContents().then((values) => values.join('|')) === 'Heatmap|Day Flow|Battle Lines|History|Status', 'Primary feature tabs changed.')
  check(await page.locator('[data-watchlist-empty]').isVisible(), 'Empty Watchlist state is not visible.')
  check((await page.locator('[data-watchlist-empty]').innerText()).includes('No channels saved in this browser.'), 'Required empty-state wording is missing.')
  check(calls.api.length === 0, `Empty Watchlist issued API requests: ${JSON.stringify(calls.api)}`)

  const input = page.getByLabel('Twitch channel id or Twitch URL')
  await input.fill('Alpha_Channel')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await page.locator('[data-watchlist-entry="alpha_channel"]').waitFor()
  check(await page.locator('[data-watchlist-entry]').count() === 1, 'First saved Twitch entry did not render.')
  check((await readStoredDocument(page, 'twitch')).entries[0].channelId === 'alpha_channel', 'First Twitch entry was not persisted.')
  check(await page.locator('[data-watchlist-entry="alpha_channel"] h2').evaluate((node) => node === document.activeElement), 'Focus did not move to the new saved entry.')

  await input.fill('alpha_channel')
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
  check(stored.entries.map((entry) => entry.channelId).join('|') === 'beta_channel|alpha_channel', 'New Twitch entry was not inserted at the top.')

  await page.locator('[data-watchlist-entry="beta_channel"] [data-watchlist-action="move-down"]').click()
  stored = await readStoredDocument(page, 'twitch')
  check(stored.entries.map((entry) => entry.channelId).join('|') === 'alpha_channel|beta_channel', 'Move down did not persist the Twitch order.')
  await page.waitForFunction(() => document.activeElement?.matches('[data-watchlist-entry="beta_channel"] h2') ?? false)
  check(await page.locator('[data-watchlist-entry="beta_channel"] h2').evaluate((node) => node === document.activeElement), 'Focus did not move to the reordered entry heading.')

  await page.getByRole('button', { name: 'Last 7 days' }).click()
  check(new URL(page.url()).searchParams.get('period') === '7d', '7d period was not serialized.')
  check(await page.getByRole('button', { name: 'Last 7 days' }).getAttribute('aria-pressed') === 'true', '7d period button is not pressed.')
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.querySelector('[data-watchlist-period="30d"]')?.getAttribute('aria-pressed') === 'true')
  check(new URL(page.url()).searchParams.has('period') === false, 'Default 30d period was not restored to the clean URL.')
  check(calls.api.length === 0, `Period navigation issued API requests: ${JSON.stringify(calls.api)}`)

  const secondPage = await context.newPage()
  await secondPage.goto(`${baseUrl}/twitch/watchlist/`, { waitUntil: 'domcontentloaded' })
  await waitReady(secondPage)
  await input.fill('gamma_channel')
  await page.getByRole('button', { name: 'Add channel' }).click()
  await secondPage.waitForFunction(() => document.querySelectorAll('[data-watchlist-entry]').length === 3)
  check((await secondPage.locator('[data-watchlist-storage-feedback]').innerText()).includes('another tab'), 'Cross-tab storage feedback is missing.')

  await secondPage.getByLabel('Filter saved channels').fill('beta')
  check(await secondPage.locator('[data-watchlist-entry]').count() === 1, 'Local filter did not search the complete saved list.')
  await secondPage.getByLabel('Filter saved channels').fill('')
  await secondPage.screenshot({ path: '/tmp/watchlist-twitch-desktop.png', fullPage: true })

  await setStoredDocument(page, 'twitch', Array.from({ length: 50 }, (_, index) => ({
    channelId: `channel_${index}`,
    displayName: `Channel ${index}`,
  })))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  check(await page.locator('[data-watchlist-entry]').count() === 12, 'Default first render is not bounded to twelve entries.')
  check(await page.getByRole('button', { name: 'Show all' }).isVisible(), 'Show all is missing for fifty entries.')
  await page.getByRole('button', { name: 'Show all' }).click()
  check(await page.locator('[data-watchlist-entry]').count() === 50, 'Show all did not reveal all fifty entries.')
  await page.getByLabel('Twitch channel id or Twitch URL').fill('overflow_channel')
  await page.getByRole('button', { name: 'Add channel' }).click()
  check((await page.locator('[data-watchlist-storage-feedback]').innerText()).includes('Watchlist limit reached.'), 'Fifty-first entry limit feedback is wrong.')
  check((await readStoredDocument(page, 'twitch')).entries.length === 50, 'Fifty-first entry changed storage.')

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear Watchlist' }).click()
  await page.locator('[data-watchlist-empty]').waitFor({ state: 'visible' })
  check(await readStoredDocument(page, 'twitch') === null, 'Clear Watchlist did not remove the Twitch key.')

  await page.evaluate(() => localStorage.setItem('viewloom.watchlist.twitch.v1', '{broken'))
  await page.reload({ waitUntil: 'domcontentloaded' })
  await waitReady(page)
  check(await page.locator('[data-watchlist-storage-error]').isVisible(), 'Corrupted storage state is not visible.')
  check(await page.getByRole('button', { name: 'Reset local Watchlist' }).isVisible(), 'Reset control is missing for corrupted storage.')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Reset local Watchlist' }).click()
  await page.locator('[data-watchlist-empty]').waitFor({ state: 'visible' })
  check(await readStoredDocument(page, 'twitch') === null, 'Reset did not remove corrupted Twitch storage.')

  const diagnostics = {
    apiCalls: calls.api,
    analyticsLoads: calls.analytics,
    finalUrl: page.url(),
    featureTabs: await page.locator('.feature-tabs a').allTextContents(),
  }
  console.log(JSON.stringify(diagnostics))
  await appendFile('/tmp/watchlist-shell-preview.log', `\nW3A_DESKTOP ${JSON.stringify(diagnostics)}\n`)
  check(calls.api.length === 0, `W3A desktop issued feature-data requests: ${JSON.stringify(calls.api)}`)

  await secondPage.close()
  await context.close()
  console.log('Watchlist W3A desktop storage shell gate passed.')
} finally {
  await browser.close()
}
