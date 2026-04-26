type FillStyleDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => string | CanvasGradient | CanvasPattern
  set?: (this: CanvasRenderingContext2D, value: string | CanvasGradient | CanvasPattern) => void
}

// ViewLoom Aurora palette: saturated cyan / violet / magenta / teal family.
// This replaces the previous low-saturation remap while keeping the non-color label clamp fix in this PR.
const COLOR_REMAP = new Map<string, string>([
  ['#7DD3FC', '#8B5CF6'],
  ['#A78BFA', '#22D3EE'],
  ['#F0ABFC', '#F472B6'],
  ['#F9A8D4', '#60A5FA'],
  ['#FDBA74', '#2DD4BF'],
  ['#BEF264', '#C084FC'],
  ['#5EEAD4', '#38BDF8'],
  ['#93C5FD', '#E879F9'],
  ['#C4B5FD', '#818CF8'],
  ['#FCA5A5', '#34D399'],
  ['#67E8F9', '#FB7185'],
  ['#86EFAC', '#06B6D4'],
  ['#FDE68A', '#A78BFA'],
  ['#D8B4FE', '#D946EF'],
  ['#99F6E4', '#3B82F6'],
  ['#BFDBFE', '#14B8A6'],
  ['#FBCFE8', '#EC4899'],
  ['#FED7AA', '#67E8F9'],
  ['#A7F3D0', '#6366F1'],
  ['#DDD6FE', '#10B981'],
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
