import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const sourcePath = 'data/changelog.json'
const publicPath = 'public/data/changelog.json'
const contractPath = 'docs/changelog-qa-contract.md'
const failures = []

for (const path of [sourcePath, publicPath, contractPath, 'scripts/build-changelog.mjs']) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing required Changelog foundation file`)
}

const source = readJson(sourcePath)
const published = readJson(publicPath)

if (source && published && JSON.stringify(source) !== JSON.stringify(published)) {
  failures.push(`${publicPath}: published data differs from the canonical ${sourcePath}`)
}

if (source) verifyPayload(source)

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

console.log('ViewLoom Changelog QA verification passed for the canonical three-entry foundation.')

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
