import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const failures = []

function read(path) {
  const absolute = join(root, path)
  if (!existsSync(absolute)) {
    failures.push(`${path}: missing public page`)
    return ''
  }
  return readFileSync(absolute, 'utf8')
}

function allValues(source, pattern) {
  return [...source.matchAll(pattern)].map((match) => match[1]?.trim() ?? '')
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

const contractSource = read('src/navigation/url-contract.ts')
const transpiled = ts.transpileModule(contractSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
const contract = await import(moduleUrl)

assert(contract.VIEWLOOM_ORIGIN === 'https://vl.badjoke-lab.com', 'Canonical origin must remain https://vl.badjoke-lab.com.')
assert(contract.normalizeCanonicalPathname('/twitch/day-flow?date=2026-06-18#chart') === '/twitch/day-flow/', 'Canonical path normalization must remove query and hash state.')
assert(contract.normalizeCanonicalPathname('kick/history') === '/kick/history/', 'Canonical path normalization must add leading and trailing slashes.')
assert(contract.providerForPathname('/twitch/history/?period=30d') === 'twitch', 'Twitch route provider detection failed.')
assert(contract.providerForPathname('/kick/history/?period=30d') === 'kick', 'Kick route provider detection failed.')
assert(contract.providerForPathname('/about/') === 'portal', 'Portal route provider detection failed.')

const seenFiles = new Set()
const seenUrls = new Set()

for (const page of contract.PUBLIC_PAGE_CONTRACTS) {
  assert(!seenFiles.has(page.file), `${page.file}: duplicate file entry in canonical contract.`)
  seenFiles.add(page.file)

  const expectedUrl = contract.canonicalUrl(page.pathname)
  assert(!seenUrls.has(expectedUrl), `${page.file}: duplicate canonical URL ${expectedUrl}.`)
  seenUrls.add(expectedUrl)

  const source = read(page.file)
  if (!source) continue

  const canonicalValues = allValues(source, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["'][^>]*>/gi)
  const ogUrlValues = allValues(source, /<meta\s+property=["']og:url["']\s+content=["']([^"']+)["'][^>]*>/gi)

  assert(canonicalValues.length === 1, `${page.file}: expected exactly one canonical link; found ${canonicalValues.length}.`)
  assert(ogUrlValues.length === 1, `${page.file}: expected exactly one og:url; found ${ogUrlValues.length}.`)

  for (const [label, value] of [['canonical', canonicalValues[0]], ['og:url', ogUrlValues[0]]]) {
    if (!value) continue
    assert(value === expectedUrl, `${page.file}: ${label} ${value} does not match ${expectedUrl}.`)
    try {
      const parsed = new URL(value)
      assert(parsed.protocol === 'https:', `${page.file}: ${label} must use HTTPS.`)
      assert(parsed.hostname === 'vl.badjoke-lab.com', `${page.file}: ${label} must use vl.badjoke-lab.com.`)
      assert(parsed.port === '', `${page.file}: ${label} must not include a port.`)
      assert(parsed.username === '' && parsed.password === '', `${page.file}: ${label} must not include credentials.`)
      assert(parsed.search === '', `${page.file}: ${label} must not include query state.`)
      assert(parsed.hash === '', `${page.file}: ${label} must not include a hash.`)
      assert(parsed.pathname === page.pathname, `${page.file}: ${label} pathname ${parsed.pathname} does not match ${page.pathname}.`)
      assert(parsed.pathname === '/' || parsed.pathname.endsWith('/'), `${page.file}: ${label} must use a trailing slash.`)
      assert(!/\/{2,}/.test(parsed.pathname), `${page.file}: ${label} contains duplicate slashes.`)
    } catch {
      failures.push(`${page.file}: ${label} is not a valid absolute URL.`)
    }
  }

  assert(source.includes(`data-provider="${page.provider}"`), `${page.file}: data-provider must be ${page.provider}.`)
  assert(contract.providerForPathname(page.pathname) === page.provider, `${page.file}: route provider does not match ${page.provider}.`)
}

if (failures.length > 0) {
  console.error('ViewLoom canonical URL contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom canonical URL contract passed for ${contract.PUBLIC_PAGE_CONTRACTS.length} public pages.`)
console.log('- canonical and og:url are unique and identical')
console.log('- production origin, provider route, HTTPS, and trailing slash are fixed')
console.log('- query parameters and hashes remain share-state only and never enter canonical metadata')
