export function formatIso(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSignedPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatCompactViewers(value: number): string {
  const absolute = Math.abs(value)

  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`
  }

  return value.toLocaleString()
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
