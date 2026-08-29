const MAPLIBRE_MODULE_URL = 'https://unpkg.com/maplibre-gl@6.4.1/dist/maplibre-gl.mjs'

void bootStreamMap()

async function bootStreamMap(): Promise<void> {
  try {
    const maplibregl = await import(/* @vite-ignore */ MAPLIBRE_MODULE_URL)
    window.maplibregl = maplibregl
  } catch (error) {
    console.warn('Stream Map renderer dependency failed to load.', error)
  }

  await import('./stream-map-entry-core')
}
