import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const origin = (process.env.R12C2_ORIGIN || 'https://vl.badjoke-lab.com').replace(/\/$/, '')
const out = process.env.R12C2_ARTIFACT_DIR || 'artifacts/r12c2-launch-assets'

const assets = [
  {
    id: 'viewloom-desktop',
    route: '/',
    viewport: { width: 1440, height: 1000 },
    provider: 'portal',
    intendedUse: ['launch listing hero', 'desktop product overview'],
    caption: 'ViewLoom separates bounded Twitch and Kick observations into distinct views for current activity, daily movement, rivalries, and retained trends.',
    loadingPatterns: [],
  },
  {
    id: 'viewloom-mobile',
    route: '/',
    viewport: { width: 390, height: 844 },
    provider: 'portal',
    intendedUse: ['mobile product overview', 'responsive product proof'],
    caption: 'The ViewLoom portal keeps Twitch and Kick observations separate while exposing the same product roles on mobile.',
    loadingPatterns: [],
  },
  {
    id: 'twitch-heatmap',
    route: '/twitch/heatmap/',
    viewport: { width: 1440, height: 1000 },
    provider: 'twitch',
    intendedUse: ['feature screenshot', 'Heatmap explanation'],
    caption: 'Heatmap shows concentration and movement within the current observed Twitch field.',
    loadingPatterns: ['Loading Twitch heatmap', 'Preparing map controls'],
  },
  {
    id: 'twitch-day-flow',
    route: '/twitch/day-flow/',
    viewport: { width: 1440, height: 1000 },
    provider: 'twitch',
    intendedUse: ['feature screenshot', 'Day Flow explanation'],
    caption: 'Day Flow follows observed Twitch audience movement through the UTC day.',
    loadingPatterns: ['Loading Twitch Day Flow', 'Loading selected-time ranking', 'Loading selected streamer details', 'Loading Day Flow summary'],
  },
  {
    id: 'twitch-battle-lines',
    route: '/twitch/battle-lines/',
    viewport: { width: 1440, height: 1000 },
    provider: 'twitch',
    intendedUse: ['feature screenshot', 'Battle Lines explanation'],
    caption: 'Battle Lines compares observed Twitch gaps, reversals, and changes in order between streams.',
    loadingPatterns: ['Loading Twitch Battle Lines', 'Selecting the recommended Twitch battle', 'Loading reversals', 'Loading secondary battles', 'Loading battle events'],
  },
  {
    id: 'twitch-history',
    route: '/twitch/history/',
    viewport: { width: 1440, height: 1000 },
    provider: 'twitch',
    intendedUse: ['feature screenshot', 'History explanation'],
    caption: 'History reviews retained Twitch daily rollups, peaks, observed-field rankings, and longer-term movement.',
    loadingPatterns: ['Loading retained history', 'Loading period coverage', 'Loading Twitch history'],
  },
]

await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const evidence = {
  schema: 'viewloom-r12c2-launch-assets-capture-v1',
  phase: 'Phase 12',
  workstream: 'R12C-2',
  checked_at: new Date().toISOString(),
  origin,
  result: 'running',
  assets: [],
  violations: [],
}

try {
  for (const asset of assets) {
    const context = await browser.newContext({ viewport: asset.viewport })
    const page = await context.newPage()
    const response = await page.goto(`${origin}${asset.route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
    await page.waitForTimeout(1000)

    if (asset.loadingPatterns.length) {
      await page.waitForFunction((patterns) => {
        const text = document.body?.innerText || ''
        return patterns.every((pattern) => !text.includes(pattern))
      }, asset.loadingPatterns, { timeout: 30_000 }).catch(() => {})
    }

    await page.waitForTimeout(1200)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(250)

    const facts = await page.evaluate((patterns) => {
      const text = document.body?.innerText || ''
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() || null,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
        bodyOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        loadingPatternsRemaining: patterns.filter((pattern) => text.includes(pattern)),
        bodyTextLength: text.trim().length,
      }
    }, asset.loadingPatterns)

    const filename = `${asset.id}.png`
    const filepath = `${out}/${filename}`
    await page.screenshot({ path: filepath, fullPage: false })
    const bytes = await readFile(filepath)
    const sha256 = createHash('sha256').update(bytes).digest('hex')

    const violations = []
    if (response?.status() !== 200) violations.push(`HTTP ${response?.status()}`)
    if (!facts.title.includes('ViewLoom')) violations.push('ViewLoom title missing')
    if (!facts.h1) violations.push('H1 missing')
    if (facts.canonical !== `${origin}${asset.route}`) violations.push(`canonical mismatch: ${facts.canonical}`)
    if (facts.bodyOverflow > 2) violations.push(`horizontal overflow ${facts.bodyOverflow}px`)
    if (facts.loadingPatternsRemaining.length) violations.push(`loading text remains: ${facts.loadingPatternsRemaining.join(', ')}`)
    if (facts.bodyTextLength < 200) violations.push(`body text unexpectedly short: ${facts.bodyTextLength}`)

    const record = {
      id: asset.id,
      route: asset.route,
      viewport: asset.viewport,
      provider: asset.provider,
      intendedUse: asset.intendedUse,
      caption: asset.caption,
      filename,
      sha256,
      sizeBytes: bytes.length,
      status: response?.status() ?? null,
      facts,
      violations,
    }
    evidence.assets.push(record)
    evidence.violations.push(...violations.map((violation) => ({ asset: asset.id, violation })))
    await context.close()
  }

  evidence.result = evidence.violations.length === 0 ? 'pass' : 'fail'
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(JSON.stringify({ result: evidence.result, assets: evidence.assets.length, violations: evidence.violations.length }, null, 2))
  if (evidence.result !== 'pass') process.exitCode = 1
} catch (error) {
  evidence.result = 'fail'
  evidence.error = error instanceof Error ? error.message : String(error)
  await writeFile(`${out}/evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`)
  throw error
} finally {
  await browser.close()
}
