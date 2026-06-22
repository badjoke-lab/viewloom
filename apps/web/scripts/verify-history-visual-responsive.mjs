import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const files = {
  contract: 'docs/history-visual-responsive-h5-contract.md',
  style: 'src/history-visual-responsive.css',
  module: 'src/live/history-visual-responsive.ts',
  entry: 'src/live/history-usability-pass.ts',
  browser: 'scripts/history-visual-responsive-browser.mjs',
  workflow: '../../.github/workflows/history-visual-responsive.yml',
  browserWorkflow: '../../.github/workflows/history-visual-responsive-browser.yml',
}
const read = (path) => readFileSync(join(root, path), 'utf8')
const need = (path, source, fragment) => {
  if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`)
}

Object.values(files).forEach((path) => {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing`)
})

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of [
    'consistent visible focus ring',
    'non-color symbol',
    'data-history-viewport=desktop|tablet|mobile',
    'no page-level horizontal overflow',
    'prefers-reduced-motion: reduce',
    'No History API, D1 schema, collector, cron, retention',
  ]) need(files.contract, source, fragment)
}

if (existsSync(join(root, files.style))) {
  const source = read(files.style)
  for (const fragment of [
    '--history-section-gap:28px',
    ':focus-visible',
    'outline:3px solid var(--history-focus)!important',
    '.history-state-pill::before',
    'data-history-visual-state="partial"',
    '@media(max-width:1180px)',
    '@media(max-width:760px)',
    '@media(max-width:430px)',
    '@media(prefers-reduced-motion:reduce)',
    'overflow-x:hidden',
    'min-height:48px',
  ]) need(files.style, source, fragment)
  if (/background\s*:\s*(?:#fff(?:fff)?|white)\b/i.test(source)) failures.push(`${files.style}: valid-data white surface introduced`)
}

if (existsSync(join(root, files.module))) {
  const source = read(files.module)
  for (const fragment of [
    'data-history-state-pill',
    "window.matchMedia('(max-width: 760px)')",
    "window.matchMedia('(max-width: 1180px)')",
    'page.dataset.historyVisualState',
    'page.dataset.historyViewport',
    "page.dataset.historyVisualReady = 'true'",
    'MutationObserver',
  ]) need(files.module, source, fragment)
  if (/\bfetch\s*\(/.test(source)) failures.push(`${files.module}: visual layer must not fetch History data`)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  need(files.entry, source, "import '../history-visual-responsive.css'")
  need(files.entry, source, "import './history-visual-responsive'")
  const styleIndex = source.indexOf("import '../history-visual-responsive.css'")
  const archiveIndex = source.indexOf("import '../history-archives.css'")
  if (styleIndex < archiveIndex) failures.push(`${files.entry}: final visual layer must load after archive styles`)
}

if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of [
    'Twitch desktop Overview',
    'Kick desktop Archives',
    'Twitch tablet Report',
    'Kick mobile cross-view',
    'horizontal overflow',
    'focus ring',
    'reduced motion',
    'History API was fetched again',
  ]) need(files.browser, source, fragment)
}

for (const path of [files.workflow, files.browserWorkflow]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of [
    'concurrency:',
    'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}',
    'cancel-in-progress: true',
  ]) need(path, source, fragment)
}

if (failures.length) {
  console.error('History visual and responsive H5 verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('History visual and responsive H5 verification passed.')
