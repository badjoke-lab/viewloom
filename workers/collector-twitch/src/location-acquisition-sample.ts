import {
  extractProfileLocationCandidates,
  extractTagLocationCandidates,
  extractTitleLocationCandidates,
  type TwitchLocationEvidenceInput,
} from './location-evidence-audit'

type AcquisitionStream = TwitchLocationEvidenceInput & {
  userLogin?: unknown
}

export type UnknownLocationAcquisitionRecord = {
  observedRank: number
  userId: string
  userLogin: string
  twitchAboutUrl: string
}

export function buildUnknownLocationAcquisitionSample(
  streams: AcquisitionStream[],
  limit = 20,
) {
  const records: UnknownLocationAcquisitionRecord[] = []
  const seenUsers = new Set<string>()

  for (let index = 0; index < streams.length; index += 1) {
    const stream = streams[index]
    const userId = String(stream?.userId ?? '').trim()
    const userLogin = String(stream?.userLogin ?? '').trim()
    const stableKey = userId || userLogin.toLocaleLowerCase('en-US')
    if (!stableKey || !userLogin || seenUsers.has(stableKey)) continue
    seenUsers.add(stableKey)

    const profileCandidates = extractProfileLocationCandidates(stream?.profileDescription)
    const titleCandidates = extractTitleLocationCandidates(stream?.title).candidates
    const tagCandidates = extractTagLocationCandidates(stream?.tags)
    if (profileCandidates.length > 0 || titleCandidates.length > 0 || tagCandidates.length > 0) continue

    records.push({
      observedRank: index + 1,
      userId,
      userLogin,
      twitchAboutUrl: `https://www.twitch.tv/${encodeURIComponent(userLogin)}/about`,
    })
    if (records.length >= limit) break
  }

  return {
    scope: 'top_ranked_native_candidate_unknown_users' as const,
    purpose: 'bounded_external_profile_review' as const,
    rawProfileTitleTagIncluded: false,
    requestedLimit: limit,
    recordCount: records.length,
    records,
  }
}
