const PRODUCTION_ORIGIN = 'https://vl.badjoke-lab.com'
const PREVIEW_ROUTES = new Set(['/api/day-flow', '/api/kick-day-flow'])

export const onRequest: PagesFunction = async ({ request, next }) => {
  const url = new URL(request.url)

  if (!url.hostname.endsWith('.pages.dev') || !PREVIEW_ROUTES.has(url.pathname)) {
    return next()
  }

  const upstream = new URL(url.pathname + url.search, PRODUCTION_ORIGIN)
  const headers = new Headers(request.headers)
  headers.set('accept', 'application/json')
  headers.set('x-viewloom-preview-proxy', '1')

  try {
    const response = await fetch(upstream.toString(), {
      method: request.method,
      headers,
      redirect: 'follow',
    })

    const proxiedHeaders = new Headers(response.headers)
    proxiedHeaders.set('cache-control', 'no-store')
    proxiedHeaders.set('x-viewloom-data-origin', 'production')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: proxiedHeaders,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({
      ok: false,
      state: 'error',
      status: 'Error',
      note: 'Preview could not reach the production Day Flow API.',
      error: { code: 'preview_day_flow_proxy_error', message },
    }, {
      status: 502,
      headers: {
        'cache-control': 'no-store',
        'x-viewloom-data-origin': 'preview-proxy-error',
      },
    })
  }
}
