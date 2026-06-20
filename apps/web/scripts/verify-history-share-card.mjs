import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing required share-card file`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }
const forbidPattern = (path, source, label, pattern) => { if (pattern.test(source)) failures.push(`${path}: forbidden ${label}`) }

const contractPath = 'docs/history-share-card-contract.md'
const renderPath = 'src/live/history-share-card.ts'
const stylePath = 'src/history-share-card.css'
const entryPath = 'src/live/history-report-text.ts'
const browserPath = 'scripts/history-share-card-browser.mjs'
const workflowPath = '../../.github/workflows/history-share-card.yml'
const browserWorkflowPath = '../../.github/workflows/history-share-card-browser.yml'

for (const path of [contractPath, renderPath, stylePath, entryPath, browserPath, workflowPath, browserWorkflowPath]) requireFile(path)

if (existsSync(join(root, contractPath))) {
  const source = read(contractPath)
  for (const fragment of [
    '1200 × 630 PNG',
    'not provider-wide',
    'must not use Twitch or Kick logos',
    'must not make another API request',
    'Twitch/Kick combined totals',
    'Cloudflare deployment configuration',
  ]) requireFragment(contractPath, source, fragment)
}

if (existsSync(join(root, renderPath))) {
  const source = read(renderPath)
  for (const fragment of [
    'const CARD_WIDTH = 1200',
    'const CARD_HEIGHT = 630',
    'historyReportCoverage(payload)',
    'data-history-share-card',
    'data-history-share-download',
    'canvas.toBlob',
    "anchor.download = `viewloom-${provider}-history-${period.from}-${period.to}.png`",
    'Observed ViewLoom data · not provider-wide · independent and unofficial',
    'renderHistoryShareCard',
  ]) requireFragment(renderPath, source, fragment)
  forbidPattern(renderPath, source, 'new API request', /\bfetch\s*\(/)
  forbidPattern(renderPath, source, 'platform logo reference', /twitch-logo|kick-logo|logo\.svg/i)
  forbidPattern(renderPath, source, 'combined-provider calculation', /twitch\s*\+\s*kick|kick\s*\+\s*twitch/i)
}

if (existsSync(join(root, entryPath))) {
  const source = read(entryPath)
  for (const fragment of [
    "import '../history-share-card.css'",
    "import { renderHistoryShareCard } from './history-share-card'",
    'renderHistoryShareCard(payload)',
  ]) requireFragment(entryPath, source, fragment)
}

if (failures.length) {
  console.error('History share-card verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('History share-card verification passed.')
