type AlphaDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => number
  set?: (this: CanvasRenderingContext2D, value: number) => void
}

const enabled = new URLSearchParams(window.location.search).get('bandFocus') === 'reverse'

function mapAlpha(value: number): number {
  if (!enabled) return value
  if (Math.abs(value - 0.72) < 0.01) return 0.96
  if (Math.abs(value - 0.86) < 0.01) return 0.98
  if (Math.abs(value - 0.38) < 0.01) return 0.54
  if (Math.abs(value - 0.18) < 0.01) return 0.42
  return value
}

const descriptor = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalAlpha') as AlphaDescriptor | undefined

if (descriptor?.get && descriptor.set) {
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'globalAlpha', {
    configurable: true,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set(value: number) {
      descriptor.set?.call(this, mapAlpha(value))
    },
  })
}
