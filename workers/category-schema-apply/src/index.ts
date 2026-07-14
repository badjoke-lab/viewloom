import {
  applyCategorySchemaControlled,
  inspectCategorySchema,
} from '../../shared/category-schema'

type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
  APPLY_TOKEN: string
}

const CONFIRMATION = 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        provider: env.PROVIDER,
        mode: 'controlled_category_schema_apply',
        confirmationRequired: CONFIRMATION,
        categoryCaptureEnabledByWorker: false,
      })
    }

    if (request.method === 'POST' && url.pathname === '/inspect') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      try {
        return json({
          ok: true,
          provider: env.PROVIDER,
          schema: await inspectCategorySchema(env.DB),
          boundaries: safetyBoundaries(),
        })
      } catch (error) {
        return json({ ok: false, provider: env.PROVIDER, error: sanitizeError(error), boundaries: safetyBoundaries() }, 500)
      }
    }

    if (request.method === 'POST' && url.pathname === '/apply') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
        return json({ ok: false, error: 'confirmation_mismatch', confirmationRequired: CONFIRMATION }, 409)
      }

      try {
        const pre = await inspectCategorySchema(env.DB)
        if (pre.partial) {
          return json({
            ok: false,
            provider: env.PROVIDER,
            error: 'partial_schema_stop',
            pre,
            boundaries: safetyBoundaries(),
          }, 409)
        }

        const result = await applyCategorySchemaControlled(env.DB, { requireCompletelyAbsent: true })
        return json({
          ok: result.post.complete,
          provider: env.PROVIDER,
          result,
          boundaries: safetyBoundaries(),
        }, result.post.complete ? 200 : 500)
      } catch (error) {
        return json({
          ok: false,
          provider: env.PROVIDER,
          error: sanitizeError(error),
          boundaries: safetyBoundaries(),
        }, 500)
      }
    }

    return json({
      ok: false,
      error: 'not_found',
      routes: ['GET /health', 'POST /inspect', 'POST /apply'],
    }, 404)
  },
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function safetyBoundaries() {
  return {
    providerSeparated: true,
    categoryCaptureEnabledByWorker: false,
    productionCategoryRowsWrittenByWorker: false,
    collectorRouteAvailable: false,
    scheduledHandlerAvailable: false,
    backfillAvailable: false,
    retentionChanged: false,
    crossProviderOperation: false,
  }
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
}
