import {
  outputFailure,
  outputSuccess,
  type OutputOperationResult,
} from './result.js'

export type TextDownloadRequest = {
  name: string
  content: string
  mimeType: string
  revokeDelayMs?: number
}

export type TextDownloadAnchor = {
  href: string
  download: string
  hidden: boolean
  click(): void
  remove(): void
}

export type TextDownloadRuntime = {
  createBlob(content: string, mimeType: string): unknown
  createObjectURL(blob: unknown): string
  revokeObjectURL(url: string): void
  createAnchor(): TextDownloadAnchor
  appendAnchor(anchor: TextDownloadAnchor): void
  schedule(callback: () => void, delayMs: number): unknown
}

export function downloadTextFile(
  request: TextDownloadRequest,
  runtime: TextDownloadRuntime | null = browserTextDownloadRuntime(),
): OutputOperationResult {
  if (!request.name.trim() || !request.mimeType.trim()) {
    return outputFailure('invalid-request')
  }
  if (!runtime) return outputFailure('download-unavailable')

  let anchor: TextDownloadAnchor | undefined
  let objectUrl = ''
  try {
    const blob = runtime.createBlob(request.content, request.mimeType)
    objectUrl = runtime.createObjectURL(blob)
    anchor = runtime.createAnchor()
    anchor.href = objectUrl
    anchor.download = request.name
    anchor.hidden = true
    runtime.appendAnchor(anchor)
    anchor.click()
    anchor.remove()
    anchor = undefined
    runtime.schedule(
      () => runtime.revokeObjectURL(objectUrl),
      Math.max(0, request.revokeDelayMs ?? 0),
    )
    return outputSuccess()
  } catch (error) {
    anchor?.remove()
    if (objectUrl) {
      try {
        runtime.revokeObjectURL(objectUrl)
      } catch {
        // The original transport error remains the useful failure.
      }
    }
    return outputFailure('download-failed', error)
  }
}

function browserTextDownloadRuntime(): TextDownloadRuntime | null {
  if (
    typeof Blob === 'undefined'
    || typeof URL === 'undefined'
    || typeof URL.createObjectURL !== 'function'
    || typeof document === 'undefined'
  ) return null

  return {
    createBlob: (content, mimeType) => new Blob([content], { type: mimeType }),
    createObjectURL: (blob) => URL.createObjectURL(blob as Blob),
    revokeObjectURL: (url) => URL.revokeObjectURL(url),
    createAnchor: () => document.createElement('a'),
    appendAnchor: (anchor) => document.body.append(anchor as HTMLAnchorElement),
    schedule: (callback, delayMs) => window.setTimeout(callback, delayMs),
  }
}
