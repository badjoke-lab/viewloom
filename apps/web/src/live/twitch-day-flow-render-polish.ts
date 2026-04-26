type FillStyleDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => string | CanvasGradient | CanvasPattern
  set?: (this: CanvasRenderingContext2D, value: string | CanvasGradient | CanvasPattern) => void
}

const COLOR_REMAP = new Map<string, string>([
  ['#7DD3FC', '#5A9FC2'],
  ['#A78BFA', '#7467B8'],
  ['#F0ABFC', '#9960AA'],
  ['#F9A8D4', '#A85D7A'],
  ['#FDBA74', '#A86F3E'],
  ['#BEF264', '#6F8948'],
  ['#5EEAD4', '#3F9488'],
  ['#93C5FD', '#557CA8'],
  ['#C4B5FD', '#7668A5'],
  ['#FCA5A5', '#9B565D'],
  ['#67E8F9', '#3E8EA4'],
  ['#86EFAC', '#4D8E63'],
  ['#FDE68A', '#A18A48'],
  ['#D8B4FE', '#8366A5'],
  ['#99F6E4', '#5A9B8D'],
  ['#BFDBFE', '#6E87A6'],
  ['#FBCFE8', '#9D6D87'],
  ['#FED7AA', '#A17652'],
  ['#A7F3D0', '#61977E'],
  ['#DDD6FE', '#8179A7'],
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
