const page = document.body.dataset.page || ''
const isBattleLinesPage = page === 'twitch-battle-lines' || page === 'kick-battle-lines'

const PRIMARY_A = '#7dd3fc'
const PRIMARY_B = '#f472b6'
const CONTEXT = '#8ea0bd'

if (isBattleLinesPage) {
  window.requestAnimationFrame(() => {
    ensureBattleLinesVisualPolishStyles()
    applyBattleLinesVisualPolish()
    observeBattleLinesChart()
  })
}

function observeBattleLinesChart(): void {
  const host = document.querySelector<HTMLElement>('[data-chart]')
  if (!host) return

  const observer = new MutationObserver(() => applyBattleLinesVisualPolish())
  observer.observe(host, { childList: true, subtree: true })
  window.addEventListener('resize', () => window.requestAnimationFrame(applyBattleLinesVisualPolish))
}

function applyBattleLinesVisualPolish(): void {
  const pageRoot = document.querySelector<HTMLElement>('.bl-page')
  const chartCard = document.querySelector<HTMLElement>('.bl-chart-card')
  const chart = document.querySelector<HTMLElement>('[data-chart]')
  const legend = document.querySelector<HTMLElement>('[data-legend]')
  const svg = chart?.querySelector<SVGSVGElement>('svg')

  pageRoot?.classList.add('bl-page--visual-polish')
  chartCard?.classList.add('bl-chart-card--visual-polish')
  if (!svg) return

  const isMobile = window.matchMedia('(max-width: 760px)').matches
  svg.classList.add('bl-chart-svg--visual-polish')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')

  const primaryPaths = Array.from(svg.querySelectorAll<SVGPathElement>('path[filter*="blLineGlow"]'))
  primaryPaths.slice(0, 2).forEach((path, index) => {
    const color = index === 0 ? PRIMARY_A : PRIMARY_B
    path.setAttribute('stroke', color)
    path.setAttribute('stroke-width', isMobile ? '3' : '3.2')
    path.setAttribute('opacity', '1')
    path.removeAttribute('filter')

    const shadow = previousPath(path)
    if (shadow) {
      shadow.setAttribute('stroke', color)
      shadow.setAttribute('stroke-width', isMobile ? '4.5' : '5')
      shadow.setAttribute('opacity', isMobile ? '.12' : '.14')
      shadow.setAttribute('fill', 'none')
    }
  })

  const contextPaths = Array.from(svg.querySelectorAll<SVGPathElement>('path[stroke-width="2"]'))
  contextPaths.forEach((path) => {
    if (primaryPaths.includes(path)) return
    path.setAttribute('stroke', CONTEXT)
    path.setAttribute('stroke-width', isMobile ? '1.1' : '1.25')
    path.setAttribute('opacity', isMobile ? '.08' : '.22')
    path.removeAttribute('filter')
  })

  const circles = Array.from(svg.querySelectorAll<SVGCircleElement>('circle'))
  circles.forEach((circle, index) => {
    const color = index % 2 === 0 ? PRIMARY_A : PRIMARY_B
    if (circle.getAttribute('fill') !== 'rgba(2,6,23,.96)') circle.setAttribute('fill', color)
    circle.setAttribute('stroke', color)
    circle.setAttribute('stroke-width', isMobile ? '2.6' : '3')
  })

  const labelRects = Array.from(svg.querySelectorAll<SVGRectElement>('rect[stroke]')).slice(-2)
  labelRects.forEach((rect, index) => {
    rect.setAttribute('stroke', index === 0 ? PRIMARY_A : PRIMARY_B)
    rect.setAttribute('stroke-width', '1.2')
    rect.setAttribute('fill', 'rgba(8,16,30,.96)')
    if (isMobile) {
      rect.setAttribute('width', '144')
      rect.setAttribute('height', '66')
    } else {
      rect.setAttribute('width', '116')
      rect.setAttribute('height', '48')
    }
  })

  const labelTexts = Array.from(svg.querySelectorAll<SVGTextElement>('text'))
  labelTexts.forEach((text) => {
    const fill = text.getAttribute('fill')?.toLowerCase()
    if (fill === '#45a3ff' || fill === '#c061ff') {
      text.setAttribute('fill', fill === '#45a3ff' ? PRIMARY_A : PRIMARY_B)
    }
    tuneChartText(text, isMobile)
  })

  if (legend) {
    const items = Array.from(legend.querySelectorAll<HTMLElement>('span'))
    if (items[0]) items[0].style.setProperty('--c', PRIMARY_A)
    if (items[1]) items[1].style.setProperty('--c', PRIMARY_B)
    if (items[2]) items[2].style.setProperty('--c', CONTEXT)
  }
}

