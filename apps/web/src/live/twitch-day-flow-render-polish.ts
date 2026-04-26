type FillStyleDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => string | CanvasGradient | CanvasPattern
  set?: (this: CanvasRenderingContext2D, value: string | CanvasGradient | CanvasPattern) => void
}

// Neon Signal palette: saturated live-stream style cyan / violet / pink / mint / blue family.
// This keeps the label clamp fix from the previous render polish and only changes the band color mapping.
const COLOR_REMAP = new Map<string, string>([
  ['#7DD3FC', '#9D5CFF'],
  ['#A78BFA', '#00D4FF'],
  ['#F0ABFC', '#FF4FB8'],
  ['#F9A8D4', '#39FFCE'],
  ['#FDBA74', '#5E8CFF'],
  ['#BEF264', '#C45CFF'],
  ['#5EEAD4', '#00B8FF'],
  ['#93C5FD', '#FF6B9E'],
  ['#C4B5FD', '#42E8A8'],
  ['#FCA5A5', '#7C6CFF'],
  ['#67E8F9', '#E056FD'],
  ['#86EFAC', '#00F0FF'],
  ['#FDE68A', '#FF3D81'],
  ['#D8B4FE', '#3BFFB8'],
  ['#99F6E4', '#4D9DFF'],
  ['#BFDBFE', '#B26CFF'],
  ['#FBCFE8', '#18C8FF'],
  ['#FED7AA', '#FF7AC8'],
  ['#A7F3D0', '#5CFFD6'],
  ['#DDD6FE', '#6F8CFF'],
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
