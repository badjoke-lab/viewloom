export type TwitchCurrentSnapshotItem = {
  twitchUserId: string | null
  userLogin: string
  displayName: string
  viewers: number
  url: string
}

export function extractTwitchCurrentSnapshotItems(payloadJson: string): TwitchCurrentSnapshotItem[]
