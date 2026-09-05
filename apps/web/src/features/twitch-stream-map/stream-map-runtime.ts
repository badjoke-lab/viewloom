export type StreamMapRuntimeMap = {
  addControl(control: object, position?: string): void
  scrollZoom: { disable(): void }
  on(event: 'load' | 'error', handler: () => void): void
}

type StreamMapRuntimeListener = (map: StreamMapRuntimeMap | null) => void

let runtimeMap: StreamMapRuntimeMap | null = null
const listeners = new Set<StreamMapRuntimeListener>()

export function publishStreamMapRuntimeMap(map: StreamMapRuntimeMap | null): void {
  runtimeMap = map
  for (const listener of listeners) listener(runtimeMap)
}

export function getStreamMapRuntimeMap(): StreamMapRuntimeMap | null {
  return runtimeMap
}

export function subscribeStreamMapRuntimeMap(listener: StreamMapRuntimeListener): () => void {
  listeners.add(listener)
  listener(runtimeMap)
  return () => listeners.delete(listener)
}
