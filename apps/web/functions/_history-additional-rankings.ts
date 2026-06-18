type JsonRecord = Record<string, unknown>

export async function enrichHistoryAdditionalRankings(response: Response): Promise<Response> {
  return response
}

export function historyRankingsFromPayload(_payload: JsonRecord): JsonRecord {
  return { rankings: {}, rankingsMeta: {} }
}
