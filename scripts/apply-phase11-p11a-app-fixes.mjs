import { readFileSync, writeFileSync } from 'node:fs'

const files = new Map()

function load(path) {
  if (!files.has(path)) files.set(path, readFileSync(path, 'utf8'))
  return files.get(path)
}

function replaceStable(path, before, after) {
  const source = load(path)
  if (source.includes(after)) return
  if (!source.includes(before)) throw new Error(`${path}: expected source fragment not found`)
  files.set(path, source.replace(before, after))
}

function replaceCount(path, before, after, expectedCount) {
  const source = load(path)
  const currentCount = source.split(before).length - 1
  if (currentCount === 0 && source.includes(after)) return
  if (currentCount !== expectedCount) throw new Error(`${path}: expected ${expectedCount} occurrences, found ${currentCount}`)
  files.set(path, source.split(before).join(after))
}

replaceStable(
  'apps/web/src/battle-lines-entry.ts',
  '    primaryPair,\n    secondaryPairs,',
  '    primaryPair: primaryPair ?? undefined,\n    secondaryPairs,',
)

replaceStable(
  'apps/web/src/battle-lines-status-entry.ts',
  'return { lines, primaryPair, secondaryPairs, events, status, sourceText: buildSourceText(payload, status), recommendedQuality: normalizeQuality(payload.recommendedQuality ?? payload.recommended_quality) }',
  'return { lines, primaryPair: primaryPair ?? undefined, secondaryPairs, events, status, sourceText: buildSourceText(payload, status), recommendedQuality: normalizeQuality(payload.recommendedQuality ?? payload.recommended_quality) }',
)

replaceStable(
  'apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts',
  "  if (!inspector) return () => undefined\n\n  const media = window.matchMedia(MOBILE_QUERY)",
  "  if (!inspector) return () => undefined\n  const inspectorElement: HTMLElement = inspector\n\n  const media = window.matchMedia(MOBILE_QUERY)",
)
replaceCount('apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts', 'inspector.setAttribute(', 'inspectorElement.setAttribute(', 7)
replaceCount('apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts', 'inspector.removeAttribute(', 'inspectorElement.removeAttribute(', 8)
replaceCount('apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts', 'inspector.classList.', 'inspectorElement.classList.', 2)
replaceStable('apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts', 'ensureSheetBar(inspector)', 'ensureSheetBar(inspectorElement)')
replaceStable('apps/web/src/features/heatmap-page/mobile-inspector-sheet.ts', 'focusableElements(inspector)', 'focusableElements(inspectorElement)')

replaceStable(
  'apps/web/src/features/twitch-heatmap/canvas-scene.ts',
  '  if (!viewport || !statusLive || !hintLabel || !zoomOutButton || !zoomBaseButton || !zoomInButton || !resetButton || !refreshButton || !moveButton || !tilesCanvas || !overlayCanvas) return\n\n  let viewportWidth',
  '  if (!viewport || !statusLive || !hintLabel || !zoomOutButton || !zoomBaseButton || !zoomInButton || !resetButton || !refreshButton || !moveButton || !tilesCanvas || !overlayCanvas) return\n  const overlayCanvasElement: HTMLCanvasElement = overlayCanvas\n\n  let viewportWidth',
)
replaceCount('apps/web/src/features/twitch-heatmap/canvas-scene.ts', 'getGestureState(overlayCanvas, activePointers)', 'getGestureState(overlayCanvasElement, activePointers)', 2)

replaceStable(
  'apps/web/src/history-unify.ts',
  '  if (!main || !heroActions) return',
  '  if (!main || !hero || !heroActions) return',
)

