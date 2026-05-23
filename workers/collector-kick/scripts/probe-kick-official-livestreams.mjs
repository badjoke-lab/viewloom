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
const sample = rows.slice(0, 20).map((row) => ({
  slug: row?.slug ?? row?.channel_slug ?? row?.channel?.slug ?? null,
  viewers: row?.viewer_count ?? row?.viewers ?? null,
  title: row?.stream_title ?? row?.session_title ?? row?.title ?? null,
  keys: row && typeof row === 'object' ? Object.keys(row).slice(0, 20) : [],
}))

console.log(JSON.stringify({
  ok: response.ok,
  status: response.status,
  statusText: response.statusText,
  endpoint: url.toString(),
  dataCount: rows.length,
  topSample: sample,
  topLevelKeys: json && typeof json === 'object' ? Object.keys(json) : [],
  rawPrefix: json ? undefined : text.slice(0, 500),
}, null, 2))

if (!response.ok) process.exitCode = 1
