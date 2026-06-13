import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const failures = []

const contracts = [
  {
    path: 'src/live/twitch-heatmap.ts',
    required: [
      'No ${provider.label} snapshots yet.',
      'Snapshot exists, but payload items are empty.',
      'Failed to load ${provider.label} heatmap API:',
      'renderUnavailableSurfaceState',
      'API error',
      'Empty payload',
      'No snapshot yet',
    ],
    forbidden: [/Stream A|Stream B|Stream C/, /118\.4K|42\.7K|1\.86M observed/],
  },
  {
    path: 'src/live/day-flow-current-shell-entry.ts',
    required: [
      'No observed Day Flow snapshots for this window.',
      'No stream detail is available for this window.',
      'Day Flow API unavailable:',
      'cache: \'no-store\'',
    ],
    forbidden: [/Stream A|Stream B|Stream C/, /Shell ready for real data/i],
  },
  {
    path: 'src/live/battle-lines-current-shell-entry.ts',
    required: [
      'No selectable stream is available for this observed window.',
      'No connected Battle Lines can be drawn for this observed window.',
      'No distinct reversals or notable deltas were detected in this observed window.',
      'Battle Lines API unavailable:',
      'isObservedPoint',
      'missing',
      'offline',
      'not_observed',
      'cache: \'no-store\'',
    ],
    forbidden: [/Stream A|Stream B|Stream C/, /<svg viewBox="0 0 1210 560"/],
  },
  {
    path: 'src/live/history-current-shell-entry.ts',
    required: [
      'No retained history rollup is available yet.',
      'No retained streamer rollup is available yet.',
      'History API unavailable:',
      'period=30d',
      'cache: \'no-store\'',
    ],
    forbidden: [/Stream A|Stream B|Stream C/, /<svg viewBox="0 0 1210 560"/],
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
      'cache: \'no-store\'',
    ],
    forbidden: [/Shell ready for real data/i, />\s*Fresh\s*</],
  },
]

const publicPageForbidden = [
  { label: 'demo stream rows', pattern: /Stream A|Stream B|Stream C/ },
  { label: 'fake Twitch live number', pattern: />\s*287\s*</ },
  { label: 'fake Twitch largest number', pattern: /118\.4K/ },
  { label: 'fake Kick live number', pattern: />\s*83\s*</ },
  { label: 'fake Kick largest number', pattern: /42\.7K/ },
  { label: 'fake observed total', pattern: /1\.86M observed/ },
  { label: 'placeholder freshness', pattern: />\s*Fresh\s*</ },
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
  for (const pattern of contract.forbidden) {
    if (pattern.test(source)) failures.push(`${contract.path}: contains forbidden fallback pattern: ${pattern}`)
  }
}

for (const path of publicPages) {
  if (!existsSync(join(root, path))) {
    failures.push(`${path}: missing public feature page`)
    continue
  }
  const source = read(path)
  for (const { label, pattern } of publicPageForbidden) {
    if (pattern.test(source)) failures.push(`${path}: contains forbidden ${label}`)
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
