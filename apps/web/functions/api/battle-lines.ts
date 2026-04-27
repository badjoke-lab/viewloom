export const onRequestGet: PagesFunction = async ({ request }) => {
  const source = new URL(request.url)
  const upstream = new URL('https://livefield.pages.dev/api/battle-lines')

  for (const [key, value] of source.searchParams.entries()) {
    upstream.searchParams.set(key, value)
  }

  const response = await fetch(upstream.toString(), {
    headers: { accept: 'application/json' },
  })

  const body = await response.text()
  return new Response(body, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
