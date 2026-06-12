import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

const publicPages = [
  'index.html',
  'about/index.html',
  'support/index.html',
  'twitch/index.html',
  'twitch/heatmap/index.html',
  'twitch/day-flow/index.html',
  'twitch/battle-lines/index.html',
  'twitch/history/index.html',
  'twitch/status/index.html',
  'kick/index.html',
  'kick/heatmap/index.html',
  'kick/day-flow/index.html',
  'kick/battle-lines/index.html',
  'kick/history/index.html',
  'kick/status/index.html',
]

const qaScripts = [
  'scripts/verify-production-source.mjs',
  'scripts/verify-heatmap-qa.mjs',
  'scripts/verify-dayflow-qa.mjs',
  'scripts/verify-battle-lines-qa.mjs',
  'scripts/verify-history-qa.mjs',
  'scripts/verify-status-qa.mjs',
  'scripts/verify-home-qa.mjs',
  'scripts/verify-content-qa.mjs',
  'scripts/verify-seo-qa.mjs',
  'scripts/verify-mobile-qa.mjs',
  'scripts/verify-state-qa.mjs',
  'scripts/verify-launch-readiness.mjs',
]

const qaContracts = [
  'docs/heatmap-qa-contract.md',
  'docs/dayflow-qa-contract.md',
  'docs/battle-lines-qa-contract.md',
  'docs/history-qa-contract.md',
  'docs/status-qa-contract.md',
  'docs/home-qa-contract.md',
  'docs/content-qa-contract.md',
  'docs/seo-qa-contract.md',
  'docs/mobile-qa-contract.md',
  'docs/state-qa-contract.md',
  'docs/launch-readiness-contract.md',
  'docs/launch-snapshot-handoff.md',
]

const requiredLogs = [
  'apps/web/source-gate.log',
  'apps/web/heatmap-qa.log',
  'apps/web/dayflow-qa.log',
  'apps/web/battle-lines-qa.log',
  'apps/web/history-qa.log',
  'apps/web/status-qa.log',
  'apps/web/home-qa.log',
  'apps/web/content-qa.log',
  'apps/web/seo-qa.log',
  'apps/web/mobile-qa.log',
  'apps/web/state-qa.log',
  'apps/web/launch-readiness.log',
]

const liveEntryByPage = new Map([
  ['twitch/heatmap/index.html', '/src/live/heatmap-current-shell-entry.ts'],
  ['kick/heatmap/index.html', '/src/live/heatmap-current-shell-entry.ts'],
  ['twitch/day-flow/index.html', '/src/live/day-flow-current-shell-entry.ts'],
  ['kick/day-flow/index.html', '/src/live/day-flow-current-shell-entry.ts'],
  ['twitch/battle-lines/index.html', '/src/live/battle-lines-current-shell-entry.ts'],
  ['kick/battle-lines/index.html', '/src/live/battle-lines-current-shell-entry.ts'],
  ['twitch/history/index.html', '/src/live/history-current-shell-entry.ts'],
  ['kick/history/index.html', '/src/live/history-current-shell-entry.ts'],
  ['twitch/status/index.html', '/src/live/status-current-shell-entry.ts'],
  ['kick/status/index.html', '/src/live/status-current-shell-entry.ts'],
])

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

for (const page of publicPages) {
  if (!existsSync(join(root, page))) {
    failures.push(`${page}: missing public page`)
    continue
  }
  const source = read(page)
  for (const fragment of ['<title>', '<meta name="description"', '<meta name="viewport"', 'class="masthead"', 'class="footer"']) {
    if (!source.includes(fragment)) failures.push(`${page}: missing launch fragment: ${fragment}`)
  }
  const liveEntry = liveEntryByPage.get(page)
  if (liveEntry && !source.includes(liveEntry)) failures.push(`${page}: missing live entry ${liveEntry}`)
  for (const pattern of [/Stream A|Stream B|Stream C/, /118\.4K|42\.7K|1\.86M observed/, />\s*Fresh\s*</, /Shell ready for real data/i]) {
    if (pattern.test(source)) failures.push(`${page}: contains forbidden launch fallback ${pattern}`)
  }
}

for (const script of qaScripts) {
  if (!existsSync(join(root, script))) failures.push(`${script}: missing launch QA script`)
}

for (const contract of qaContracts) {
  if (!existsSync(join(root, contract))) failures.push(`${contract}: missing launch QA contract`)
}

const workflowPath = '../../.github/workflows/web-verification.yml'
const workflowAbs = join(root, workflowPath)
if (!existsSync(workflowAbs)) {
  failures.push('.github/workflows/web-verification.yml: missing workflow')
} else {
  const workflow = read(workflowPath)
  for (const script of qaScripts) {
    if (!workflow.includes(script)) failures.push(`web-verification.yml: missing workflow step for ${script}`)
  }
  for (const log of requiredLogs) {
    if (!workflow.includes(log)) failures.push(`web-verification.yml: missing artifact log ${log}`)
  }
  if (!workflow.includes('name: web-verification-logs')) failures.push('web-verification.yml: missing consolidated artifact name')
}

const ciContractPath = 'docs/ci-verification-contract.md'
if (!existsSync(join(root, ciContractPath))) {
  failures.push(`${ciContractPath}: missing CI verification contract`)
} else {
  const source = read(ciContractPath)
  for (const fragment of ['verify-launch-readiness.mjs', 'launch-readiness.log', 'Launch readiness']) {
    if (!source.includes(fragment)) failures.push(`${ciContractPath}: missing launch readiness fragment ${fragment}`)
  }
}

const launchContractPath = 'docs/launch-readiness-contract.md'
if (!existsSync(join(root, launchContractPath))) {
  failures.push(`${launchContractPath}: missing launch readiness contract`)
} else {
  const source = read(launchContractPath)
  for (const fragment of ['Public page inventory', 'Required QA gates', 'Required artifacts', 'Launch posture']) {
    if (!source.includes(fragment)) failures.push(`${launchContractPath}: missing launch contract fragment ${fragment}`)
  }
}

const handoffPath = 'docs/launch-snapshot-handoff.md'
if (!existsSync(join(root, handoffPath))) {
  failures.push(`${handoffPath}: missing launch snapshot handoff`)
} else {
  const source = read(handoffPath)
  for (const fragment of ['Current baseline', 'Public page inventory', 'Active QA gates', 'Next PR schedule', 'Rules for future work']) {
    if (!source.includes(fragment)) failures.push(`${handoffPath}: missing handoff fragment ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('ViewLoom launch readiness verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom launch readiness verification passed for ${publicPages.length} public pages and ${qaScripts.length} QA scripts.`)