replaceStable(
  'apps/web/src/label-risk-cleanup.ts',
  "function patchHero(): void {\n  if (!route.platform || !route.feature) return\n  const eyebrow",
  "function patchHero(): void {\n  const platform = route.platform\n  const feature = route.feature\n  if (!platform || !feature) return\n  const eyebrow",
)
replaceStable('apps/web/src/label-risk-cleanup.ts', 'getHeroEyebrow(route.platform, getFeatureRole(route.feature))', 'getHeroEyebrow(platform, getFeatureRole(feature))')
replaceStable('apps/web/src/label-risk-cleanup.ts', 'getFeatureTitle(route.feature)', 'getFeatureTitle(feature)')
replaceStable('apps/web/src/label-risk-cleanup.ts', 'ROUTE_COPY[route.feature]', 'ROUTE_COPY[feature]')
replaceStable('apps/web/src/label-risk-cleanup.ts', 'setText(label, getUnofficialBadge(route.platform))', 'setText(label, getUnofficialBadge(platform))')

replaceStable(
  'apps/web/src/live/history-report-text-state.ts',
  "  const top = streamers.reduce<HistoryReportStreamer | null>((best, streamer) => {\n    if (!best) return streamer\n    return streamerMetricValue(streamer, metric) > streamerMetricValue(best, metric) ? streamer : best\n  }, null)",
  "  const top = streamers.reduce<HistoryReportStreamer | null>((best, streamer) => {\n    if (!best) return streamer\n    const streamerValue = streamerMetricValue(streamer, metric)\n    const bestValue = streamerMetricValue(best, metric)\n    if (streamerValue === undefined || bestValue === undefined) return best\n    return streamerValue > bestValue ? streamer : best\n  }, null)",
)

replaceStable(
  'apps/web/src/live/twitch-day-flow.ts',
  "const app = document.querySelector<HTMLDivElement>('#app')\nif (!app) throw new Error('#app not found')\n\nconst numberFmt",
  "const app = document.querySelector<HTMLDivElement>('#app')\nif (!app) throw new Error('#app not found')\nconst appRoot: HTMLDivElement = app\n\nconst numberFmt",
)
replaceStable('apps/web/src/live/twitch-day-flow.ts', '  app.innerHTML = `', '  appRoot.innerHTML = `')
replaceCount('apps/web/src/live/twitch-day-flow.ts', '  app.addEventListener(', '  appRoot.addEventListener(', 3)

replaceStable(
  'apps/web/src/live/twitch-heatmap.ts',
  "    if (!data.latest) {\n      stage.innerHTML = renderRuntimeState(`No ${provider.label} snapshot yet`, `${provider.storageLabel} is connected, but no latest snapshot is available.`)\n      return\n    }\n\n    const payload = parsePayload(data.latest.payload_json)",
  "    if (!data.latest) {\n      stage.innerHTML = renderRuntimeState(`No ${provider.label} snapshot yet`, `${provider.storageLabel} is connected, but no latest snapshot is available.`)\n      return\n    }\n    const latest = data.latest\n\n    const payload = parsePayload(latest.payload_json)",
)
replaceStable('apps/web/src/live/twitch-heatmap.ts', '      latest: data.latest,', '      latest,')
replaceCount('apps/web/src/live/twitch-heatmap.ts', 'syncSelectedStreamBridge(item, data.latest, provider)', 'syncSelectedStreamBridge(item, latest, provider)', 1)
replaceCount('apps/web/src/live/twitch-heatmap.ts', 'syncSelectedStreamBridge(initial, data.latest, provider)', 'syncSelectedStreamBridge(initial, latest, provider)', 1)

replaceStable(
  'apps/web/src/live/watchlist-page.ts',
  "const provider = document.body.dataset.provider as WatchlistProvider | undefined\nif (provider !== 'twitch' && provider !== 'kick') {\n  throw new Error('Local Watchlist provider is missing.')\n}\n\nconst providerName",
  "const providerValue = document.body.dataset.provider\nif (providerValue !== 'twitch' && providerValue !== 'kick') {\n  throw new Error('Local Watchlist provider is missing.')\n}\nconst provider: WatchlistProvider = providerValue\n\nconst providerName",
)

for (const [path, source] of files) writeFileSync(path, source)
console.log(`Applied P11A App strict-null fixes to ${files.size} files.`)
