type GtagArguments = [command: 'js', value: Date] | [command: 'config', targetId: string, config?: GtagConfig] | [command: 'event', eventName: string, params?: GtagEventParams]

type GtagConfig = {
  page_title?: string
  page_location?: string
  page_path?: string
  send_page_view?: boolean
}

export type GtagEventParams = Record<string, string | number | boolean | null | undefined>

declare global {
  interface Window {
    dataLayer?: GtagArguments[]
    gtag?: (...args: GtagArguments) => void
  }
}

const DEFAULT_MEASUREMENT_ID = 'G-YHX7HS1VBK'
const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim() || DEFAULT_MEASUREMENT_ID

if (measurementId) {
  loadGoogleTag(measurementId)
}

export function trackEvent(eventName: string, params: GtagEventParams = {}): void {
  if (!measurementId || !window.gtag) return
  window.gtag('event', eventName, params)
}

function loadGoogleTag(id: string): void {
  window.dataLayer = window.dataLayer ?? []
  window.gtag = (...args: GtagArguments) => {
    window.dataLayer?.push(args)
  }

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.append(script)

  const pageParams = {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.search,
  }

  window.gtag('js', new Date())
  window.gtag('config', id, {
    ...pageParams,
    send_page_view: false,
  })
  window.gtag('event', 'page_view', pageParams)
}
