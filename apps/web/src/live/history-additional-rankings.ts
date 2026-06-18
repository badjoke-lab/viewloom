type RankingSort = 'viewer_minutes' | 'peak_viewers' | 'avg_viewers' | 'observed_minutes' | 'rising'

type Streamer = Record<string, unknown>
type RankingPayload = Record<string, unknown>

export function installHistoryAdditionalRankings(): void {
  void document
}

installHistoryAdditionalRankings()
