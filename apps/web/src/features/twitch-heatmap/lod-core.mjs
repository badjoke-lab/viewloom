const LEVELS = Object.freeze({
  FILL: 0,
  SHORT: 1,
  NAME: 2,
  VIEWERS: 3,
  MOMENTUM: 4,
  DETAIL: 5,
})

export function resolveHeatmapLod(input) {
  const screenWidth = positive(input?.screenWidth)
  const screenHeight = positive(input?.screenHeight)
  const screenArea = screenWidth * screenHeight
  const shortEdge = Math.min(screenWidth, screenHeight)
  const isSelected = Boolean(input?.isSelected)

  let level
  if (screenWidth < 12 || screenHeight < 10 || screenArea < 220) {
    level = LEVELS.FILL
  } else if (shortEdge < 18 || screenArea < 900) {
    level = LEVELS.SHORT
  } else if (shortEdge < 28 || screenArea < 2400) {
    level = LEVELS.NAME
  } else if (shortEdge < 40 || screenArea < 5600) {
    level = LEVELS.VIEWERS
  } else if (shortEdge < 58 || screenArea < 13000) {
    level = LEVELS.MOMENTUM
  } else {
    level = LEVELS.DETAIL
  }

  if (isSelected && level === LEVELS.MOMENTUM && shortEdge >= 48 && screenArea >= 9800) {
    level = LEVELS.DETAIL
  }

  return {
    level,
    titleMode: level === LEVELS.FILL ? 'none' : level === LEVELS.SHORT ? 'short' : 'display',
    titleLines: level >= LEVELS.MOMENTUM ? 2 : level >= LEVELS.NAME ? 1 : 0,
    showViewers: level >= LEVELS.VIEWERS,
    showMomentum: level >= LEVELS.MOMENTUM,
    showActivity: level >= LEVELS.DETAIL,
    showLogin: level >= LEVELS.DETAIL,
    showRank: level >= LEVELS.DETAIL,
    paddingPx: clamp(shortEdge * 0.075, 4, 14),
    titleFontPx: titleFont(level, screenWidth, screenHeight),
    metricFontPx: metricFont(level, screenWidth, screenHeight),
    detailFontPx: clamp(Math.min(screenWidth * 0.055, screenHeight * 0.105), 9, 12),
  }
}

export function makeShortLabel(value, maxGraphemes = 4) {
  const normalized = normalizeLabel(value)
  if (!normalized) return ''
  const firstToken = normalized.split(/[\s_\-–—]+/u).find(Boolean) || normalized
  return segmentGraphemes(firstToken).slice(0, Math.max(1, maxGraphemes)).join('')
}

export function segmentGraphemes(value) {
  const normalized = normalizeLabel(value)
  if (!normalized) return []
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(normalized), (entry) => entry.segment)
  }
  return Array.from(normalized)
}

export function normalizeLabel(value) {
  return typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : ''
}

export { LEVELS as HEATMAP_LOD_LEVELS }

function titleFont(level, width, height) {
  if (level <= LEVELS.SHORT) return clamp(Math.min(width * 0.2, height * 0.42), 8, 11)
  if (level === LEVELS.NAME) return clamp(Math.min(width * 0.16, height * 0.32), 10, 13)
  if (level === LEVELS.VIEWERS) return clamp(Math.min(width * 0.13, height * 0.25), 11, 15)
  if (level === LEVELS.MOMENTUM) return clamp(Math.min(width * 0.105, height * 0.2), 12, 17)
  return clamp(Math.min(width * 0.09, height * 0.17), 13, 20)
}

function metricFont(level, width, height) {
  if (level < LEVELS.VIEWERS) return 0
  if (level === LEVELS.VIEWERS) return clamp(Math.min(width * 0.1, height * 0.2), 9, 12)
  if (level === LEVELS.MOMENTUM) return clamp(Math.min(width * 0.085, height * 0.16), 10, 13)
  return clamp(Math.min(width * 0.075, height * 0.14), 10, 15)
}

function positive(value) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
