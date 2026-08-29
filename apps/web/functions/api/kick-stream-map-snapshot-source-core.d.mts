export type KickStreamMapSnapshotItem = {
  slug: string
  displayName: string
  viewer_count: number
  url: string
  broadcaster_user_id: string | null
}

export function extractKickStreamMapSnapshotItems(payloadJson: string): KickStreamMapSnapshotItem[]
