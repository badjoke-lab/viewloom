import './battle-lines-status-entry'
import './battle-lines-chart-precision.css'

function decorateBattleLinesChart(): void {
  const svg = document.querySelector<SVGSVGElement>('.bl-chart svg')
  if (!svg || svg.dataset.precision === 'true') return

  svg.dataset.precision = 'true'

  const contextPaths = Array.from(svg.querySelectorAll<SVGPathElement>('path[opacity]'))
  contextPaths.forEach((path, index) => {
    path.classList.add('bl-context-line')
    path.dataset.contextIndex = String(index)
    if (index >= 3) path.setAttribute('opacity', '0.14')
  })

  const primaryPaths = Array.from(svg.querySelectorAll<SVGPathElement>('path[stroke-width="4"]')).slice(0, 2)
  const selectedCursor = Array.from(svg.querySelectorAll<SVGLineElement>('line')).find((line) => line.getAttribute('stroke') === 'rgba(255,255,255,.84)')
  const selectedX = Number(selectedCursor?.getAttribute('x1'))

  if (Number.isFinite(selectedX) && primaryPaths.length > 0) {
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    layer.classList.add('bl-selected-points')

    primaryPaths.forEach((path) => {
      const point = getPointAtX(path, selectedX)
      if (!point) return
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.classList.add('bl-selected-point')
      circle.setAttribute('cx', String(point.x))
      circle.setAttribute('cy', String(point.y))
      circle.setAttribute('r', '6')
      circle.setAttribute('fill', path.getAttribute('stroke') ?? '#eef4ff')
      circle.setAttribute('stroke', '#07101d')
      circle.setAttribute('stroke-width', '3')
      layer.appendChild(circle)
    })

    svg.appendChild(layer)
  }

  nudgeEndpointLabels(svg)
}

function getPointAtX(path: SVGPathElement, x: number): DOMPoint | null {
  try {
    const length = path.getTotalLength()
    let best: DOMPoint | null = null
    let bestDelta = Number.POSITIVE_INFINITY
    const samples = 120

    for (let step = 0; step <= samples; step += 1) {
      const point = path.getPointAtLength((length * step) / samples)
      const delta = Math.abs(point.x - x)
      if (delta < bestDelta) {
        best = point
        bestDelta = delta
      }
    }

    return best
  } catch {
    return null
  }
}

function nudgeEndpointLabels(svg: SVGSVGElement): void {
  const endpointRects = Array.from(svg.querySelectorAll<SVGRectElement>('rect[stroke]')).filter((rect) => {
    const stroke = rect.getAttribute('stroke') ?? ''
    return !stroke.includes('255,255,255')
  })

  endpointRects.forEach((rect, index) => {
    rect.classList.add('bl-endpoint-box')
    rect.dataset.endpointIndex = String(index)
    const y = Number(rect.getAttribute('y'))
    if (!Number.isFinite(y)) return

    endpointRects.slice(0, index).forEach((previous) => {
      const prevY = Number(previous.getAttribute('y'))
      if (Number.isFinite(prevY) && Math.abs(prevY - y) < 34) {
        const offset = index % 2 === 0 ? 26 : -26
        rect.setAttribute('y', String(y + offset))
        const siblingTexts = Array.from(svg.querySelectorAll<SVGTextElement>('text')).filter((text) => {
          const tx = Number(text.getAttribute('x'))
          const ty = Number(text.getAttribute('y'))
          const rx = Number(rect.getAttribute('x'))
          return Number.isFinite(tx) && Number.isFinite(ty) && Number.isFinite(rx) && Math.abs(tx - (rx + 8)) < 2 && Math.abs(ty - (y + 16)) < 28
        })
        siblingTexts.forEach((text) => text.setAttribute('y', String(Number(text.getAttribute('y')) + offset)))
      }
    })
  })
}

const observer = new MutationObserver(() => decorateBattleLinesChart())
observer.observe(document.body, { childList: true, subtree: true })
decorateBattleLinesChart()
