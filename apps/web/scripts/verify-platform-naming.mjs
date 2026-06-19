import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFragment = (path, source, fragment) => {
  if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}
const forbidFragment = (path, source, fragment) => {
  if (source.includes(fragment)) failures.push(`${path}: forbidden ${fragment}`)
}

const pages = [
  {
    path: 'twitch/battle-lines/index.html',
    title: 'Battle Lines for Twitch live streams | ViewLoom',
    eyebrow: 'TWITCH DATA · RIVALRY',
    h1: '<h1>Battle Lines</h1>',
  },
  {
    path: 'kick/battle-lines/index.html',
    title: 'Battle Lines for Kick live streams | ViewLoom',
    eyebrow: 'KICK DATA · RIVALRY',
    h1: '<h1>Battle Lines</h1>',
  },
  {
    path: 'twitch/status/index.html',
    title: 'Data Status for Twitch live streams | ViewLoom',
    eyebrow: 'TWITCH DATA · STATUS',
    h1: '<h1>Data Status</h1>',
  },
  {
    path: 'kick/status/index.html',
    title: 'Data Status for Kick live streams | ViewLoom',
    eyebrow: 'KICK DATA · STATUS',
    h1: '<h1>Data Status</h1>',
  },
]

for (const page of pages) {
  const source = read(page.path)
  requireFragment(page.path, source, `<title>${page.title}</title>`)
  requireFragment(page.path, source, `<meta property="og:title" content="${page.title}"`)
  requireFragment(page.path, source, `<meta name="twitter:title" content="${page.title}"`)
  requireFragment(page.path, source, page.eyebrow)
  requireFragment(page.path, source, page.h1)
  requireFragment(page.path, source, '>Twitch data</a>')
  requireFragment(page.path, source, '>Kick data</a>')
}

for (const [path, forbidden] of [
  ['twitch/battle-lines/index.html', 'TWITCH DATA · RIVALRY RADAR'],
  ['kick/battle-lines/index.html', 'KICK DATA · RIVALRY RADAR'],
  ['twitch/status/index.html', '<h1>Twitch data status</h1>'],
  ['kick/status/index.html', '<h1>Kick data status</h1>'],
  ['twitch/battle-lines/index.html', 'Twitch Battle Lines — ViewLoom'],
  ['kick/battle-lines/index.html', 'Kick Battle Lines — ViewLoom'],
]) forbidFragment(path, read(path), forbidden)

const about = read('about/index.html')
for (const fragment of ['independent, unofficial', 'not affiliated with, endorsed by, or operated by Twitch or Kick']) {
  requireFragment('about/index.html', about, fragment)
}

const contract = read('docs/platform-naming-contract.md')
for (const fragment of ['ViewLoom is the product name', 'TWITCH DATA · RIVALRY', 'Data Status for Kick live streams | ViewLoom', 'Cloudflare deployment configuration']) {
  requireFragment('docs/platform-naming-contract.md', contract, fragment)
}

if (failures.length) {
  console.error('ViewLoom platform naming verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom platform naming verification passed for ${pages.length} provider pages.`)
