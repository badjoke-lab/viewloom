import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
const artifactDir = join(root, 'artifacts', 'public-readiness')
const origin = 'https://vl.badjoke-lab.com'

const pages = [
  { route: '/', file: 'index.html', provider: 'portal', indexable: true },
  { route: '/about/', file: 'about/index.html', provider: 'portal', indexable: true },
  { route: '/support/', file: 'support/index.html', provider: 'portal', indexable: true },
  { route: '/changelog/', file: 'changelog/index.html', provider: 'portal', indexable: true },
  ...providerPages('twitch'),
  ...providerPages('kick'),
]

const knownRoutes = new Set(pages.map((page) => page.route))
const errors = []
const warnings = []
const pageReports = []
const canonicalOwners = new Map()

if (!existsSync(dist)) error('build', 'dist directory is missing; run the web build before the audit.')

const sitemapPath = join(dist, 'sitemap.xml')
const robotsPath = join(dist, 'robots.txt')
const sitemap = existsSync(sitemapPath) ? readFileSync(sitemapPath, 'utf8') : ''
const robots = existsSync(robotsPath) ? readFileSync(robotsPath, 'utf8') : ''
const sitemapRoutes = new Set([...sitemap.matchAll(/<loc>https:\/\/vl\.badjoke-lab\.com([^<]*)<\/loc>/g)].map((match) => normalizeRoute(match[1] || '/')))

if (!sitemap) error('sitemap', 'dist/sitemap.xml is missing.')
if (!robots) warning('robots', 'dist/robots.txt is missing.')
else if (!/sitemap:\s*https:\/\/vl\.badjoke-lab\.com\/sitemap\.xml/i.test(robots)) warning('robots', 'robots.txt does not advertise the canonical sitemap URL.')

for (const page of pages) auditPage(page)

for (const page of pages.filter((item) => item.indexable)) {
  if (!sitemapRoutes.has(page.route)) error(page.route, 'indexable route is missing from sitemap.xml.')
}

for (const route of sitemapRoutes) {
  if (!knownRoutes.has(route)) warning('sitemap', `sitemap route is not part of the configured public build: ${route}`)
}

