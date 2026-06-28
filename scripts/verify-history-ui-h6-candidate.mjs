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

for (const path of [
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
]) needFile(path)

need('apps/web/scripts/history-ui-h2-chart-browser.mjs', [
  'candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null',
  'id: `${provider}-chart-${viewport.width}`',
])
need('apps/web/scripts/history-ui-h3-overview-browser.mjs', [
  'candidateHead: process.env.GITHUB_HEAD_SHA ?? process.env.GITHUB_SHA ?? null',
  'id: `${provider}-overview-${viewport.width}`',
])
need('apps/web/scripts/history-ui-h6-candidate-manifest.mjs', [
  "schema: 'viewloom-history-ui-h6-candidate-v1'",
  "phase: 'P9H6'",
  "source: 'deterministic-local-preview'",
  "phase: 'P9H1'", "phase: 'P9H2'", "phase: 'P9H3'",
  "phase: 'P9H4A'", "phase: 'P9H4B'", "phase: 'P9H5'",
  'candidate head mismatch', 'crossed provider endpoint',
  "createHash('sha256')", 'oneExactHead: true', 'oneBuild: true',
  'oneLocalPreview: true', 'providerSeparated: true',
])
need('.github/workflows/history-ui-h6-candidate.yml', [
  'name: History UI P9H6 Candidate',
  'Verify P9H6 repository contract',
  'Build web application once',
  'Start one local History preview',
  'Run P9H1 through P9H5 candidate evidence',
  'Build P9H6 candidate manifest',
  'Verify P9H6 candidate manifest',
  'history-ui-h6-candidate', 'cancel-in-progress: true',
])
need('docs/product/current-schedule.md', [
  'P9H6 Local candidate                     active',
  'Active implementation branch             work-history-ui-h6-candidate',
  'P9H6 Local candidate                     complete PR #449',
  'P9H6 canonical closeout                  complete PR #450',
  'Active implementation branch             none',
  'Exact next branch                        work-history-ui-h7-acceptance',
  'P9H7 branch created                      no',
  'Workflow run: 28308389704', 'Artifact ID: 7930159988',
  'viewloom-history-ui-h6-candidate-v1', 'Scenarios: 21',
])
need('docs/product/current-roadmap.md', [
  'Phase 9 P9H6 complete PR #449',
  'P9H6 canonical closeout complete PR #450',
  'Active implementation branch: none',
  'Exact next implementation branch: work-history-ui-h7-acceptance',
  'P9H7 branch created: no',
])
need('docs/product/post-watchlist-program-plan.md', [
  'Completed local candidate: PR #449',
  'Completed P9H6 canonical closeout: PR #450',
  'Exact next implementation branch after explicit continuation: `work-history-ui-h7-acceptance`',
])
need('docs/product/history-ui-repair-plan.md', [
  'Completed P9H6: PR #449',
  'Completed P9H6 canonical closeout: PR #450',
  'Exact next branch after explicit continuation: `work-history-ui-h7-acceptance`',
])
need('docs/work-in-progress/history-ui-repair-working-note.md', [
  'Completed P9H6: PR #449',
  'Completed P9H6 canonical closeout: PR #450',
  'Workflow run: 28308389704', 'Artifact ID: 7930159988',
])
need('docs/work-in-progress/p9h6-candidate.md', [
  'Status: complete', 'Implementation PR: #449', 'Canonical closeout PR: #450',
  'work-history-ui-h7-acceptance', 'P9H7 branch created: no',
])

if (issues.length) {
  console.error('ViewLoom History P9H6 candidate verification did not pass:')
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log('ViewLoom History P9H6 candidate verification passed.')
console.log('- P9H6 is complete through PR #449 and canonically closed through PR #450')
console.log('- one exact candidate HEAD, build, local preview, six phases, and twenty-one scenarios are protected')
console.log('- phase schemas, stable IDs, provider separation, and evidence digests are protected')
console.log('- work-history-ui-h7-acceptance is next and not created')
