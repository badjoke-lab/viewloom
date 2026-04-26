type FillStyleDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => string | CanvasGradient | CanvasPattern
  set?: (this: CanvasRenderingContext2D, value: string | CanvasGradient | CanvasPattern) => void
}

// Blue / Violet Dominant palette: saturated violet, cyan, blue, magenta, and teal.
// Keeps the PR #28 edge-label clamp while testing a tighter ViewLoom color family.
const COLOR_REMAP = new Map<string, string>([
  ['#7DD3FC', '#7C3AED'],
  ['#A78BFA', '#06B6D4'],
  ['#F0ABFC', '#6366F1'],
  ['#F9A8D4', '#DB2777'],
  ['#FDBA74', '#0EA5E9'],
  ['#BEF264', '#9333EA'],
  ['#5EEAD4', '#14B8A6'],
  ['#93C5FD', '#4F46E5'],
  ['#C4B5FD', '#EC4899'],
  ['#FCA5A5', '#38BDF8'],
  ['#67E8F9', '#A855F7'],
  ['#86EFAC', '#2DD4BF'],
  ['#FDE68A', '#3B82F6'],
  ['#D8B4FE', '#D946EF'],
  ['#99F6E4', '#22D3EE'],
  ['#BFDBFE', '#8B5CF6'],
  ['#FBCFE8', '#10B981'],
  ['#FED7AA', '#818CF8'],
  ['#A7F3D0', '#F472B6'],
  ['#DDD6FE', '#67E8F9'],
])

function normalizeColor(value: string): string {
  return value.trim().toUpperCase()
}

function remapColor(value: string): string {
  return COLOR_REMAP.get(normalizeColor(value)) ?? value
}

function patchCanvasFillStyle(): void {
  const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'fillStyle') as FillStyleDescriptor | undefined
  if (!descriptor?.get || !descriptor?.set) return

  Object.defineProperty(CanvasRenderingContext2D.prototype, 'fillStyle', {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value: string | CanvasGradient | CanvasPattern) {
      descriptor.set?.call(this, typeof value === 'string' ? remapColor(value) : value)
    },
  })
}

function patchCanvasTextClamp(): void {
  const original = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function patchedFillText(text: string, x: number, y: number, maxWidth?: number) {
    const cssWidth = this.canvas.getBoundingClientRect().width || this.canvas.width
    const measured = this.measureText(String(text)).width
    const safeX = Math.max(4, Math.min(x, cssWidth - measured - 6))
    if (typeof maxWidth === 'number') return original.call(this, text, safeX, y, maxWidth)
    return original.call(this, text, safeX, y)
  }
}

function remapBandVars(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[style*="--band"]').forEach((element) => {
    const current = element.style.getPropertyValue('--band')
    if (current) element.style.setProperty('--band', remapColor(current))
  })
}

function observeBandVars(): void {
  remapBandVars()
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) remapBandVars(node)
      })
      if (record.target instanceof HTMLElement) remapBandVars(record.target)
    }
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style'],
    childList: true,
    subtree: true,
  })
}

patchCanvasFillStyle()
patchCanvasTextClamp()
observeBandVars()
