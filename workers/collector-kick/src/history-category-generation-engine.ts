export type KickHistoryCategoryGenerationEngine = 'v1' | 'v2' | 'none'

export function resolveKickHistoryCategoryGenerationEngine(
  masterEnabled: string | undefined,
  selector: string | undefined,
): KickHistoryCategoryGenerationEngine {
  if (masterEnabled !== 'true') return 'none'
  if (selector === undefined) return 'v1'
  if (selector === 'v1') return 'v1'
  if (selector === 'v2') return 'v2'
  return 'none'
}