function tuneChartText(text: SVGTextElement, isMobile: boolean): void {
  const value = text.textContent?.trim() ?? ''
  const fill = text.getAttribute('fill')?.toLowerCase() ?? ''
  const weight = text.getAttribute('font-weight')
  const isAxisLabel = /^(0|\d+k)$/.test(value) || /^\d{2}:\d{2}$/.test(value)
  const isStreamerLabel = fill === PRIMARY_A.toLowerCase() || fill === PRIMARY_B.toLowerCase() || fill === '#f472b6' || fill === '#7dd3fc'
  const isEndpointValue = weight === '700' && /^\d/.test(value)
  const isNow = value === 'Now'

  if (isMobile) {
    if (isStreamerLabel) {
      text.setAttribute('font-size', '22')
      text.setAttribute('font-weight', '850')
    } else if (isEndpointValue) {
      text.setAttribute('font-size', '21')
      text.setAttribute('font-weight', '800')
    } else if (isAxisLabel) {
      text.setAttribute('font-size', '38')
      text.setAttribute('font-weight', '800')
    } else if (isNow) {
      text.setAttribute('font-size', '16')
      text.setAttribute('font-weight', '700')
    }
    return
  }

  if (isStreamerLabel || isEndpointValue) {
    text.setAttribute('font-size', '13.5')
    text.setAttribute('font-weight', isStreamerLabel ? '850' : '760')
  } else if (isAxisLabel) {
    text.setAttribute('font-size', '14')
    text.setAttribute('font-weight', '620')
  } else if (isNow) {
    text.setAttribute('font-size', '13')
    text.setAttribute('font-weight', '650')
  }
}

function previousPath(path: SVGPathElement): SVGPathElement | null {
  let node = path.previousElementSibling
  while (node) {
    if (node instanceof SVGPathElement) return node
    node = node.previousElementSibling
  }
  return null
}

function ensureBattleLinesVisualPolishStyles(): void {
  if (document.querySelector('#battle-lines-visual-polish-styles')) return

  const style = document.createElement('style')
  style.id = 'battle-lines-visual-polish-styles'
  style.textContent = `
.bl-page--visual-polish {
  --bl-primary-a: ${PRIMARY_A};
  --bl-primary-b: ${PRIMARY_B};
  --bl-context: ${CONTEXT};
}

.bl-chart-card--visual-polish {
  padding: 22px;
}

.bl-chart-card--visual-polish .bl-chart-head {
  margin-bottom: 14px;
}

.bl-chart-card--visual-polish .bl-chart {
  height: clamp(460px, 52vw, 640px);
  background: radial-gradient(circle at 50% 0%, rgba(30, 41, 59, .16), transparent 42%), #07101d;
}

.bl-chart-card--visual-polish .bl-chart svg line[stroke*='148,163,184'] {
  stroke-opacity: .72;
}

.bl-chart-card--visual-polish .bl-chart svg polygon {
  opacity: .18;
}

.bl-chart-card--visual-polish .bl-chart svg rect[fill*='251,191,36'] {
  opacity: .38;
}

.bl-chart-card--visual-polish .bl-inspector {
  margin-top: 16px;
}

.bl-page--visual-polish [data-group='layout'] small {
  align-self: center;
  padding: 0 6px;
  color: var(--muted);
  font-size: .72rem;
  line-height: 1.2;
  white-space: normal;
}

.bl-page--visual-polish [data-group='layout'][data-split-available='false'] button[data-layout='split'],
.bl-page--visual-polish .bl-controls[data-split-available='false'] [data-group='layout'] button[data-layout='split'] {
  opacity: .48;
  cursor: not-allowed;
}

@media (min-width: 1200px) {
  .bl-page--visual-polish[data-effective-layout='split'] .bl-chart-card--visual-polish .bl-chart {
    min-height: clamp(540px, 66vh, 760px);
  }
}

@media (max-width: 1199px) {
  .bl-page--visual-polish .bl-controls[data-split-available='false'] [data-group='layout'] small {
    display: inline-flex;
  }
}

@media (max-width: 760px) {
  .bl-chart-card--visual-polish {
    padding: 12px;
  }

  .bl-chart-card--visual-polish .bl-chart-head {
    gap: 6px;
    margin-bottom: 10px;
  }

  .bl-chart-card--visual-polish .bl-chart {
    height: clamp(320px, 88vw, 380px);
    border-radius: 16px;
  }

  .bl-page--visual-polish [data-group='layout'] {
    display: none;
  }

  .bl-chart-card--visual-polish [data-legend] span:nth-child(n + 3) {
    display: none;
  }

  .bl-chart-card--visual-polish .bl-inspector > div:nth-child(n + 5) {
    display: none;
  }
}

@media (max-width: 420px) {
  .bl-chart-card--visual-polish .bl-chart {
    height: 335px;
  }
}
`
  document.head.append(style)
}
