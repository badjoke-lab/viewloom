#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
const seedFile = resolve(repoRoot, 'workers/collector-kick/src/kick-seed-slugs.ts')
const defaultOutput = resolve(repoRoot, 'workers/collector-kick/generated/kick-live-priority-boost.sql')

const args = new Map()
for (const raw of process.argv.slice(2)) {
  const [key, ...rest] = raw.split('=')
  args.set(key, rest.join('='))
}

const outputPath = resolve(repoRoot, args.get('--out') || defaultOutput)
const concurrency = clampInt(args.get('--concurrency'), 1, 32, 12)
const timeoutMs = clampInt(args.get('--timeout-ms'), 500, 20000, 3000)
const progressEvery = clampInt(args.get('--progress-every'), 1, 500, 25)
const limit = clampInt(args.get('--limit'), 0, 10000, 0)
const includeFile = args.get('--input') ? resolve(repoRoot, args.get('--input')) : null
const source = readFileSync(seedFile, 'utf8')
const seedSlugs = parseSeedSlugs(source)
const extraSlugs = includeFile ? parseLineSlugs(readFileSync(includeFile, 'utf8')) : []
const slugs = normalizeSlugList([...seedSlugs, ...extraSlugs]).slice(0, limit > 0 ? limit : undefined)

const live = []
let errors = 0
let done = 0

console.log(JSON.stringify({
  mode: 'probe-kick-live-candidates',
  input: { seedFile, seedCount: seedSlugs.length, extraCount: extraSlugs.length, normalizedCount: slugs.length },
  options: { concurrency, timeoutMs, progressEvery, outputPath },
}, null, 2))

await runPool(slugs, concurrency, async (slug) => {
  const result = await probeSlug(slug, timeoutMs)
  done += 1
  if (result.status === 'live') {
    live.push(result)
    console.log(`LIVE ${result.slug} ${result.viewers} ${result.title.slice(0, 80)}`)
  } else if (result.status === 'error') {
    errors += 1
  }
  if (done % progressEvery === 0 || done === slugs.length) {
    console.log(`progress ${done} / ${slugs.length} live ${live.length} errors ${errors}`)
  }
})

live.sort((a, b) => b.viewers - a.viewers || a.slug.localeCompare(b.slug))
const sql = renderSql(live)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, sql)

console.log(JSON.stringify({
  ok: true,
  checked: slugs.length,
  liveCount: live.length,
  errors,
  outputPath,
  liveSlugs: live.map((item) => item.slug),
}, null, 2))

function parseSeedSlugs(text) {
  const match = text.match(/DEFAULT_KICK_SEED_SLUGS\s*=\s*\[([\s\S]*?)\]/)
  if (!match) throw new Error('DEFAULT_KICK_SEED_SLUGS array not found')
  const values = []
  const re = /['"]([^'"]+)['"]/g
  let item
  while ((item = re.exec(match[1])) !== null) values.push(item[1])
  return values
}

function parseLineSlugs(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(',')[0].trim())
    .filter(Boolean)
}

function normalizeSlugList(values) {
  const seen = new Set()
  const slugs = []
  for (const raw of values) {
    const slug = String(raw || '').trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    if (!/^[a-z0-9_][a-z0-9_.-]{1,63}$/.test(slug)) continue
    seen.add(slug)
    slugs.push(slug)
  }
  return slugs
}

async function runPool(items, size, task) {
  const queue = [...items]
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (item) await task(item)
    }
  })
  await Promise.all(workers)
}

async function probeSlug(slug, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'ViewLoom live probe',
      },
    })
    if (!response.ok) return { status: 'error', slug, viewers: 0, title: `http_${response.status}` }
    const data = await response.json()
    const live = data && typeof data === 'object' ? data.livestream : null
    if (!live || typeof live !== 'object') return { status: 'offline', slug, viewers: 0, title: '' }
    const viewers = toInt(live.viewer_count ?? live.viewers)
    const title = text(live.session_title ?? live.title).slice(0, 120)
    return { status: 'live', slug, viewers, title }
  } catch (error) {
    return { status: 'error', slug, viewers: 0, title: error instanceof Error ? error.message.slice(0, 120) : String(error).slice(0, 120) }
  } finally {
    clearTimeout(timer)
  }
}

function renderSql(liveRows) {
  const lines = [
    '-- Generated Kick live priority boost SQL.',
    '-- Review before running against production.',
  ]

  for (const [index, row] of liveRows.entries()) {
    const priority = Math.max(1210, 1300 - index - 1)
    lines.push(
      'UPDATE kick_channels '
        + `SET status='active', priority=${priority}, failure_count=0, `
        + `last_viewer_count=${row.viewers}, last_title=${q(row.title)}, `
        + "last_checked_at=datetime('now'), updated_at=datetime('now'), "
        + "notes=COALESCE(notes, '') || ' | live probe priority boost' "
        + `WHERE slug=${q(row.slug)};`
    )
  }

  lines.push('')
  lines.push('-- Verification:')
  lines.push('-- SELECT slug, status, priority, last_viewer_count, failure_count FROM kick_channels ORDER BY priority DESC LIMIT 20;')
  return lines.join('\n')
}

function clampInt(value, min, max, fallback) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

function toInt(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function q(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}
