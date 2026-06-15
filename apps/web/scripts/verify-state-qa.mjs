import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

const contracts = [
  {
    path: 'src/live/twitch-heatmap.ts',
    required: [
      'No ${provider.label} snapshot yet',
      'No live records in this snapshot',
      'Failed to load ${provider.label} Heatmap',
      'renderRuntimeState',
      'The data path responded successfully',
      "cache: 'no-store'",
      'destroyCanvasScene',
      'renderCanvasScene({',
    ],
    forbiddenText: ['Stream A', '118.4K', 'renderHeatmapShell', 'createHeatmapViewport'],
  },
  {
    path: 'src/live/day-flow-current-shell-entry.ts',
    required: [
      'No observed Day Flow snapshots for this window.',
      'No stream detail is available for this window.',
      'Day Flow API unavailable:',
      "cache: 'no-store'",
    ],
    forbiddenText: ['Stream A', 'Shell ready for real data'],
  },
  {
    path: 'src/live/battle-lines-current-shell-entry.ts',
    required: [
      'No comparable pair exists in this observed window.',
      'No connected Battle Lines can be drawn for this observed window.',
      'No reversal detected in this observed window.',
      'No distinct battle event was detected in this observed window.',
      'Battle Lines is unavailable:',
      'drawable(',
      'missing',
      'offline',
      'not_observed',
      "cache: 'no-store'",
    ],
    forbiddenText: ['Stream A', '<svg viewBox="0 0 1210 560"', '.filter(isObservedPoint)'],
  },
  {
    path: 'src/live/history-current-shell-entry.ts',
    required: [
      'No retained history rollup is available yet.',
      'No retained streamer rollup is available yet.',
      'History API unavailable:',
      'buildRequestUrl()',
      "params.set('period', pageState.periodMode === '7d' ? '7d' : '30d')",
      "params.set('metric', pageState.metric)",
      "cache: 'no-store'",
    ],
    forbiddenText: ['Stream A', '<svg viewBox="0 0 1210 560"'],
  },
  {
    path: 'src/live/status-current-shell-entry.ts',
    required: [
      'No feature status rows are available yet.',
      'Status API unavailable:',
      'status api returned',
      'unknown',
      'error',
      'unconfigured',
      "cache: 'no-store'",
    ],
    forbiddenText: ['Shell ready for real data', '>Fresh<'],
  },
]

const publicPages = [
  'twitch/heatmap/index.html',
  'kick/heatmap/index.html',
  'twitch/day-flow/index.html',
  'kick/day-flow/index.html',
  'twitch/battle-lines/index.html',
  'kick/battle-lines/index.html',
  'twitch/history/index.html',
  'kick/history/index.html',
  'twitch/status/index.html',
  'kick/status/index.html',
]

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

for (const contract of contracts) {
  if (!existsSync(join(root, contract.path))) {
    failures.push(`${contract.path}: missing live state source`)
    continue
  }
  const source = read(contract.path)
  for (const fragment of contract.required) {
    if (!source.includes(fragment)) failures.push(`${contract.path}: missing state fragment: ${fragment}`)
  }
  for (const fragment of contract.forbiddenText) {
    if (source.includes(fragment)) failures.push(`${contract.path}: contains retired fallback fragment: ${fragment}`)
  }
}

for (const path of publicPages) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing public feature page`)
    continue
  }
  const source = read(path)
  for (const fragment of ['Stream A', 'Stream B', 'Stream C', '118.4K', '42.7K', '1.86M observed', '>Fresh<']) {
    if (source.includes(fragment)) failures.push(`${path}: contains static state fragment: ${fragment}`)
  }
}

const contractPath = 'docs/state-qa-contract.md'
if (!existsSync(join(root, contractPath))) {
  failures.push(`${contractPath}: missing state QA contract`)
} else {
  const source = read(contractPath)
  for (const fragment of ['Empty / Stale / Error State QA Contract', 'fake data', 'Status feature tables', 'static SVG charts']) {
    if (!source.includes(fragment)) failures.push(`${contractPath}: missing contract fragment: ${fragment}`)
  }
}

if (failures.length > 0) {
  console.error('ViewLoom state QA verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom state QA verification passed for ${contracts.length} live entries and ${publicPages.length} public feature pages.`)
