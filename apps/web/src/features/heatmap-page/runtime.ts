import type {
  HeatmapPageAdapter,
  HeatmapPageLifecycleSnapshot,
  HeatmapPageLifecycleState,
  HeatmapPageRuntime,
} from './contracts'

export function createHeatmapPageRuntime(adapter: HeatmapPageAdapter): HeatmapPageRuntime {
  let state: HeatmapPageLifecycleState = 'idle'
  let generation = 0
  let lastError: Error | null = null
  let activeRun: Promise<void> | null = null
  let queuedRefresh = false

  const snapshot = (): HeatmapPageLifecycleSnapshot => ({
    state,
    generation,
    lastError,
  })

  const run = (kind: 'mount' | 'refresh'): Promise<void> => {
    if (state === 'destroyed') return Promise.resolve()

    if (activeRun) {
      queuedRefresh = true
      return activeRun
    }

    activeRun = (async () => {
      let nextKind = kind

      do {
        queuedRefresh = false
        state = nextKind === 'mount' && generation === 0 ? 'mounting' : 'refreshing'
        lastError = null

        try {
          if (nextKind === 'mount') await adapter.mount()
          else await adapter.refresh()
          generation += 1
          state = 'mounted'
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          state = 'failed'
          throw lastError
        }

        nextKind = 'refresh'
      } while (queuedRefresh && state !== 'destroyed')
    })().finally(() => {
      activeRun = null
    })

    return activeRun
  }

  return {
    mount: () => run('mount'),
    refresh: () => run('refresh'),
    destroy: () => {
      if (state === 'destroyed') return
      adapter.destroy()
      queuedRefresh = false
      state = 'destroyed'
    },
    snapshot,
  }
}
