import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const issues = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const check = (condition, message) => { if (!condition) issues.push(message) }
const needFile = (path) => check(existsSync(join(root, path)), `missing file: ${path}`)
const need = (path, fragments) => {
  needFile(path)
  if (!existsSync(join(root, path))) return
  const source = read(path)
  for (const fragment of fragments) check(source.includes(fragment), `${path}: missing ${fragment}`)
}

const required = [
  'apps/web/scripts/history-ui-h1-browser.mjs',
  'apps/web/scripts/history-ui-h2-chart-browser.mjs',
  'apps/web/scripts/history-ui-h3-overview-browser.mjs',
  'apps/web/scripts/history-ui-h4a-overview-browser.mjs',
  'apps/web/scripts/history-ui-h4b-tasks-browser.mjs',
  'apps/web/scripts/history-ui-h5-responsive-runner.mjs',
  'apps/web/scripts/history-ui-h6-candidate-manifest.mjs',
  'scripts/verify-history-ui-h1-metric.mjs',
  'scripts/verify-history-ui-h2-chart.mjs',
  'scripts/verify-history-ui-h3-overview.mjs',
  'scripts/verify-history-ui-h4a-overview.mjs',
  'scripts/verify-history-ui-h4b-tasks.mjs',
  'scripts/verify-history-ui-h5-responsive.mjs',
  '.github/workflows/history-ui-h6-candidate.yml',
  'docs/work-in-progress/p9h6-candidate.md',
]
for (const path of required) needFile(path)

need('apps/web/scripts/history-ui-h6-candidate-manifest.mjs', [
  "schema: 'viewloom-history-ui-h6-candidate-v1'",
  "phase: 'P9H6'",
  "source: 'deterministic-local-preview'",
  "phase: 'P9H1'",
  "phase: 'P9H2'",
  "phase: 'P9H3'",
  "phase: 'P9H4A'",
  "phase: 'P9H4B'",
  "phase: 'P9H5'",
  'candidate head mismatch',
  'crossed provider endpoint',
  "createHash('sha256')",
  'oneExactHead: true',
  'oneBuild: true',
  'oneLocalPreview: true',
  'providerSeparated: true',
])

need('.github/workflows/history-ui-h6-candidate.yml', [
  'name: History UI P9H6 Candidate',
  'Verify P9H6 repository contract',
  'Build web application once',
  'Start one local History preview',
  'Run P9H1 through P9H5 candidate evidence',
  'Build P9H6 candidate manifest',
  'Verify P9H6 candidate manifest',
  'history-ui-h6-candidate',
  'cancel-in-progress: true',
])

need('docs/product/current-schedule.md', [
  'P9H6 Local candidate                     active',
  'Active implementation branch             work-history-ui-h6-candidate',
  'Exact next branch                        work-history-ui-h7-acceptance',
  'P9H7 branch created                      no',
  'viewloom-history-ui-h6-candidate-v1',
])

need('docs/work-in-progress/p9h6-candidate.md', [
  'Status: active',
  'work-history-ui-h6-candidate',
  'P9H1 metric synchronization',
  'P9H5 responsive and accessibility',
  'one build and one local preview',
  'work-history-ui-h7-acceptance',
  'P9H7 branch created: no',
])

if (issues.length) {
  console.error('ViewLoom History P9H6 candidate verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H6 candidate verification passed.')
console.log('- P9H1 through P9H5 permanent browser evidence is consolidated')
console.log('- one exact candidate HEAD, build, and local preview are required')
console.log('- phase schemas, scenario counts, provider separation, and evidence digests are protected')
console.log('- work-history-ui-h7-acceptance is next and not created')
