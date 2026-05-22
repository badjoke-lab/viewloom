#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
const seedFile = resolve(repoRoot, 'workers/collector-kick/src/kick-seed-slugs.ts')
const defaultOutput = resolve(repoRoot, 'workers/collector-kick/generated/kick-seed-import.sql')

const args = new Map()
for (const raw of process.argv.slice(2)) {
  if (raw === '--check-only') {
    args.set('--check-only', 'true')
    continue
  }
  const [key, ...rest] = raw.split('=')
  args.set(key, rest.join('='))
}

const checkOnly = args.get('--check-only') === 'true'
const outputPath = resolve(repoRoot, args.get('--out') || defaultOutput)
const extraSlugs = splitSlugs(args.get('--extra') || '')
const now = new Date().toISOString()
const source = readFileSync(seedFile, 'utf8')
const seedSlugs = parseSeedSlugs(source)
const rawSlugs = [...seedSlugs, ...extraSlugs]
const { rows, skipped, duplicates } = normalizeRows(rawSlugs, now)
const sql = renderSql(rows)

if (!checkOnly) {
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, sql)
}

const summary = {
  ok: skipped.length === 0 && rows.length > 0,
  mode: checkOnly ? 'check-only' : 'write-sql',
  input: {
    seedFile,
    seedCount: seedSlugs.length,
    extraCount: extraSlugs.length,
    rawCount: rawSlugs.length,
  },
  output: {
    outputPath: checkOnly ? null : outputPath,
    normalizedCount: rows.length,
    skippedCount: skipped.length,
    duplicateCount: duplicates.length,
    sqlBytes: Buffer.byteLength(sql, 'utf8'),
  },
  skipped,
  duplicateSample: duplicates.slice(0, 20),
}

console.log(JSON.stringify(summary, null, 2))

if (!summary.ok) process.exitCode = 1

function parseSeedSlugs(text) {
  const match = text.match(/DEFAULT_KICK_SEED_SLUGS\s*=\s*\[([\s\S]*?)\]/)
  if (!match) throw new Error('DEFAULT_KICK_SEED_SLUGS array not found')
  const values = []
  const re = /['"]([^'"]+)['"]/g
  let item
  while ((item = re.exec(match[1])) !== null) values.push(item[1])
  return values
}

function splitSlugs(value) {
  return value.split(',').map((slug) => slug.trim()).filter(Boolean)
}

function normalizeRows(slugs, timestamp) {
  const seen = new Set()
  const rows = []
  const skipped = []
  const duplicates = []

  for (const rawSlug of slugs) {
    const slug = rawSlug.trim().toLowerCase()
    if (!slug) continue
    if (!/^[a-z0-9_][a-z0-9_.-]{1,63}$/.test(slug)) {
      skipped.push({ slug: rawSlug, reason: 'invalid_slug' })
      continue
    }
    if (seen.has(slug)) {
      duplicates.push(slug)
      continue
    }
    seen.add(slug)
    const index = rows.length
    rows.push({
      slug,
      url: `https://kick.com/${slug}`,
      priority: Math.max(1, 1000 - index),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  return { rows, skipped, duplicates }
}

function renderSql(rows) {
  const lines = [
    '-- Generated Kick seed import SQL.',
    '-- Review before running against production.',
    '-- Requires kick_channels table from 0001_create_kick_channels.sql.',
    'BEGIN TRANSACTION;',
    '',
  ]

  for (const row of rows) {
    lines.push(`INSERT INTO kick_channels (`)
    lines.push(`  slug, display_name, url, last_seen_at, last_live_at, last_checked_at,`)
    lines.push(`  last_viewer_count, last_title, priority, failure_count, success_count,`)
    lines.push(`  source, status, notes, created_at, updated_at`)
    lines.push(`) VALUES (`)
    lines.push(`  ${q(row.slug)}, NULL, ${q(row.url)}, ${q(row.createdAt)}, NULL, NULL,`)
    lines.push(`  NULL, NULL, ${row.priority}, 0, 0,`)
    lines.push(`  'seed', 'candidate', 'imported from built-in seed list', ${q(row.createdAt)}, ${q(row.updatedAt)}`)
    lines.push(`)`)
    lines.push(`ON CONFLICT(slug) DO UPDATE SET`)
    lines.push(`  url = COALESCE(kick_channels.url, excluded.url),`)
    lines.push(`  source = COALESCE(NULLIF(kick_channels.source, ''), excluded.source),`)
    lines.push(`  priority = CASE WHEN kick_channels.priority IS NULL OR kick_channels.priority = 0 THEN excluded.priority ELSE kick_channels.priority END,`)
    lines.push(`  status = COALESCE(NULLIF(kick_channels.status, ''), excluded.status),`)
    lines.push(`  updated_at = excluded.updated_at;`)
    lines.push('')
  }

  lines.push('COMMIT;')
  lines.push('')
  lines.push('-- Verification:')
  lines.push('-- SELECT source, status, COUNT(*) AS rows FROM kick_channels GROUP BY source, status ORDER BY source, status;')
  lines.push('-- SELECT slug, priority, status, source, created_at, updated_at FROM kick_channels ORDER BY priority DESC LIMIT 20;')
  return lines.join('\n')
}

function q(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}
