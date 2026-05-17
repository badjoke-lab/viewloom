const page = document.body.dataset.page || ''
const endpoint = page === 'kick-day-flow'
  ? '/api/kick-day-flow'
  : page === 'kick-battle-lines'
    ? '/api/kick-battle-lines'
    : page === 'kick-history'
      ? '/api/kick-history'
      : ''

if (endpoint) setTimeout(() => void mount(), 900)

async function mount(): Promise<void> {
  const main = document.querySelector<HTMLElement>('.page-main')
  if (!main || document.querySelector('[data-kick-debug]')) return

  const details = document.createElement('details')
  details.dataset.kickDebug = 'true'
  details.className = 'kick-debug'
  details.innerHTML = '<summary>Debug details</summary><pre>Loading Kick debug...</pre>'
  main.appendChild(details)
  addStyle()

  const pre = details.querySelector('pre')
  if (!pre) return
  try {
    const response = await fetch(endpoint, { cache: 'no-store' })
    const data = await response.json()
    pre.textContent = JSON.stringify({ endpoint, httpStatus: response.status, ok: response.ok, payload: data }, null, 2)
  } catch (error) {
    pre.textContent = JSON.stringify({ endpoint, error: error instanceof Error ? error.message : String(error) }, null, 2)
  }
}

function addStyle(): void {
  if (document.getElementById('kick-debug-style')) return
  const style = document.createElement('style')
  style.id = 'kick-debug-style'
  style.textContent = `.kick-debug{margin:18px 0 42px;padding:14px 16px;border:1px solid rgba(74,222,128,.22);border-radius:18px;background:rgba(15,23,42,.76);color:var(--text)}.kick-debug summary{cursor:pointer;font-weight:700;color:#cbd5e1}.kick-debug pre{margin:14px 0 0;max-height:460px;overflow:auto;white-space:pre-wrap;word-break:break-word;border:1px solid rgba(148,163,184,.14);border-radius:14px;background:rgba(2,6,23,.52);padding:12px;color:#dcfce7;font-size:12px;line-height:1.55}`
  document.head.appendChild(style)
}
