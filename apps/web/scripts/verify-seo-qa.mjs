import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const origin = 'https://vl.badjoke-lab.com'
const failures = []

const pages = [
  { path: 'index.html', url: `${origin}/`, type: 'website' },
  { path: 'about/index.html', url: `${origin}/about/`, type: 'article' },
  { path: 'support/index.html', url: `${origin}/support/`, type: 'article' },
  { path: 'changelog/index.html', url: `${origin}/changelog/`, type: 'article' },
  { path: 'contact/index.html', url: `${origin}/contact/`, type: 'article' },
  { path: 'terms/index.html', url: `${origin}/terms/`, type: 'article' },
  { path: 'privacy/index.html', url: `${origin}/privacy/`, type: 'article' },
  { path: 'refund-policy/index.html', url: `${origin}/refund-policy/`, type: 'article' },
  { path: 'commercial-disclosure/index.html', url: `${origin}/commercial-disclosure/`, type: 'article' },
  { path: 'twitch/index.html', url: `${origin}/twitch/`, type: 'website' },
  { path: 'twitch/heatmap/index.html', url: `${origin}/twitch/heatmap/`, type: 'article' },
  { path: 'twitch/day-flow/index.html', url: `${origin}/twitch/day-flow/`, type: 'article' },
  { path: 'twitch/battle-lines/index.html', url: `${origin}/twitch/battle-lines/`, type: 'article' },
  { path: 'twitch/history/index.html', url: `${origin}/twitch/history/`, type: 'article' },
  { path: 'twitch/status/index.html', url: `${origin}/twitch/status/`, type: 'article' },
  { path: 'kick/index.html', url: `${origin}/kick/`, type: 'website' },
  { path: 'kick/heatmap/index.html', url: `${origin}/kick/heatmap/`, type: 'article' },
  { path: 'kick/day-flow/index.html', url: `${origin}/kick/day-flow/`, type: 'article' },
  { path: 'kick/battle-lines/index.html', url: `${origin}/kick/battle-lines/`, type: 'article' },
  { path: 'kick/history/index.html', url: `${origin}/kick/history/`, type: 'article' },
  { path: 'kick/status/index.html', url: `${origin}/kick/status/`, type: 'article' },
]

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function match(source, pattern) {
  return source.match(pattern)?.[1]?.trim() ?? ''
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing metadata fragment: ${fragment}`)
}

function requireValue(path, label, value) {
  if (!value) failures.push(`${path}: missing ${label}`)
}

function forbidPlaceholder(path, label, value) {
  if (/lorem ipsum|placeholder|todo|tbd/i.test(value)) failures.push(`${path}: ${label} contains placeholder copy`)
}

for (const page of pages) {
  const { path, url, type } = page
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing public page`)
    continue
  }

  const source = read(path)
  const title = match(source, /<title>([^<]+)<\/title>/)
  const description = match(source, /<meta name="description" content="([^"]+)"/)
  const canonical = match(source, /<link rel="canonical" href="([^"]+)"/)
  const ogUrl = match(source, /<meta property="og:url" content="([^"]+)"/)
  const ogTitle = match(source, /<meta property="og:title" content="([^"]+)"/)
  const ogDescription = match(source, /<meta property="og:description" content="([^"]+)"/)
  const twitterTitle = match(source, /<meta name="twitter:title" content="([^"]+)"/)
  const twitterDescription = match(source, /<meta name="twitter:description" content="([^"]+)"/)

  requireValue(path, 'title', title)
  requireValue(path, 'description', description)
  requireValue(path, 'canonical', canonical)
  requireValue(path, 'og:url', ogUrl)
  requireValue(path, 'og:title', ogTitle)
  requireValue(path, 'og:description', ogDescription)
  requireValue(path, 'twitter:title', twitterTitle)
  requireValue(path, 'twitter:description', twitterDescription)

  if (canonical && canonical !== url) failures.push(`${path}: canonical ${canonical} does not match expected ${url}`)
  if (ogUrl && ogUrl !== url) failures.push(`${path}: og:url ${ogUrl} does not match expected ${url}`)
  if (title && !title.includes('ViewLoom')) failures.push(`${path}: title must include ViewLoom`)
  if (ogTitle && !ogTitle.includes('ViewLoom')) failures.push(`${path}: og:title must include ViewLoom`)
  if (twitterTitle && !twitterTitle.includes('ViewLoom')) failures.push(`${path}: twitter:title must include ViewLoom`)

  forbidPlaceholder(path, 'description', description)
  forbidPlaceholder(path, 'og:description', ogDescription)
  forbidPlaceholder(path, 'twitter:description', twitterDescription)

  requireFragment(path, source, '<meta property="og:site_name" content="ViewLoom"')
  requireFragment(path, source, `<meta property="og:type" content="${type}"`)
  requireFragment(path, source, '<meta property="og:image" content="https://vl.badjoke-lab.com/og/viewloom.svg"')
  requireFragment(path, source, '<meta name="twitter:card" content="summary_large_image"')
  requireFragment(path, source, '<meta name="twitter:image" content="https://vl.badjoke-lab.com/og/viewloom.svg"')
}

if (failures.length > 0) {
  console.error('ViewLoom SEO QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom SEO QA verification passed for ${pages.length} public pages.`)
