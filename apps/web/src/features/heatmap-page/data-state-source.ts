import {
  createHeatmapErrorTruth,
  normalizeHeatmapDataTruth,
  type HeatmapProviderKey,
} from './data-state-core.mjs'
import { renderHeatmapDataTruth } from './data-state-dom'

let baseFetch: typeof window.fetch | null = null
let observedFetch: typeof window.fetch | null = null

export function installHeatmapResponseObserver(provider: HeatmapProviderKey): () => void {
  if (observedFetch) return removeHeatmapResponseObserver

  const endpoint = provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'
  baseFetch = window.fetch.bind(window)
  observedFetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isHeatmap = requestPath(input) === endpoint
    if (isHeatmap) {
      window.dispatchEvent(new CustomEvent('viewloom:heatmap-request-start', {
        detail: { provider },
      }))
    }
    try {
      const response = await baseFetch!(input, init)
      if (isHeatmap) readTruth(response.clone(), provider)
      return response
    } catch (error) {
      if (isHeatmap) {
        const message = error instanceof Error ? error.message : 'Heatmap request failed.'
        window.setTimeout(() => renderHeatmapDataTruth(createHeatmapErrorTruth(provider, message)), 0)
      }
      throw error
    }
  }) as typeof window.fetch
  window.fetch = observedFetch
  return removeHeatmapResponseObserver
}

function readTruth(response: Response, provider: HeatmapProviderKey): void {
  void response.json()
    .then((raw) => {
      window.dispatchEvent(new CustomEvent('viewloom:heatmap-response', {
        detail: { provider, raw },
      }))
      return normalizeHeatmapDataTruth(raw, provider)
    })
    .then((truth) => window.setTimeout(() => renderHeatmapDataTruth(truth), 0))
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Heatmap response could not be read.'
      window.setTimeout(() => renderHeatmapDataTruth(createHeatmapErrorTruth(provider, message)), 0)
    })
}

function requestPath(input: RequestInfo | URL): string {
  try {
    if (typeof input === 'string') return new URL(input, window.location.href).pathname
    if (input instanceof URL) return input.pathname
    return new URL(input.url, window.location.href).pathname
  } catch {
    return ''
  }
}

function removeHeatmapResponseObserver(): void {
  if (baseFetch && observedFetch && window.fetch === observedFetch) window.fetch = baseFetch
  baseFetch = null
  observedFetch = null
}
