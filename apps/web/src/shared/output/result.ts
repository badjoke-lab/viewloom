export type OutputOperationFailureCode =
  | 'invalid-request'
  | 'clipboard-unavailable'
  | 'clipboard-failed'
  | 'download-unavailable'
  | 'download-failed'

export type OutputOperationResult =
  | { ok: true }
  | { ok: false; code: OutputOperationFailureCode; error?: unknown }

export function outputSuccess(): OutputOperationResult {
  return { ok: true }
}

export function outputFailure(
  code: OutputOperationFailureCode,
  error?: unknown,
): OutputOperationResult {
  return error === undefined ? { ok: false, code } : { ok: false, code, error }
}
