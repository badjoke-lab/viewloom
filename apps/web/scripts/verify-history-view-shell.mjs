import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const requireFile = (path) => { if (!existsSync(join(root, path))) failures.push(`${path}: missing`) }
const requireFragment = (path, source, fragment) => { if (!source.includes(fragment)) failures.push(`${path}: missing ${fragment}`) }

const files = {
  contract: 'docs/history-view-shell-contract.md',
  shell: 'src/live/history-view-shell.ts',
  style: 'src/history-view-shell.css',
  entry: 'src/live/history-usability-pass.ts',
  browser: 'scripts/history-view-shell-browser.mjs',
  workflow: '../../.github/workflows/history-view-shell.yml',
  browserWorkflow: '../../.github/workflows/history-view-shell-browser.yml',
}

for (const path of Object.values(files)) requireFile(path)

if (existsSync(join(root, files.contract))) {
  const source = read(files.contract)
  for (const fragment of ['Overview', 'Archives', 'Report & Export', 'Back and Forward restore', 'must not issue another History API request', 'canonical Overview URL omits `view=overview`']) {
    requireFragment(files.contract, source, fragment)
  }
}

if (existsSync(join(root, files.shell))) {
  const source = read(files.shell)
  for (const fragment of [
    "type HistoryView = 'overview' | 'archives' | 'report'",
    "type HistoryArchiveView = 'daily' | 'peaks' | 'battles'",
    "window.addEventListener('popstate'",
    'nativePushState',
    'installReplaceStateBridge',
    'role="tablist"',
    'role="tabpanel"',
    'data-history-view-panel',
    'data-history-archive-panel',
    "url.searchParams.delete('view')",
    "url.searchParams.set('archive', state.archive)",
  ]) requireFragment(files.shell, source, fragment)
  if (/\bfetch\s*\(/.test(source)) failures.push(`${files.shell}: view switching must not fetch`)
}

if (existsSync(join(root, files.entry))) {
  const source = read(files.entry)
  for (const fragment of ["import '../history-view-shell.css'", "import './history-view-shell'", "import './history-default-day'"]) {
    requireFragment(files.entry, source, fragment)
  }
  if (source.indexOf("import './history-view-shell'") > source.indexOf("import './history-default-day'")) {
    failures.push(`${files.entry}: shell must install before dynamic History modules`)
  }
}

if (existsSync(join(root, files.browser))) {
  const source = read(files.browser)
  for (const fragment of [
    'data-history-view="archives"',
    'data-history-archive-view="peaks"',
    'data-history-view="report"',
    'goBack()',
    'goForward()',
    'view switching triggered another History request',
    'crossed provider endpoints',
  ]) requireFragment(files.browser, source, fragment)
}

for (const path of [files.workflow, files.browserWorkflow]) {
  if (!existsSync(join(root, path))) continue
  const source = read(path)
  for (const fragment of ['concurrency:', 'group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}', 'cancel-in-progress: true']) {
    requireFragment(path, source, fragment)
  }
}

if (failures.length) {
  console.error('History view shell verification failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('History view shell verification passed.')
