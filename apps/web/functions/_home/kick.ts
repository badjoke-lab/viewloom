import { kickCoverageFromPayload } from '../_kick-coverage'
import { buildProviderHomePayload, buildProviderHomeResponse, type ProviderHomeConfig } from './model'

type LatestCoverageRow = { payload_json: string; source_mode: string }

export async function buildKickHomeResponse(config: ProviderHomeConfig): Promise<Response> {
  try {
    const payload = await buildProviderHomePayload(config)
    const latest = await config.db.prepare('SELECT payload_json,source_mode FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1').bind('kick').first<LatestCoverageRow>()
    const coverage = kickCoverageFromPayload(latest?.payload_json, latest?.source_mode ?? payload.sourceMode)

    return Response.json({
      ...payload,
      sourceMode: coverage.sourceMode,
      coverage: {
        ...payload.coverage,
        mode: coverage.mode,
        label: `Top ${config.topLimit} observed · ${coverage.label}`,
        note: coverage.publicNote,
      },
      coverageModel: {
        mode: coverage.mode,
        targetSource: coverage.targetSource,
        sourceMode: coverage.sourceMode,
        authMode: coverage.authMode,
        label: coverage.label,
        isDirectoryCoverage: coverage.isDirectoryCoverage,
        isProviderWide: coverage.isProviderWide,
        isBounded: coverage.isBounded,
        description: coverage.description,
        limitation: coverage.limitation,
      },
      notes: [...payload.notes.filter((note) => !note.includes('candidate based rather than Twitch-parity')), coverage.publicNote],
    }, { headers: { 'cache-control': 'no-store' } })
  } catch {
    return buildProviderHomeResponse(config)
  }
}
