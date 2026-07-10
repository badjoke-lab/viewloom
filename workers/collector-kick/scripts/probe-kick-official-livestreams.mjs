#!/usr/bin/env node

const tokenName = ['KICK', 'ACCESS', 'TOKEN'].join('_')
const token = String(process.env[tokenName] || '').trim()
const limit = Number(process.env.KICK_LIVESTREAM_LIMIT || '100')

if (!token) {
  console.error(`Missing ${tokenName} environment variable.`)
  process.exit(1)
}

if (!/^[\x20-\x7E]+$/.test(token)) {
  console.error(`${tokenName} contains placeholder or non-ASCII text.`)
  process.exit(1)
}

const url = new URL('https://api.kick.com/public/v1/livestreams')
url.searchParams.set('limit', String(Math.max(1, Math.min(100, limit))))
url.searchParams.set('sort', 'viewer_count')

const headers = new Headers()
headers.set('accept', 'application/json')
headers.set(['author', 'ization'].join(''), ['Bear', 'er '].join('') + token)
headers.set('user-agent', 'ViewLoom kick official livestreams probe')

const response = await fetch(url, { headers })
const text = await response.text()
let json = null
try {
  json = JSON.parse(text)
} catch {
  json = null
}

const rows = Array.isArray(json?.data) ? json.data : []
const sample = rows.slice(0, 20).map((row) => {
  const category = row?.category && typeof row.category === 'object' ? row.category : null
  const categoryId = row?.category_id ?? row?.categoryId ?? category?.id ?? category?.category_id ?? null
  const categoryName = row?.category_name ?? row?.categoryName ?? category?.name ?? category?.category_name ?? null
  return {
    slug: row?.slug ?? row?.channel_slug ?? row?.channel?.slug ?? null,
    viewers: row?.viewer_count ?? row?.viewers ?? null,
    title: row?.stream_title ?? row?.session_title ?? row?.title ?? null,
    category: {
      id: categoryId,
      name: categoryName,
      rawType: category === null ? null : 'object',
      rawKeys: category ? Object.keys(category).slice(0, 20) : [],
    },
    keys: row && typeof row === 'object' ? Object.keys(row).slice(0, 30) : [],
  }
})

const categoryEvidence = {
  rowsInspected: sample.length,
  rowsWithCategoryId: sample.filter((row) => row.category.id !== null && row.category.id !== '').length,
  rowsWithCategoryName: sample.filter((row) => row.category.name !== null && row.category.name !== '').length,
  topLevelCategoryKeysObserved: [...new Set(sample.flatMap((row) => row.keys.filter((key) => /category/i.test(key))))].sort(),
  nestedCategoryKeysObserved: [...new Set(sample.flatMap((row) => row.category.rawKeys))].sort(),
  captureApprovalRule: 'A non-zero live sample with stable category identity/name fields is required before ViewLoom approves Kick category capture from the primary official-livestreams path.',
}

console.log(JSON.stringify({
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  endpoint: url.toString(),
  dataCount: rows.length,
  topSample: sample,
  categoryEvidence,
  topLevelKeys: json && typeof json === 'object' ? Object.keys(json) : [],
  rawPrefix: json ? undefined : text.slice(0, 500),
}, null, 2))

if (!response.ok) process.exitCode = 1