const report = {
  schema: 'viewloom-public-readiness-v1',
  generated_at: new Date().toISOString(),
  build_root: 'apps/web/dist',
  totals: {
    configured_pages: pages.length,
    audited_pages: pageReports.filter((page) => page.exists).length,
    errors: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
  pages: pageReports,
  boundary: 'Repository build audit only; production and Cloudflare were not contacted.',
}

mkdirSync(artifactDir, { recursive: true })
writeFileSync(join(artifactDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
writeFileSync(join(artifactDir, 'report.md'), markdownReport(report))

console.log(`ViewLoom public readiness audit: ${errors.length} error(s), ${warnings.length} warning(s), ${report.totals.audited_pages}/${pages.length} pages audited.`)
for (const item of errors) console.error(`ERROR [${item.scope}] ${item.message}`)
for (const item of warnings) console.warn(`WARN  [${item.scope}] ${item.message}`)
if (errors.length) process.exit(1)

function providerPages(provider) {
  return [
    { route: `/${provider}/`, file: `${provider}/index.html`, provider, indexable: true },
    { route: `/${provider}/heatmap/`, file: `${provider}/heatmap/index.html`, provider, indexable: true, featureTabs: true },
    { route: `/${provider}/day-flow/`, file: `${provider}/day-flow/index.html`, provider, indexable: true, featureTabs: true },
    { route: `/${provider}/battle-lines/`, file: `${provider}/battle-lines/index.html`, provider, indexable: true, featureTabs: true },
    { route: `/${provider}/history/`, file: `${provider}/history/index.html`, provider, indexable: true, featureTabs: true },
    { route: `/${provider}/channel/`, file: `${provider}/channel/index.html`, provider, indexable: false, featureTabs: true },
    { route: `/${provider}/status/`, file: `${provider}/status/index.html`, provider, indexable: true, featureTabs: true },
  ]
}

function auditPage(page) {
  const path = join(dist, page.file)
  if (!existsSync(path)) {
    error(page.route, `built page is missing: ${page.file}`)
    pageReports.push({ route: page.route, file: page.file, exists: false })
    return
  }

  const html = readFileSync(path, 'utf8')
  const title = extractTag(html, 'title')
  const description = metaContent(html, 'name', 'description')
  const canonical = linkHref(html, 'canonical')
  const bodyProvider = attributeFromTag(html, 'body', 'data-provider')
  const h1Count = (html.match(/<h1\b/gi) ?? []).length
  const ogTitle = metaContent(html, 'property', 'og:title')
  const ogDescription = metaContent(html, 'property', 'og:description')
  const ogImage = metaContent(html, 'property', 'og:image')
  const twitterCard = metaContent(html, 'name', 'twitter:card')
  const robotsMeta = metaContent(html, 'name', 'robots').toLowerCase()
  const expectedCanonical = `${origin}${page.route}`
  const localLinks = [...html.matchAll(/\bhref=["']([^"']+)["']/gi)].map((match) => match[1])
  const assetSources = [...html.matchAll(/\b(?:src|href)=["'](\/assets\/[^"']+)["']/gi)].map((match) => match[1])

  if (!title) error(page.route, 'title is missing.')
  if (!description) error(page.route, 'meta description is missing.')
  if (!canonical) error(page.route, 'canonical URL is missing.')
  else if (canonical !== expectedCanonical) error(page.route, `canonical URL mismatch: expected ${expectedCanonical}, found ${canonical}.`)
  if (canonical) {
    const owner = canonicalOwners.get(canonical)
    if (owner && owner !== page.route) error(page.route, `canonical URL is also used by ${owner}.`)
    canonicalOwners.set(canonical, page.route)
  }
  if (h1Count !== 1) error(page.route, `expected exactly one H1, found ${h1Count}.`)
  if (!/class=["'][^"']*global-nav/.test(html)) error(page.route, 'global navigation is missing.')
  if (!/class=["'][^"']*footer/.test(html)) error(page.route, 'footer is missing.')
  if (!/googletagmanager\.com\/gtag\/js\?id=G-YHX7HS1VBK/.test(html)) error(page.route, 'built analytics tag is missing.')
  if (/livefield\.pages\.dev/i.test(html)) error(page.route, 'retired livefield.pages.dev reference remains in public HTML.')
  if (/\bStream A\b|\bStream B\b/.test(html)) error(page.route, 'static Stream A / Stream B mock labels remain in public HTML.')

  if (page.provider && bodyProvider !== page.provider) error(page.route, `data-provider mismatch: expected ${page.provider}, found ${bodyProvider || 'missing'}.`)
  if (!ogTitle) warning(page.route, 'Open Graph title is missing.')
  if (!ogDescription) warning(page.route, 'Open Graph description is missing.')
  if (!ogImage) warning(page.route, 'Open Graph image is missing.')
  if (!twitterCard) warning(page.route, 'Twitter card metadata is missing.')
  if (!page.indexable && !robotsMeta.includes('noindex')) warning(page.route, 'utility channel route is indexable without an explicit noindex directive.')

  if (page.featureTabs) auditFeatureTabs(page, html)
  for (const source of assetSources) auditAsset(page.route, source)
  for (const href of localLinks) auditLocalLink(page.route, href)

  pageReports.push({
    route: page.route,
    file: page.file,
    exists: true,
    provider: page.provider,
    indexable: page.indexable,
    title,
    canonical,
    h1_count: h1Count,
    local_link_count: localLinks.filter((href) => href.startsWith('/')).length,
    asset_reference_count: assetSources.length,
  })
}

function auditFeatureTabs(page, html) {
  const match = html.match(/<nav\b[^>]*class=["'][^"']*feature-tabs[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)
  if (!match) return error(page.route, 'feature tabs are missing.')
  const hrefs = [...match[1].matchAll(/href=["']([^"']+)["']/gi)].map((item) => stripQuery(item[1]))
  const required = ['heatmap', 'day-flow', 'battle-lines', 'history', 'status'].map((feature) => `/${page.provider}/${feature}/`)
  for (const route of required) if (!hrefs.includes(route)) error(page.route, `feature tabs are missing ${route}.`)
  const other = page.provider === 'twitch' ? '/kick/' : '/twitch/'
  if (hrefs.some((href) => href.startsWith(other))) error(page.route, 'feature tabs cross provider routes.')
}

function auditAsset(scope, source) {
  const clean = decodeURIComponent(source.split(/[?#]/)[0]).replace(/^\//, '')
  const target = normalize(join(dist, clean))
  if (!target.startsWith(normalize(dist))) return error(scope, `asset path escapes build root: ${source}`)
  if (!existsSync(target)) error(scope, `referenced built asset is missing: ${source}`)
}

function auditLocalLink(scope, href) {
  if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/') || href.startsWith('/assets/') || href.startsWith('/src/') || href.startsWith('/data/')) return
  const route = normalizeRoute(stripQuery(href))
  if (knownRoutes.has(route)) return
  const candidate = route === '/' ? join(dist, 'index.html') : join(dist, route.replace(/^\//, ''), 'index.html')
  if (!existsSync(candidate)) warning(scope, `local route does not resolve to a built HTML page: ${href}`)
}

function extractTag(html, tag) {
  return decodeEntities(html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]?.trim() ?? '')
}
function metaContent(html, key, value) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    if ((attribute(tag, key) ?? '').toLowerCase() === value.toLowerCase()) return decodeEntities(attribute(tag, 'content') ?? '')
  }
  return ''
}
function linkHref(html, rel) {
  const tags = html.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of tags) {
    if ((attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/).includes(rel)) return attribute(tag, 'href') ?? ''
  }
  return ''
}
function attributeFromTag(html, tagName, name) {
  const tag = html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'i'))?.[0] ?? ''
  return attribute(tag, name) ?? ''
}
function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))
  return match?.[1]
}
function stripQuery(value) {
  return value.split(/[?#]/)[0]
}
function normalizeRoute(value) {
  const clean = stripQuery(value || '/').replace(/\/index\.html$/, '/')
  if (clean === '' || clean === '/') return '/'
  return `/${clean.replace(/^\/+|\/+$/g, '')}/`
}
function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}
function error(scope, message) { errors.push({ scope, message }) }
function warning(scope, message) { warnings.push({ scope, message }) }

function markdownReport(value) {
  const lines = [
    '# ViewLoom public readiness audit',
    '',
    `Generated: ${value.generated_at}`,
    '',
    `- Configured pages: ${value.totals.configured_pages}`,
    `- Audited pages: ${value.totals.audited_pages}`,
    `- Errors: ${value.totals.errors}`,
    `- Warnings: ${value.totals.warnings}`,
    '',
    '## Errors',
    '',
    ...(value.errors.length ? value.errors.map((item) => `- **${item.scope}** — ${item.message}`) : ['- None']),
    '',
    '## Warnings',
    '',
    ...(value.warnings.length ? value.warnings.map((item) => `- **${item.scope}** — ${item.message}`) : ['- None']),
    '',
    '## Page inventory',
    '',
    '| Route | Exists | Provider | Indexable | H1 |',
    '|---|---:|---|---:|---:|',
    ...value.pages.map((page) => `| ${page.route} | ${page.exists ? 'yes' : 'no'} | ${page.provider ?? '—'} | ${page.indexable ? 'yes' : 'no'} | ${page.h1_count ?? '—'} |`),
    '',
    `Boundary: ${value.boundary}`,
    '',
  ]
  return lines.join('\n')
}
