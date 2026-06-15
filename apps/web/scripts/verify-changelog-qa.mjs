import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const sourcePath = 'data/changelog.json'
const publicPath = 'public/data/changelog.json'
const contractPath = 'docs/changelog-qa-contract.md'
const pagePath = 'changelog/index.html'
const clientPath = 'src/changelog-page.ts'
const stylePath = 'src/changelog-page.css'
const failures = []

for (const path of [
  sourcePath,
  publicPath,
  contractPath,
  'scripts/build-changelog.mjs',
  pagePath,
  clientPath,
  stylePath,
]) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Changelog file`)
}

const source = readJson(sourcePath)
const published = readJson(publicPath)

if (source && published && JSON.stringify(source) !== JSON.stringify(published)) {
  failures.push(`${publicPath}: published data differs from the canonical ${sourcePath}`)
}

if (source) verifyPayload(source)
verifyPage()
verifyClient()
verifyStyles()

if (existsSync(join(root, contractPath))) {
  const contract = readFileSync(join(root, contractPath), 'utf8')
  for (const fragment of [
    'ViewLoom Changelog QA Contract',
    'viewloom-changelog-v1',
    'data/changelog.json',
    'public/data/changelog.json',
    'Livefield begins',
    'Livefield becomes ViewLoom',
    'ViewLoom design refresh',
    '/changelog/',
    'Loading, empty, and error states',
    'The detailed review canvas is not public data',
  ]) {
    if (!contract.includes(fragment)) failures.push(`${contractPath}: missing required contract fragment: ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('ViewLoom Changelog QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('ViewLoom Changelog QA verification passed for the canonical three-entry data and public page UI.')

function readJson(path) {
  if (!existsSync(join(root, path))) return null
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'))
  } catch (error) {
    failures.push(`${path}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function verifyPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    failures.push(`${sourcePath}: root must be an object`)
    return
  }
  if (payload.version !== 'viewloom-changelog-v1') failures.push(`${sourcePath}: version must be viewloom-changelog-v1`)
  if (!Array.isArray(payload.entries)) {
    failures.push(`${sourcePath}: entries must be an array`)
    return
  }

  const expected = new Map([
    ['viewloom-design-refresh', ['2026-06', 'ViewLoom design refresh']],
    ['livefield-becomes-viewloom', ['2026-05', 'Livefield becomes ViewLoom']],
    ['livefield-begins', ['2026-04', 'Livefield begins']],
  ])

  if (payload.entries.length !== expected.size) failures.push(`${sourcePath}: initial public Changelog must contain exactly three entries`)

  const ids = new Set()
  let previousDate = null

  for (const [index, entry] of payload.entries.entries()) {
    const label = `${sourcePath}: entry ${index + 1}`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      failures.push(`${label} must be an object`)
      continue
    }

    const keys = Object.keys(entry).sort()
    const expectedKeys = ['date', 'datePrecision', 'id', 'title']
    if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
      failures.push(`${label} must contain only id, date, datePrecision, and title during the initial review stage`)
    }

    if (typeof entry.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) failures.push(`${label}: id must be a lowercase slug`)
    else if (ids.has(entry.id)) failures.push(`${label}: duplicate id ${entry.id}`)
    else ids.add(entry.id)

    if (typeof entry.title !== 'string' || entry.title.trim().length === 0) failures.push(`${label}: title must not be empty`)
    if (entry.datePrecision !== 'month' && entry.datePrecision !== 'day') failures.push(`${label}: datePrecision must be month or day`)
    if (!validDate(entry.date, entry.datePrecision)) failures.push(`${label}: date does not match datePrecision`)

    if (previousDate !== null && entry.date > previousDate) failures.push(`${label}: entries must be sorted newest first`)
    previousDate = entry.date

    const expectedEntry = expected.get(entry.id)
    if (!expectedEntry) failures.push(`${label}: unexpected initial public entry ${entry.id}`)
    else {
      if (entry.date !== expectedEntry[0]) failures.push(`${label}: expected date ${expectedEntry[0]}`)
      if (entry.title !== expectedEntry[1]) failures.push(`${label}: expected title ${expectedEntry[1]}`)
    }

    const serialized = JSON.stringify(entry).toLowerCase()
    if (/\b(?:draft|planned|todo|lorem|fake)\b/.test(serialized)) failures.push(`${label}: contains forbidden draft or placeholder language`)
  }

  for (const id of expected.keys()) {
    if (!ids.has(id)) failures.push(`${sourcePath}: missing required initial entry ${id}`)
  }
}

function verifyPage() {
  if (!existsSync(join(root, pagePath))) return
  const page = readFileSync(join(root, pagePath), 'utf8')
  for (const fragment of [
    '<title>Changelog — ViewLoom</title>',
    '<link rel="canonical" href="https://vl.badjoke-lab.com/changelog/"',
    'data-changelog-state="loading"',
    'class="site-frame"',
    'class="masthead"',
    'class="global-nav"',
    'href="/changelog/" aria-current="page"',
    'class="page changelog-page"',
    'id="changelog-timeline"',
    'aria-live="polite"',
    'href="/data/changelog.json"',
    '/src/changelog-page.css',
    '/src/changelog-page.ts',
    '/src/analytics.ts',
  ]) {
    if (!page.includes(fragment)) failures.push(`${pagePath}: missing required page fragment: ${fragment}`)
  }
  for (const title of ['Livefield begins', 'Livefield becomes ViewLoom', 'ViewLoom design refresh']) {
    if (page.includes(title)) failures.push(`${pagePath}: milestone ${title} must come from public JSON, not hard-coded page markup`)
  }
}

function verifyClient() {
  if (!existsSync(join(root, clientPath))) return
  const client = readFileSync(join(root, clientPath), 'utf8')
  for (const fragment of [
    "fetch('/data/changelog.json'",
    "version: 'viewloom-changelog-v1'",
    'renderEntries',
    'createEntry',
    "setState('loading')",
    "setState('empty')",
    "setState('error')",
    "setState('ready')",
    "retry.textContent = 'Retry'",
    "time.dateTime = entry.date",
    'title.textContent = entry.title',
  ]) {
    if (!client.includes(fragment)) failures.push(`${clientPath}: missing required client fragment: ${fragment}`)
  }
  if (/entry\.(?:summary|details|pullRequests|commit)/.test(client)) failures.push(`${clientPath}: initial page must render only reviewed date and title fields`)
  if (/innerHTML\s*=/.test(client)) failures.push(`${clientPath}: Changelog entries must use DOM text assignment rather than innerHTML`)
}

function verifyStyles() {
  if (!existsSync(join(root, stylePath))) return
  const styles = readFileSync(join(root, stylePath), 'utf8')
  for (const fragment of ['.changelog-timeline', '.changelog-entry', '.changelog-state--error', '@media(max-width:760px)', '@media(max-width:520px)']) {
    if (!styles.includes(fragment)) failures.push(`${stylePath}: missing required responsive style fragment: ${fragment}`)
  }
}

function validDate(value, precision) {
  if (typeof value !== 'string') return false
  if (precision === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(value)
    if (!match) return false
    const month = Number(match[2])
    return month >= 1 && month <= 12
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}
