import './navigation/copy-current-view'

export type GtagEventParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(eventName: string, params: GtagEventParams = {}): void {
  window.gtag?.('event', eventName, params)
}
