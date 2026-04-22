export type TwitchHeatmapApiResponse = {
  ok: boolean
  provider: string
  latest: {
    provider: string
    bucket_minute: string
    collected_at: string
    covered_pages: number
    has_more: number
    stream_count: number
    total_viewers: number
    payload_json: string
    source_mode: string
  } | null
  status: {
    provider: string
    status: string
    last_attempt_at: string | null
    last_success_at: string | null
    last_failure_at: string | null
    last_error: string | null
    latest_bucket_minute: string | null
    latest_collected_at: string | null
    latest_stream_count: number
    latest_total_viewers: number
    covered_pages: number
    has_more: number
    updated_at: string
  } | null
}

export type HeatmapItem = {
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number
}

export type TwitchHeatmapPayload = {
  provider: string
  bucketMinute: string
  items: HeatmapItem[]
}

export type TileLayout = HeatmapItem & {
  x: number
  y: number
  width: number
  height: number
}

export const CANVAS_WIDTH = 1600
export const CANVAS_HEIGHT = 960
export const AUTO_REFRESH_MS = 60_000
