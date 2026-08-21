import { auditLocationCandidates } from './location-candidate-extractor.mjs'

const PAGE_SIZE = 100
const MAX_PAGES = 3

const clientId = process.env.TWITCH_CLIENT_ID?.trim()
const clientSecret = process.env.TWITCH_CLIENT_SECRET?.trim()

if (!clientId || !clientSecret) {
  console.error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required')
  process.exit(2)
}

const tokenUrl = new URL('https://id.twitch.tv/oauth2/token')
tokenUrl.searchParams.set('client_id', clientId)
tokenUrl.searchParams.set('client_secret', clientSecret)
tokenUrl.searchParams.set('grant_type', 'client_credentials')

const tokenResponse = await fetch(tokenUrl, { method: 'POST' })
if (!tokenResponse.ok) {
  throw new Error(`twitch_token_http_${tokenResponse.status}`)
}

const tokenPayload = await tokenResponse.json()
const accessToken = String(tokenPayload.access_token ?? '').trim()
if (!accessToken) throw new Error('twitch_token_missing')

const streams = []
let cursor = ''
let coveredPages = 0
let hasMore = false

for (let page = 0; page < MAX_PAGES; page += 1) {
  const url = new URL('https://api.twitch.tv/helix/streams')
  url.searchParams.set('first', String(PAGE_SIZE))
  if (cursor) url.searchParams.set('after', cursor)

  const response = await fetch(url, {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

  const payload = await response.json()
  const pageItems = Array.isArray(payload.data) ? payload.data : []
  streams.push(...pageItems)
  coveredPages += 1

  cursor = String(payload.pagination?.cursor ?? '').trim()
  if (!cursor) {
    hasMore = false
    break
  }
  hasMore = true
}

const hasText = (value) => typeof value === 'string' && value.trim().length > 0
const hasTags = (value) => Array.isArray(value) && value.some(hasText)

const counts = {
  title: 0,
  tags: 0,
  language: 0,
  titleAndTags: 0,
  titleAndLanguage: 0,
  tagsAndLanguage: 0,
  allThree: 0,
  anyZeroExtraApiEvidence: 0,
}

for (const stream of streams) {
  const title = hasText(stream.title)
  const tags = hasTags(stream.tags)
  const language = hasText(stream.language)

  if (title) counts.title += 1
  if (tags) counts.tags += 1
  if (language) counts.language += 1
  if (title && tags) counts.titleAndTags += 1
  if (title && language) counts.titleAndLanguage += 1
  if (tags && language) counts.tagsAndLanguage += 1
  if (title && tags && language) counts.allThree += 1
  if (title || tags || language) counts.anyZeroExtraApiEvidence += 1
}

const output = {
  provider: 'twitch',
  probe: 'location-evidence-source-availability',
  collectedAt: new Date().toISOString(),
  requestShape: {
    endpoint: '/helix/streams',
    pageSize: PAGE_SIZE,
    maxPages: MAX_PAGES,
    coveredPages,
    hasMore,
    additionalApiRequestsBeyondExistingCollectorShape: 0,
  },
  totalStreams: streams.length,
  availableCounts: {
    title: counts.title,
    tags: counts.tags,
    language: counts.language,
    description: null,
  },
  overlaps: {
    titleAndTags: counts.titleAndTags,
    titleAndLanguage: counts.titleAndLanguage,
    tagsAndLanguage: counts.tagsAndLanguage,
    allThree: counts.allThree,
  },
  anyZeroExtraApiEvidence: counts.anyZeroExtraApiEvidence,
  description: {
    count: null,
    reason: 'not_collected_requires_helix_users',
  },
  candidateExtraction: auditLocationCandidates(streams),
}

console.log(JSON.stringify(output, null, 2))
