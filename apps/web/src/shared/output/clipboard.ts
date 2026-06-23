import {
  outputFailure,
  outputSuccess,
  type OutputOperationResult,
} from './result.js'

export type ClipboardFallbackElement = {
  value: string
  style: { position: string; opacity: string }
  select(): void
  remove(): void
}

export type ClipboardFallbackDocument = {
  body: { append(node: ClipboardFallbackElement): void }
  createElement(tagName: 'textarea'): ClipboardFallbackElement
  execCommand(command: 'copy'): boolean
}

export type ClipboardRuntime = {
  writeText?: (text: string) => Promise<void>
  fallbackDocument?: ClipboardFallbackDocument
}

export async function writeTextToClipboard(
  text: string,
  runtime: ClipboardRuntime = browserClipboardRuntime(),
): Promise<OutputOperationResult> {
  if (runtime.writeText) {
    try {
      await runtime.writeText(text)
      return outputSuccess()
    } catch (error) {
      return outputFailure('clipboard-failed', error)
    }
  }

  const fallbackDocument = runtime.fallbackDocument
  if (!fallbackDocument) return outputFailure('clipboard-unavailable')

  let textarea: ClipboardFallbackElement | undefined
  try {
    textarea = fallbackDocument.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    fallbackDocument.body.append(textarea)
    textarea.select()
    return fallbackDocument.execCommand('copy')
      ? outputSuccess()
      : outputFailure('clipboard-unavailable')
  } catch (error) {
    return outputFailure('clipboard-failed', error)
  } finally {
    textarea?.remove()
  }
}

function browserClipboardRuntime(): ClipboardRuntime {
  const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined
  const fallbackDocument = typeof document !== 'undefined'
    ? document as unknown as ClipboardFallbackDocument
    : undefined

  return {
    writeText: clipboard?.writeText ? clipboard.writeText.bind(clipboard) : undefined,
    fallbackDocument,
  }
}
