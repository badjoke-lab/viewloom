import { KICK_REVIEWED_CITY_RUNTIME_DATA } from '../apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs'

export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION = 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1'

/* Review staging is intentionally kept outside apps/web/functions. Production
 * runtime data flows one-way into staging so pending reviewed outcomes can be
 * appended without duplicating the already-consumed catalog. Production code
 * never imports this staging module.
 */
export const KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA = Object.freeze([
  ...KICK_REVIEWED_CITY_RUNTIME_DATA,
])
