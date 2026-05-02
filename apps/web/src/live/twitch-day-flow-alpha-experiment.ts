type AlphaDescriptor = PropertyDescriptor & {
  get?: (this: CanvasRenderingContext2D) => number
  set?: (this: CanvasRenderingContext2D, value: number) => void
}

const enabled = new URLSearchParams(window.location.search).get('bandFocus') === 'reverse'

function mapAlpha(value: number): number {
  if (!enabled) return value

  // Reverse focus experiment:
  // - initial unselected top bands should be fully vivid
  // - after a streamer is selected, the surrounding top bands should fall back
  //   around the normal default strength instead of becoming muddy
  if (Math.abs(value - 0.72) < 0.01) return 1
  if (Math.abs(value - 0.86) < 0.01) return 1
  if (Math.abs(value - 0.38) < 0.01) return 0.72
  if (Math.abs(value - 0.18) < 0.01) return 0.44
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
