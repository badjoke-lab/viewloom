export type Env = {
  DB_TWITCH_HOT: D1Database
  DB_KICK_HOT?: D1Database
  INGEST_TOKEN: string
  TWITCH_CLIENT_ID: string
  TWITCH_CLIENT_SECRET: string
  KICK_INGEST_TOKEN?: string
}
