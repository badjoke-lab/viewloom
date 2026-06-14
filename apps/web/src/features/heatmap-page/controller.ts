import { legacyHeatmapPageAdapter } from './legacy-adapter'
import { createHeatmapPageRuntime } from './runtime'

const runtime = createHeatmapPageRuntime(legacyHeatmapPageAdapter)

export function mountHeatmapPage(): Promise<void> {
  return runtime.mount()
}

export function refreshHeatmapPage(): Promise<void> {
  return runtime.refresh()
}

export function destroyHeatmapPage(): void {
  runtime.destroy()
}

export function getHeatmapPageLifecycle() {
  return runtime.snapshot()
}
