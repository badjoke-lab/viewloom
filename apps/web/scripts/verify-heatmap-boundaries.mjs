import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const failures = []

const paths = {
  entry: 'src/live/heatmap-current-shell-entry.ts',
  contracts: 'src/features/heatmap-page/contracts.ts',
  runtime: 'src/features/heatmap-page/runtime.ts',
  controller: 'src/features/heatmap-page/controller.ts',
  adapter: 'src/features/heatmap-page/data-truth-adapter.ts',
}

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function requireFile(path) {
  if (!existsSync(join(root, path))) failures.push(`${path}: missing file`)
}

function requireFragment(path, source, fragment) {
  if (!source.includes(fragment)) failures.push(`${path}: missing ${JSON.stringify(fragment)}`)
}

for (const path of Object.values(paths)) requireFile(path)

if (!failures.length) {
  const entry = read(paths.entry)
  requireFragment(paths.entry, entry, '../features/heatmap-page/controller')
  requireFragment(paths.entry, entry, 'mountHeatmapPage')
  if (entry.includes('./twitch-heatmap')) failures.push(`${paths.entry}: direct monolith import returned`)

  const contracts = read(paths.contracts)
  for (const fragment of ["'fetch'", "'state'", "'layout'", "'renderer'", "'inspector'", "'status'", 'HeatmapPageAdapter', 'HeatmapPageRuntime']) {
    requireFragment(paths.contracts, contracts, fragment)
  }

  const runtime = read(paths.runtime)
  for (const fragment of ['createHeatmapPageRuntime', 'queuedRefresh', 'destroyRequested', "'mounting'", "'refreshing'", "'mounted'", "'failed'", "'destroyed'"]) {
    requireFragment(paths.runtime, runtime, fragment)
  }

  const controller = read(paths.controller)
  for (const fragment of ['data-truth-adapter', 'mountHeatmapPage', 'refreshHeatmapPage', 'destroyHeatmapPage', 'getHeatmapPageLifecycle']) {
    requireFragment(paths.controller, controller, fragment)
  }

  const adapter = read(paths.adapter)
  for (const fragment of ['../../live/twitch-heatmap', 'installHeatmapResponseObserver', "boundaries: ['fetch', 'state', 'layout', 'renderer', 'inspector', 'status']"]) {
    requireFragment(paths.adapter, adapter, fragment)
  }
}

if (failures.length) {
  console.error('Heatmap boundary verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Heatmap page boundary verification passed.')
