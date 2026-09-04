type StyleLayer = {
  id: string
  type: string
  source?: string
  'source-layer'?: string
  layout?: { visibility?: string }
}

type CountryBasemapMap = {
  on(event: 'load', handler: () => void): void
  getStyle(): { layers?: StyleLayer[] }
  setLayoutProperty(layerId: string, name: string, value: unknown): void
}

type AnyMapConstructor = new (...args: any[]) => any

type MapLibreNamespace = {
  Map?: AnyMapConstructor
}

const requestedCity = new URL(window.location.href).searchParams.get('geography') === 'city'

if (!requestedCity) installCountryBasemapPruner()

function installCountryBasemapPruner(): void {
  const namespace = (window as unknown as { maplibregl?: MapLibreNamespace }).maplibregl
  const ExistingMap = namespace?.Map
  if (!namespace || !ExistingMap) return

  namespace.Map = new Proxy(ExistingMap, {
    construct(target, args, newTarget) {
      const map = Reflect.construct(target, args, newTarget) as CountryBasemapMap
      map.on('load', () => pruneCountryBasemap(map))
      return map
    },
  })
}

function pruneCountryBasemap(map: CountryBasemapMap): void {
  const layers = map.getStyle().layers ?? []
  let hidden = 0
  let retained = 0

  for (const layer of layers) {
    if (keepCountryLayer(layer)) {
      retained += 1
      continue
    }
    try {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
      hidden += 1
    } catch {
      // A style layer can disappear while MapLibre is resolving the style. The
      // Country renderer remains usable; only count layers that were pruned.
    }
  }

  const root = document.querySelector<HTMLElement>('#stream-map-root')
  if (root) {
    root.dataset.countryBasemap = 'minimal'
    root.dataset.countryBasemapHiddenLayers = String(hidden)
    root.dataset.countryBasemapRetainedLayers = String(retained)
  }
}

function keepCountryLayer(layer: StyleLayer): boolean {
  if (layer.id.startsWith('viewloom-country-regions')) return true
  if (layer.type === 'background') return true

  const key = `${layer.id} ${layer.source ?? ''} ${layer['source-layer'] ?? ''}`.toLowerCase()

  if (layer.type === 'fill') {
    return containsAny(key, ['water', 'ocean', 'sea'])
  }

  if (layer.type === 'line') {
    return containsAny(key, ['boundary', 'admin', 'coast'])
  }

  if (layer.type === 'symbol') {
    return key.includes('country')
      && !containsAny(key, ['road', 'route', 'airport', 'transit', 'poi', 'city', 'town', 'village'])
  }

  return false
}

function containsAny(value: string, tokens: string[]): boolean {
  return tokens.some((token) => value.includes(token))
}

export {}
