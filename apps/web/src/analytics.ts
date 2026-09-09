import './navigation/copy-current-view'

export type GtagEventParams = Record<string, string | number | boolean | null | undefined>

const GA4_MEASUREMENT_ID = 'G-YHX7HS1VBK'

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
    __viewloomGa4Configured?: boolean
  }
}

function ensureGa4(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src*="googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"]`,
  )

  // The Portal still carries the historical inline bootstrap. Treat that as
  // authoritative instead of sending a second config event for the same ID.
  if (window.gtag && existingScript) {
    window.__viewloomGa4Configured = true
    return
  }

  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? ((...args: unknown[]) => {
    window.dataLayer?.push(args)
  })

  if (!existingScript) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    script.dataset.viewloomGa4 = 'true'
    document.head.append(script)
  }

  if (!window.__viewloomGa4Configured) {
    window.gtag('js', new Date())
    window.gtag('config', GA4_MEASUREMENT_ID)
    window.__viewloomGa4Configured = true
  }
}

ensureGa4()

export function trackEvent(eventName: string, params: GtagEventParams = {}): void {
  window.gtag?.('event', eventName, params)
}
